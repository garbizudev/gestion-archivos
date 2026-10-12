import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/dto/auth-user.dto';
import { ReqContext, type RequestContext } from '../common/request-context';
import { FileResponseDto } from './dto/file-response.dto';
import { contentDisposition } from './file-types';
import { FilesService } from './files.service';
import { FileTooLargeFilter } from './filters/file-too-large.filter';

@ApiTags('Archivos')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UseFilters(FileTooLargeFilter)
  @ApiOperation({ summary: 'Cargar un archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: FileResponseDto })
  @ApiPayloadTooLargeResponse({
    description: 'El archivo supera el tamaño máximo permitido',
  })
  @ApiUnsupportedMediaTypeResponse({
    description: 'La extensión del archivo no está permitida',
  })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @ReqContext() context: RequestContext,
  ): Promise<FileResponseDto> {
    return this.files.upload(user, file, context);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar archivos',
    description:
      'Devuelve los archivos visibles según el rol: estándar (propios), jefe de área (propios y de su área), gerente (propios y de las áreas que gestiona), administrador (todos).',
  })
  @ApiOkResponse({ type: [FileResponseDto] })
  list(@CurrentUser() user: AuthUser): Promise<FileResponseDto[]> {
    return this.files.list(user);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Descargar un archivo',
    description:
      'Solo si el archivo está dentro del alcance del rol del usuario (las mismas reglas del listado).',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ description: 'Contenido del archivo' })
  @ApiNotFoundResponse({
    description: 'El archivo no existe o está fuera del alcance del usuario',
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @ReqContext() context: RequestContext,
  ): Promise<StreamableFile> {
    const { file, stream } = await this.files.download(user, id, context);

    return new StreamableFile(stream, {
      type: file.mimeType,
      length: file.sizeBytes,
      disposition: contentDisposition(file.originalName),
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar un archivo (borrado lógico)',
    description:
      'Estándar y jefe de área: solo los propios. Gerente: los propios y los de las áreas que gestiona. Administrador: cualquiera.',
  })
  @ApiNoContentResponse({ description: 'Archivo eliminado' })
  @ApiForbiddenResponse({
    description:
      'El usuario ve el archivo, pero no tiene permiso para eliminarlo',
  })
  @ApiNotFoundResponse({
    description: 'El archivo no existe o está fuera del alcance del usuario',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @ReqContext() context: RequestContext,
  ): Promise<void> {
    return this.files.remove(user, id, context);
  }
}
