import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

/** Documentación interactiva en /api/docs (JSON OpenAPI en /api/docs-json). */
function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Gestión segura de archivos — API')
      .setDescription(
        'API REST para la gestión de archivos con control de acceso por rol y área. ' +
          'Para probar los endpoints protegidos: ejecutar /auth/login, copiar el ' +
          '`accessToken` y pegarlo en el botón **Authorize**.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  // Detrás del proxy de Render: permite obtener la IP real del cliente
  // (historial de acciones y límite de intentos por IP).
  app.set('trust proxy', 1);
  app.use(helmet());

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('corsOrigin', { infer: true }),
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  setupSwagger(app);

  await app.listen(config.get('port', { infer: true }));
}
void bootstrap();
