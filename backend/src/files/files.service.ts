import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { AuditAction } from '../audit/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth-user';
import { RequestContext } from '../common/request-context';
import { AppConfig } from '../config/configuration';
import { StorageService } from '../storage/storage.service';
import { FileResponseDto } from './dto/file-response.dto';
import { UploadRulesDto } from './dto/upload-rules.dto';
import { StoredFile } from './entities/stored-file.entity';
import { FilePolicy, FileScope } from './file.policy';
import {
  FILE_TYPE_CATALOG,
  getExtension,
  sanitizeFileName,
} from './file-types';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly allowedExtensions: string[];
  private readonly maxUploadBytes: number;

  constructor(
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly policy: FilePolicy,
    config: ConfigService<AppConfig, true>,
  ) {
    this.allowedExtensions = config.get('files.allowedExtensions', {
      infer: true,
    });
    this.maxUploadBytes = config.get('files.maxUploadBytes', { infer: true });
  }

  uploadRules(): UploadRulesDto {
    return {
      maxUploadBytes: this.maxUploadBytes,
      allowedExtensions: this.allowedExtensions,
    };
  }

  //Función para realizar la carga de archivos
  async upload(
    user: AuthUser,
    upload: Express.Multer.File | undefined,
    context: RequestContext,
  ): Promise<FileResponseDto> {
    if (!upload) { //Validación si trae un archivo o no 
      throw new BadRequestException(
        'Debe adjuntar un archivo en el campo "file"',
      );
    }

    if (upload.size === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    //Para validar la extensión, obtenemos la del arhcivo original y validamos que sea de las permitidas
    //También se sanitiza el nombre por si viene con caracteres maliciososo o delicados
    const originalName = sanitizeFileName(upload.originalname);
    const extension = getExtension(originalName);
    if (!this.allowedExtensions.includes(extension)) {
      throw new UnsupportedMediaTypeException(
        `Tipo de archivo no permitido. Extensiones permitidas: ${this.allowedExtensions.join(', ')}`,
      );
    }
    const mimeType = FILE_TYPE_CATALOG[extension];

    const storageKey = randomUUID(); //Generamos un identificador aleatorio

    await this.storage.put(storageKey, upload.buffer, mimeType);

    //Aquí se persiste la información de file en la BD
    let saved: StoredFile;
    try {
      saved = await this.files.save(
        this.files.create({
          originalName,
          storageKey,
          mimeType,
          sizeBytes: upload.size,
          checksumSha256: createHash('sha256')
            .update(upload.buffer)
            .digest('hex'),
          ownerId: user.id,
          areaId: user.areaId,
        }),
      );
    } catch (error) {
      await this.storage.delete(storageKey).catch((cleanupError: unknown) =>
        this.logger.error(
          `No se pudo eliminar el archivo huérfano ${storageKey}`,
          cleanupError instanceof Error ? cleanupError.stack : cleanupError,
        ),
      );
      throw error;
    }

    //Registramos el movimiento en la auditoría con una acción de UPLOAD
    await this.audit.log({
      action: AuditAction.UPLOAD,
      actor: user,
      file: saved,
      context,
      details: { sizeBytes: saved.sizeBytes, mimeType: saved.mimeType },
    });

    const created = await this.files.findOneOrFail({
      where: { id: saved.id },
      relations: { owner: true, area: true },
    });

    return this.toResponse(created, user); //Retornamos la info según el FileResponseDto
  }

  //Método para listar los documentos Propios de momento
  async list(user: AuthUser): Promise<FileResponseDto[]> {
    const query = this.baseQuery().orderBy('file.createdAt', 'DESC');



    //Aplicamos el scope y enviamos el usuario como parametro, el usuario contiene data del rol entonces ya podemos ir haciendo filtros
    this.applyScope(query, this.policy.visibleScope(user));

    const files = await query.getMany();
    return files.map((file) => this.toResponse(file, user));
  }

  //función para descargar
  async download(
    user: AuthUser,
    fileId: string,
    context: RequestContext,
  ): Promise<{ file: StoredFile; stream: Readable }> {
    const file = await this.findAccessible(user, fileId);
    const stream = await this.storage.getStream(file.storageKey);

    //Agregamos la acción de auditoría , para DOWNLOAD para tener trzabilidad de lo que está descargando cierto usuario
    await this.audit.log({
      action: AuditAction.DOWNLOAD,
      actor: user,
      file,
      context,
    });

    return { file, stream };
  }


  //Función para eliminar archivos
  async remove(
    user: AuthUser,
    fileId: string,
    context: RequestContext,
  ): Promise<void> {
    const file = await this.findAccessible(user, fileId);

    //Validamos los permisos de eliminación nuevamente
    if (!this.policy.canDelete(user, file)) {
      throw new ForbiddenException(
        'No tiene permiso para eliminar este archivo',
      );
    }

    //Actualizamos la información del archivo, como tal no eliminamos nada de la bd ni del disco, deletedat actua como la bandera lógica para identificar si se elimina o no, por si deseamos conservar cualqueir archivo que subimos, por si acaso
    await this.files.update(file.id, {
      deletedAt: new Date(),
      deletedById: user.id,
    });

    //Auditmos la eliminación con un DELETE
    await this.audit.log({
      action: AuditAction.DELETE,
      actor: user,
      file,
      context,
    });
  }

  private async findAccessible(
    user: AuthUser,
    fileId: string,
  ): Promise<StoredFile> {
    const query = this.baseQuery()
      .addSelect('file.storageKey')
      .where('file.id = :fileId', { fileId });

      //Aplicamos el scope una vez más para ver si tiene accesibilidad a descargar el archivo , quizá cambia el permiso antes de desaacargar
    this.applyScope(query, this.policy.visibleScope(user));

    const file = await query.getOne();
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return file;
  }

  private baseQuery(): SelectQueryBuilder<StoredFile> {
    return this.files
      .createQueryBuilder('file')
      .innerJoinAndSelect('file.owner', 'owner')
      .leftJoinAndSelect('file.area', 'area');
  }

  private applyScope(
    query: SelectQueryBuilder<StoredFile>,
    scope: FileScope,
  ): void {
    if (scope.all) {
      return;
    }

    query.andWhere(
      new Brackets((where) => {
        where.where('file.ownerId = :scopeOwnerId', {
          scopeOwnerId: scope.ownerId,
        });
        if (scope.areaIds.length > 0) {
          where.orWhere('file.areaId IN (:...scopeAreaIds)', {
            scopeAreaIds: scope.areaIds,
          });
        }
      }),
    );
  }

  private toResponse(file: StoredFile, user: AuthUser): FileResponseDto {
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt,
      owner: {
        id: file.owner.id,
        fullName: file.owner.fullName,
        email: file.owner.email,
      },
      area: file.area ? { id: file.area.id, name: file.area.name } : null,
      canDelete: this.policy.canDelete(user, file),
    };
  }
}
