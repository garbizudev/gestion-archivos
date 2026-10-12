import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuditAction } from '../audit/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth-user';
import { RequestContext } from '../common/request-context';
import { AppConfig } from '../config/configuration';
import { StorageService } from '../storage/storage.service';
import { FileResponseDto } from './dto/file-response.dto';
import { StoredFile } from './entities/stored-file.entity';
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

    return { //Retornamos la info según el FileResponseDto
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      createdAt: saved.createdAt,
    };
  }
}
