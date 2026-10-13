import { FILE_TYPE_CATALOG } from '../files/file-types';

export type StorageDriver = 's3' | 'local';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  files: {
    maxUploadBytes: number;
    allowedExtensions: string[];
  };
  storage: {
    driver: StorageDriver;
    localDir: string;
    s3: {
      endpoint?: string;
      region: string;
      bucket: string;
      accessKey: string;
      secretKey: string;
      forcePathStyle: boolean;
    };
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

//Función para validar las exensiones permitidas
function allowedExtensions(): string[] {
  const raw = process.env.ALLOWED_FILE_EXTENSIONS;
  if (!raw) {
    return Object.keys(FILE_TYPE_CATALOG);
  }

  const extensions = raw
    .split(',')
    .map((ext) => ext.trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean);

  const unknown = extensions.filter((ext) => !(ext in FILE_TYPE_CATALOG));
  //Se hace una validación inicial, por si se agregan extensiones en la variable de entorno que no pertenecen al listado seguro, como un exe o un bat
  if (unknown.length > 0) {
    throw new Error(
      `ALLOWED_FILE_EXTENSIONS contiene extensiones fuera del catálogo seguro: ${unknown.join(', ')}`,
    );
  }
  //Devuelve las extensiones permitidas seguras
  return extensions;
}

export default (): AppConfig => {
  const driver = (process.env.STORAGE_DRIVER ?? 's3') as StorageDriver;
  if (driver !== 's3' && driver !== 'local') {
    throw new Error(`STORAGE_DRIVER inválido: ${driver as string}`);
  }

  return {
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
    db: {
      host: required('DB_HOST'),
      port: Number(process.env.DB_PORT ?? 5432),
      name: required('DB_NAME'),
      user: required('DB_USER'),
      password: required('DB_PASSWORD'),
      ssl: process.env.DB_SSL === 'true',
    },
    jwt: {
      secret: required('JWT_SECRET'),
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    },
    files: {
      maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 20) * 1024 * 1024,
      allowedExtensions: allowedExtensions(),
    },
    storage: {
      driver,
      localDir: process.env.STORAGE_LOCAL_DIR ?? './storage',
      s3: {
        endpoint: process.env.S3_ENDPOINT || undefined,
        region: process.env.S3_REGION ?? 'us-east-1',
        bucket: process.env.S3_BUCKET ?? 'gestion-archivos',
        accessKey: driver === 's3' ? required('S3_ACCESS_KEY') : '',
        secretKey: driver === 's3' ? required('S3_SECRET_KEY') : '',
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      },
    },
  };
};
