import { AuthUser } from '../auth/auth-user';
import { RoleCode } from '../roles/role-code.enum';
import { FilePolicy } from './file.policy';

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

describe('FilePolicy.visibleScope', () => {
  const policy = new FilePolicy();

  it('usuario estándar: solo sus propios archivos', () => {
    expect(policy.visibleScope(buildUser(RoleCode.STANDARD, TEC))).toEqual({
      all: false,
      ownerId: 'user-1',
      areaIds: [],
    });
  });

  it('jefe de área: sus archivos y los de su área', () => {
    expect(policy.visibleScope(buildUser(RoleCode.AREA_HEAD, TEC))).toEqual({
      all: false,
      ownerId: 'user-1',
      areaIds: [TEC],
    });
  });

  it('jefe de área sin área asignada: solo sus archivos', () => {
    expect(policy.visibleScope(buildUser(RoleCode.AREA_HEAD, null))).toEqual({
      all: false,
      ownerId: 'user-1',
      areaIds: [],
    });
  });

  it('gerente: sus archivos y los de las áreas que gestiona, no los de su propia área', () => {
    const manager = buildUser(RoleCode.MANAGER, 'area-propia', [TEC, FIN]);
    expect(policy.visibleScope(manager)).toEqual({
      all: false,
      ownerId: 'user-1',
      areaIds: [TEC, FIN],
    });
  });

  it('administrador: todos los archivos', () => {
    expect(policy.visibleScope(buildUser(RoleCode.ADMIN, null))).toEqual({
      all: true,
    });
  });
});
