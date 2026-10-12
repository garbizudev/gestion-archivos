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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/dto/auth-user.dto';
import { RoleCode } from '../roles/role-code.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Administración - Usuarios')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Solo disponible para administradores' })
@Roles(RoleCode.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (activos e inactivos)' })
  @ApiOkResponse({ type: [UserResponseDto] })
  list(): Promise<UserResponseDto[]> {
    return this.users.list();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o reglas de rol/área incumplidas',
  })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email' })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.users.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un usuario',
    description:
      'Permite cambiar nombre, contraseña, rol, área, áreas gestionadas o activarlo/desactivarlo con isActive.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o reglas de rol/área incumplidas',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    return this.users.update(currentUser, id, dto);
  }
}
