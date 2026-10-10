import 'dotenv/config';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';
import { buildTypeOrmOptions } from './typeorm.options';

/** DataSource usado por el CLI de TypeORM (migraciones) y el seed. */
export default new DataSource(buildTypeOrmOptions(configuration().db));
