import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../roles/role-code.enum';
import { AreasService } from './areas.service';
import { AreaResponseDto } from './dto/area-response.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@ApiTags('Administración - Áreas')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Solo disponible para administradores' })
@Roles(RoleCode.ADMIN)
@Controller('areas')
export class AreasController {
  constructor(private readonly areas: AreasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar áreas (activas e inactivas)' })
  @ApiOkResponse({ type: [AreaResponseDto] })
  list(): Promise<AreaResponseDto[]> {
    return this.areas.list();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un área' })
  @ApiCreatedResponse({ type: AreaResponseDto })
  @ApiConflictResponse({ description: 'Ya existe un área con ese nombre' })
  create(@Body() dto: CreateAreaDto): Promise<AreaResponseDto> {
    return this.areas.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un área',
    description:
      'Permite cambiar nombre y descripción, o activarla/desactivarla con isActive.',
  })
  @ApiOkResponse({ type: AreaResponseDto })
  @ApiNotFoundResponse({ description: 'Área no encontrada' })
  @ApiConflictResponse({ description: 'Ya existe un área con ese nombre' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.areas.update(id, dto);
  }
}
