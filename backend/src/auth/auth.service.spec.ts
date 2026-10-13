import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcrypt';
import { Repository } from 'typeorm';
import { AuditAction } from '../audit/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { RoleCode } from '../roles/role-code.enum';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

const context = { ipAddress: '127.0.0.1', userAgent: 'jest' };
const PASSWORD = 'Correcta123!';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'usuario@example.com',
    fullName: 'Usuario Prueba',
    passwordHash: hashSync(PASSWORD, 4),
    isActive: true,
    roleId: 1,
    role: {
      id: 1,
      code: RoleCode.STANDARD,
      name: 'Usuario estándar',
      isActive: true,
    },
    areaId: 'area-1',
    area: { id: 'area-1', name: 'Tecnología' },
    managedAreas: [],
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let service: AuthService;
  let users: { findOne: jest.Mock };
  let audit: { log: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    users = { findOne: jest.fn() };
    audit = { log: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(
      users as unknown as Repository<User>,
      jwt as unknown as JwtService,
      audit as unknown as AuditService,
    );
  });

  it('devuelve un token y registra LOGIN con credenciales válidas', async () => {
    const user = buildUser();
    users.findOne.mockResolvedValue(user);

    const result = await service.login(
      { email: user.email, password: PASSWORD },
      context,
    );

    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toMatchObject({
      id: 'user-1',
      roleCode: RoleCode.STANDARD,
      areaId: 'area-1',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.LOGIN }),
    );
  });

  it.each([
    ['contraseña incorrecta', buildUser(), 'otra-clave', 'INVALID_PASSWORD'],
    ['email inexistente', null, PASSWORD, 'UNKNOWN_EMAIL'],
    [
      'usuario inactivo',
      buildUser({ isActive: false }),
      PASSWORD,
      'INACTIVE_USER',
    ],
  ])(
    'rechaza con mensaje genérico ante %s y registra LOGIN_FAILED',
    async (_case, user, password, reason) => {
      users.findOne.mockResolvedValue(user);

      const attempt = service.login(
        { email: 'usuario@example.com', password },
        context,
      );

      await expect(attempt).rejects.toThrow(
        new UnauthorizedException('Credenciales inválidas'),
      );
      expect(jwt.signAsync).not.toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FAILED,
          details: { email: 'usuario@example.com', reason },
        }),
      );
    },
  );

  it('loadAuthUser devuelve null si el rol está inactivo', async () => {
    users.findOne.mockResolvedValue(
      buildUser({
        role: {
          id: 1,
          code: RoleCode.STANDARD,
          name: 'Usuario estándar',
          isActive: false,
        } as User['role'],
      }),
    );

    await expect(service.loadAuthUser('user-1')).resolves.toBeNull();
  });
});
