import { DataSourceOptions } from 'typeorm';
import { AppConfig } from '../config/configuration';
import { Area } from '../areas/entities/area.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { StoredFile } from '../files/entities/stored-file.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

export const ENTITIES = [Role, Area, User, StoredFile, AuditLog];

/**
 * Opciones compartidas por la aplicación y por el CLI de migraciones.
 * El esquema se gestiona solo con migraciones (synchronize desactivado).
 */
export function buildTypeOrmOptions(db: AppConfig['db']): DataSourceOptions {
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    database: db.name,
    username: db.user,
    password: db.password,
    ssl: db.ssl,
    // gen_random_uuid() es nativo desde PostgreSQL 13: no requiere la extensión uuid-ossp.
    uuidExtension: 'pgcrypto',
    entities: ENTITIES,
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
  };
}
