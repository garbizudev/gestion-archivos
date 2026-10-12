import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { RoleCode } from '../roles/role-code.enum';

export type AuditScope =
  { all: true } | { all: false; actorId: string; actorAreaIds: string[] };

@Injectable()
//Cramos una política , así como para la gestión de archivos, pero para la visualización de historial de movimierntos
export class AuditPolicy {
  visibleScope(user: AuthUser): AuditScope {
    switch (user.roleCode) {
      //El admin puede ver TODOS los movimientos
      case RoleCode.ADMIN:
        return { all: true };

        //El manager puede ver sus movimientos y los de las areas que administra
      case RoleCode.MANAGER:
        return {
          all: false,
          actorId: user.id,
          actorAreaIds: user.managedAreas.map((area) => area.id),
        };

        //Los otros roles no tienen permisos de visualización
      case RoleCode.AREA_HEAD:
      case RoleCode.STANDARD:
      default:
        return { all: false, actorId: user.id, actorAreaIds: [] };
    }
  }
}
