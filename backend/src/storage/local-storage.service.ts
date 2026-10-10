import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { AppConfig } from '../config/configuration';
import { StorageService } from './storage.service';

/**
 * Almacenamiento en disco, en un directorio fuera de cualquier carpeta servida
 * públicamente. Útil para desarrollo sin S3.
 */
@Injectable()
export class LocalStorageService
  extends StorageService
  implements OnModuleInit
{
  private readonly baseDir: string;

  constructor(config: ConfigService<AppConfig, true>) {
    super();
    this.baseDir = resolve(config.get('storage.localDir', { infer: true }));
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
  }

  async put(key: string, content: Buffer): Promise<void> {
    await writeFile(this.pathFor(key), content, { flag: 'wx' });
  }

  getStream(key: string): Promise<Readable> {
    return Promise.resolve(createReadStream(this.pathFor(key)));
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  // Defensa en profundidad: las claves las genera el servidor, pero igual
  // se impide que una clave escape del directorio base.
  private pathFor(key: string): string {
    const fullPath = resolve(this.baseDir, key);
    if (!fullPath.startsWith(this.baseDir + sep)) {
      throw new Error('Clave de almacenamiento inválida');
    }
    return fullPath;
  }
}
