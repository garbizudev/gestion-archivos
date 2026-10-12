import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { AuditAction } from '../audit/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth-user';
import { RequestContext } from '../common/request-context';
import { AppConfig } from '../config/configuration';
import { StorageService } from '../storage/storage.service';
import { FileResponseDto } from './dto/file-response.dto';
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

    return this.toResponse(created); //Retornamos la info según el FileResponseDto
  }

  //Método para listar los documentos Propios de momento
  async list(user: AuthUser): Promise<FileResponseDto[]> {
    const query = this.files
      .createQueryBuilder('file')
      .innerJoinAndSelect('file.owner', 'owner')
      .leftJoinAndSelect('file.area', 'area')
      .orderBy('file.createdAt', 'DESC');



    //Aplicamos el scope y enviamos el usuario como parametro, el usuario contiene data del rol entonces ya podemos ir haciendo filtros
    this.applyScope(query, this.policy.visibleScope(user));

    const files = await query.getMany();
    return files.map((file) => this.toResponse(file));
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

  private toResponse(file: StoredFile): FileResponseDto {
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
    };
  }
}
