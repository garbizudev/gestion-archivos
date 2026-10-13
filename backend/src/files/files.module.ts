import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AppConfig } from '../config/configuration';
import { StoredFile } from './entities/stored-file.entity';
import { FilePolicy } from './file.policy';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoredFile]),
    AuditModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        limits: {
          fileSize: config.get('files.maxUploadBytes', { infer: true }),
          files: 1,
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, FilePolicy],
})
export class FilesModule {}
