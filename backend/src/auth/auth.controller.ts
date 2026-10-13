import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReqContext, type RequestContext } from '../common/request-context';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthUser } from './dto/auth-user.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Máximo 5 intentos por minuto por IP, contra ataques de fuerza bruta. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida las credenciales y devuelve un JWT. Máximo 5 intentos por minuto por IP.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos' })
  login(
    @Body() dto: LoginDto,
    @ReqContext() context: RequestContext,
  ): Promise<LoginResponseDto> {
    return this.auth.login(dto, context);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Registra el cierre de sesión en el historial. El cliente debe descartar el token.',
  })
  @ApiNoContentResponse({ description: 'Sesión cerrada' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  logout(
    @CurrentUser() user: AuthUser,
    @ReqContext() context: RequestContext,
  ): Promise<void> {
    return this.auth.logout(user, context);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Usuario autenticado',
    description:
      'Devuelve el perfil, rol, área y áreas gestionadas del usuario.',
  })
  @ApiOkResponse({ type: AuthUser })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
