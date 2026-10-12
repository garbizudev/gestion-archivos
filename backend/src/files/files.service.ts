import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user';
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
  private readonly allowedExtensions: string[];

  constructor(
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    private readonly storage: StorageService,
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
    const saved = await this.files.save(
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

    return { //Retornamos la info según el FileResponseDto
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      createdAt: saved.createdAt,
    };
  }
}
