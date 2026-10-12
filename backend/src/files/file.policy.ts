import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { RoleCode } from '../roles/role-code.enum';


//El scope principal son TODOS los archivos, posteriormente se hacen filtros adicionales para reducir el universo a mostrar
export type FileScope =
  { all: true } | { all: false; ownerId: string; areaIds: string[] };

@Injectable()
export class FilePolicy {
  visibleScope(user: AuthUser): FileScope {
    switch (user.roleCode) {
      //Casos por rol: 
      case RoleCode.ADMIN:
        return { all: true };
        //Si es admin, puede ver TODOS

      case RoleCode.MANAGER:
        return {
          all: false,
          ownerId: user.id,
          areaIds: user.managedAreas.map((area) => area.id),
        };

        //Si es manager o gerente, muestra los propios y los de los usuarios de las áreas que GESTIONA (tabla manager_areas)
        
      case RoleCode.AREA_HEAD:
        return {
          all: false,
          ownerId: user.id,
          areaIds: user.areaId ? [user.areaId] : [],
        };

        //Area head o jefe de area puede ver los propios, y los de los usuarios pertienentes a la area del jefe de area

      case RoleCode.STANDARD:
      default:
        return { all: false, ownerId: user.id, areaIds: [] };
    }

    //l default es el que puede ver solo los propios
  }
}
