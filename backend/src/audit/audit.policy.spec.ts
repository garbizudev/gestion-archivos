import { AuthUser } from '../auth/auth-user';
import { RoleCode } from '../roles/role-code.enum';
import { AuditPolicy } from './audit.policy';

const TEC = 'area-tecnologia';
const FIN = 'area-finanzas';

function buildUser(
  roleCode: RoleCode,
  areaId: string | null,
  managedAreaIds: string[] = [],
): AuthUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Usuario',
    roleCode,
    roleName: roleCode,
    areaId,
    areaName: null,
    managedAreas: managedAreaIds.map((id) => ({ id, name: id })),
  };
}

describe('AuditPolicy.visibleScope', () => {
  const policy = new AuditPolicy();

  it.each([RoleCode.STANDARD, RoleCode.AREA_HEAD])(
    '%s: solo sus propias acciones',
    (roleCode) => {
      expect(policy.visibleScope(buildUser(roleCode, TEC))).toEqual({
        all: false,
        actorId: 'user-1',
        actorAreaIds: [],
      });
    },
  );

  it('gerente: sus acciones y las de los usuarios de las áreas que gestiona', () => {
    expect(
      policy.visibleScope(buildUser(RoleCode.MANAGER, TEC, [TEC, FIN])),
    ).toEqual({ all: false, actorId: 'user-1', actorAreaIds: [TEC, FIN] });
  });

  it('administrador: todo el historial', () => {
    expect(policy.visibleScope(buildUser(RoleCode.ADMIN, null))).toEqual({
      all: true,
    });
  });
});
