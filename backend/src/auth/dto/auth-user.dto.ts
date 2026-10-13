import { RoleCode } from '../../roles/role-code.enum';

export class AreaRefDto {
  /** @example 3f2a9c1e-7b4d-4e8a-9f12-6c5d8e1a2b3c */
  id: string;

  /** @example Tecnología */
  name: string;
}

/**
 * Usuario autenticado, cargado desde la base de datos en cada petición.
 * Así, un cambio de rol, área o estado aplica de inmediato, sin esperar
 * a que el token expire.
 */
export class AuthUser {
  id: string;

  /** @example gerente@example.com */
  email: string;

  /** @example Gonzalo Gerente */
  fullName: string;

  roleCode: RoleCode;

  /** @example Gerente */
  roleName: string;

  /** Área a la que pertenece el usuario (nula para el administrador). */
  areaId: string | null;

  /** @example Tecnología */
  areaName: string | null;

  /** Áreas bajo su gestión (solo aplica al rol Gerente). */
  managedAreas: AreaRefDto[];
}
