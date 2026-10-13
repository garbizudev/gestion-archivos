import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AreasModule } from './areas/areas.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import configuration, { AppConfig } from './config/configuration';
import { buildTypeOrmOptions } from './database/typeorm.options';
import { FilesModule } from './files/files.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';

const FRONTEND_DIR = join(__dirname, '..', 'public');

const frontendModules = existsSync(join(FRONTEND_DIR, 'index.html'))
  ? [
      ServeStaticModule.forRoot({
        rootPath: FRONTEND_DIR,
        exclude: ['/api/{*path}'],
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        buildTypeOrmOptions(config.get('db', { infer: true })),
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ...frontendModules,
    StorageModule,
    AuditModule,
    AuthModule,
    FilesModule,
    AreasModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
