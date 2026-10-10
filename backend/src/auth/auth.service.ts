import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../audit/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { RequestContext } from '../common/request-context';
import { User } from '../users/entities/user.entity';
import { AuthUser, JwtPayload } from './auth-user';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from './password';

const INVALID_CREDENTIALS = 'Credenciales inválidas';

@Injectable()
export class AuthService {
  // Hash de relleno: si el email no existe igual se ejecuta bcrypt, para que el
  // tiempo de respuesta no revele qué correos están registrados.
  private readonly dummyHash = hashPassword('dummy-password-for-timing');

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(
    dto: LoginDto,
    context: RequestContext,
  ): Promise<LoginResponseDto> {
    const user = await this.users.findOne({
      where: { email: dto.email },
      relations: { role: true },
      select: {
        id: true,
        areaId: true,
        passwordHash: true,
        isActive: true,
        role: { id: true, isActive: true },
      },
    });

    const passwordOk = await verifyPassword(
      dto.password,
      user?.passwordHash ?? (await this.dummyHash),
    );

    const failure = !user
      ? 'UNKNOWN_EMAIL'
      : !passwordOk
        ? 'INVALID_PASSWORD'
        : !user.isActive || !user.role.isActive
          ? 'INACTIVE_USER'
          : null;

    if (failure) {
      await this.audit.log({
        action: AuditAction.LOGIN_FAILED,
        actor: user,
        context,
        details: { email: dto.email, reason: failure },
      });
      // Mismo mensaje en todos los casos: no se revela si el email existe.
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const authUser = (await this.loadAuthUser(user!.id))!;
    await this.audit.log({
      action: AuditAction.LOGIN,
      actor: authUser,
      context,
    });

    const payload: JwtPayload = { sub: authUser.id };
    return {
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer',
      user: authUser,
    };
  }

  async logout(user: AuthUser, context: RequestContext): Promise<void> {
    // Con JWT la sesión vive en el cliente: el frontend descarta el token.
    // El servidor deja constancia del cierre de sesión en el historial.
    await this.audit.log({ action: AuditAction.LOGOUT, actor: user, context });
  }

  /** Carga el usuario con su rol y áreas. Devuelve null si no existe o está inactivo. */
  async loadAuthUser(userId: string): Promise<AuthUser | null> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { role: true, area: true, managedAreas: true },
    });
    if (!user || !user.isActive || !user.role.isActive) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleCode: user.role.code,
      roleName: user.role.name,
      areaId: user.area?.id ?? null,
      areaName: user.area?.name ?? null,
      managedAreas: user.managedAreas.map(({ id, name }) => ({ id, name })),
    };
  }
}
