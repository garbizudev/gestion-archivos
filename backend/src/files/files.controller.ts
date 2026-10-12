import {
  Controller,
  Post,
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
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/dto/auth-user.dto';
import { FileResponseDto } from './dto/file-response.dto';
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
  ): Promise<FileResponseDto> {
    return this.files.upload(user, file);
  }
}
