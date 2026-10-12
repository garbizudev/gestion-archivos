import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleResponseDto } from './dto/role-response.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.roles.find({ order: { id: 'ASC' } });
    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
    }));
  }
}
