import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user';
import { StorageService } from '../storage/storage.service';
import { FileResponseDto } from './dto/file-response.dto';
import { StoredFile } from './entities/stored-file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    private readonly storage: StorageService,
  ) {}

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

    const storageKey = randomUUID(); //Generamos un identificador aleatorio

    await this.storage.put(storageKey, upload.buffer, upload.mimetype);

    //Aquí se persiste la información de file en la BD
    const saved = await this.files.save(
      this.files.create({
        originalName: upload.originalname,
        storageKey,
        mimeType: upload.mimetype,
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
