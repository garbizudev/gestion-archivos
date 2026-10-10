import { Readable } from 'node:stream';

/**
 * Abstracción del almacenamiento físico de archivos. El resto de la aplicación
 * solo conoce claves opacas (`key`), nunca rutas del servidor ni URLs del bucket.
 */
export abstract class StorageService {
  abstract put(
    key: string,
    content: Buffer,
    contentType: string,
  ): Promise<void>;

  abstract getStream(key: string): Promise<Readable>;

  abstract delete(key: string): Promise<void>;
}
