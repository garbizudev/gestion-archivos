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

describe('FilePolicy.canDelete', () => {
  const policy = new FilePolicy();
  const ownFile = { ownerId: 'user-1', areaId: TEC };
  const colleagueFile = { ownerId: 'otro-usuario', areaId: TEC };
  const otherAreaFile = { ownerId: 'otro-usuario', areaId: 'area-rrhh' };
  const noAreaFile = { ownerId: 'otro-usuario', areaId: null };

  it('usuario estándar: solo sus propios archivos', () => {
    const user = buildUser(RoleCode.STANDARD, TEC);
    expect(policy.canDelete(user, ownFile)).toBe(true);
    expect(policy.canDelete(user, colleagueFile)).toBe(false);
  });

  it('jefe de área: solo los propios, no los de otros usuarios de su área', () => {
    const user = buildUser(RoleCode.AREA_HEAD, TEC);
    expect(policy.canDelete(user, ownFile)).toBe(true);
    expect(policy.canDelete(user, colleagueFile)).toBe(false);
  });

  it('gerente: los propios y los de las áreas que gestiona', () => {
    const user = buildUser(RoleCode.MANAGER, TEC, [TEC, FIN]);
    expect(policy.canDelete(user, ownFile)).toBe(true);
    expect(policy.canDelete(user, colleagueFile)).toBe(true);
  });

  it('gerente: no los de áreas fuera de su gestión ni los que no tienen área', () => {
    const user = buildUser(RoleCode.MANAGER, TEC, [TEC, FIN]);
    expect(policy.canDelete(user, otherAreaFile)).toBe(false);
    expect(policy.canDelete(user, noAreaFile)).toBe(false);
  });

  it('administrador: cualquier archivo', () => {
    const user = buildUser(RoleCode.ADMIN, null);
    for (const file of [ownFile, colleagueFile, otherAreaFile, noAreaFile]) {
      expect(policy.canDelete(user, file)).toBe(true);
    }
  });
});
