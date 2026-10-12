import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Area } from '../areas/entities/area.entity';
import { AuthUser } from '../auth/auth-user';
import { hashPassword } from '../auth/password';
import { Role } from '../roles/entities/role.entity';
import { RoleCode } from '../roles/role-code.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

const ROLES_REQUIRING_AREA = [RoleCode.STANDARD, RoleCode.AREA_HEAD];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Area)
    private readonly areas: Repository<Area>,
  ) {}

  async list(): Promise<UserResponseDto[]> {
    const users = await this.users.find({
      relations: { role: true, area: true, managedAreas: true },
      order: { fullName: 'ASC' },
    });
    return users.map((user) => this.toResponse(user));
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    if (await this.users.existsBy({ email: dto.email })) {
      throw new ConflictException(
        `Ya existe un usuario con el email ${dto.email}`,
      );
    }

    const role = await this.findActiveRole(dto.roleCode);
    const area = await this.resolveArea(role.code, dto.areaId ?? null);
    const managedAreas = await this.resolveManagedAreas(
      role.code,
      dto.managedAreaIds ?? [],
    );

    const user = await this.users.save(
      this.users.create({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash: await hashPassword(dto.password),
        role,
        roleId: role.id,
        area,
        areaId: area?.id ?? null,
        managedAreas,
      }),
    );

    return this.findResponse(user.id);
  }

  async update(
    currentUser: AuthUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.users.findOne({
      where: { id },
      relations: { role: true, area: true, managedAreas: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.id === currentUser.id) {
      if (dto.isActive === false) {
        throw new BadRequestException('No puede desactivar su propio usuario');
      }
      if (dto.roleCode !== undefined && dto.roleCode !== user.role.code) {
        throw new BadRequestException('No puede cambiar su propio rol');
      }
    }

    const role =
      dto.roleCode !== undefined && dto.roleCode !== user.role.code
        ? await this.findActiveRole(dto.roleCode)
        : user.role;

    const areaId = dto.areaId !== undefined ? dto.areaId : user.areaId;
    const area = await this.resolveArea(role.code, areaId, user.areaId);

    const currentManagedIds = user.managedAreas.map((managed) => managed.id);
    const managedAreaIds =
      dto.managedAreaIds ??
      (role.code === RoleCode.MANAGER ? currentManagedIds : []);
    const managedAreas = await this.resolveManagedAreas(
      role.code,
      managedAreaIds,
      currentManagedIds,
    );

    user.role = role;
    user.roleId = role.id;
    user.area = area;
    user.areaId = area?.id ?? null;
    user.managedAreas = managedAreas;
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName;
    }
    if (dto.password !== undefined) {
      user.passwordHash = await hashPassword(dto.password);
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    await this.users.save(user);
    return this.findResponse(user.id);
  }

  private async findActiveRole(code: RoleCode): Promise<Role> {
    const role = await this.roles.findOneBy({ code });
    if (!role || !role.isActive) {
      throw new BadRequestException(`El rol ${code} no existe o está inactivo`);
    }
    return role;
  }

  private async resolveArea(
    roleCode: RoleCode,
    areaId: string | null,
    currentAreaId: string | null = null,
  ): Promise<Area | null> {
    if (!areaId) {
      if (ROLES_REQUIRING_AREA.includes(roleCode)) {
        throw new BadRequestException(
          'Los usuarios estándar y jefes de área deben pertenecer a un área',
        );
      }
      return null;
    }

    const area = await this.areas.findOneBy({ id: areaId });
    if (!area) {
      throw new BadRequestException('El área indicada no existe');
    }
    if (!area.isActive && area.id !== currentAreaId) {
      throw new BadRequestException(
        `No se puede asignar el área inactiva "${area.name}"`,
      );
    }
    return area;
  }

  private async resolveManagedAreas(
    roleCode: RoleCode,
    areaIds: string[],
    currentIds: string[] = [],
  ): Promise<Area[]> {
    const uniqueIds = [...new Set(areaIds)];

    if (roleCode !== RoleCode.MANAGER) {
      if (uniqueIds.length > 0) {
        throw new BadRequestException(
          'Solo los gerentes pueden tener áreas gestionadas',
        );
      }
      return [];
    }

    if (uniqueIds.length === 0) {
      return [];
    }

    const areas = await this.areas.findBy({ id: In(uniqueIds) });
    if (areas.length !== uniqueIds.length) {
      throw new BadRequestException('Una o más áreas gestionadas no existen');
    }

    const newlyInactive = areas.filter(
      (area) => !area.isActive && !currentIds.includes(area.id),
    );
    if (newlyInactive.length > 0) {
      throw new BadRequestException(
        `No se pueden asignar áreas inactivas: ${newlyInactive.map((area) => area.name).join(', ')}`,
      );
    }

    return areas;
  }

  private async findResponse(id: string): Promise<UserResponseDto> {
    const user = await this.users.findOneOrFail({
      where: { id },
      relations: { role: true, area: true, managedAreas: true },
    });
    return this.toResponse(user);
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      role: { id: user.role.id, code: user.role.code, name: user.role.name },
      area: user.area ? { id: user.area.id, name: user.area.name } : null,
      managedAreas: user.managedAreas
        .map((area) => ({ id: area.id, name: area.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
