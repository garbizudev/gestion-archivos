import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleCode } from './role-code.enum';
import { RolesService } from './roles.service';

@ApiTags('Administración - Roles')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Solo disponible para administradores' })
@Roles(RoleCode.ADMIN)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar el catálogo de roles' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  list(): Promise<RoleResponseDto[]> {
    return this.roles.list();
  }
}
