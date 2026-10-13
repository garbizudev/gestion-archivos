import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AppConfig } from '../../config/configuration';

@Catch(PayloadTooLargeException)
@Injectable()
export class FileTooLargeFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  catch(exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const maxMb =
      this.config.get('files.maxUploadBytes', { infer: true }) / (1024 * 1024);

    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      error: 'Payload Too Large',
      message: `El archivo supera el tamaño máximo permitido de ${maxMb} MB`,
    });
  }
}
