/**
 * Códigos estables de rol. La lógica de permisos se basa en estos códigos;
 * el nombre visible del rol vive en la tabla `roles`.
 */
export enum RoleCode {
  STANDARD = 'STANDARD',
  AREA_HEAD = 'AREA_HEAD',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}
