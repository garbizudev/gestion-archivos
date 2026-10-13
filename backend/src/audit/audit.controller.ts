import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/dto/auth-user.dto';
import { RoleCode } from '../roles/role-code.enum';
import { AuditService } from './audit.service';
import { AuditLogPageDto } from './dto/audit-log-response.dto';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';

@ApiTags('Historial')
@ApiBearerAuth()
@ApiForbiddenResponse({
  description: 'Solo disponible para gerentes y administradores',
})
@Roles(RoleCode.MANAGER, RoleCode.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar el historial de acciones',
    description:
      'Gerente: sus acciones y las de los usuarios de las áreas que gestiona. Administrador: todo el historial.',
  })
  @ApiOkResponse({ type: AuditLogPageDto })
  list(
    @Query() query: ListAuditQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AuditLogPageDto> {
    return this.audit.list(user, query);
  }
}
