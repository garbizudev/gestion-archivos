import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaResponseDto } from './dto/area-response.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { Area } from './entities/area.entity';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areas: Repository<Area>,
  ) {}

  async list(): Promise<AreaResponseDto[]> {
    const areas = await this.areas.find({ order: { name: 'ASC' } });
    return areas.map((area) => this.toResponse(area));
  }

  async create(dto: CreateAreaDto): Promise<AreaResponseDto> {
    await this.ensureNameIsAvailable(dto.name);

    const area = await this.areas.save(
      this.areas.create({
        name: dto.name,
        description: dto.description ?? null,
      }),
    );
    return this.toResponse(area);
  }

  async update(id: string, dto: UpdateAreaDto): Promise<AreaResponseDto> {
    const area = await this.areas.findOneBy({ id });
    if (!area) {
      throw new NotFoundException('Área no encontrada');
    }

    if (dto.name !== undefined && dto.name !== area.name) {
      await this.ensureNameIsAvailable(dto.name, id);
      area.name = dto.name;
    }
    if (dto.description !== undefined) {
      area.description = dto.description || null;
    }
    if (dto.isActive !== undefined) {
      area.isActive = dto.isActive;
    }

    return this.toResponse(await this.areas.save(area));
  }

  private async ensureNameIsAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const query = this.areas
      .createQueryBuilder('area')
      .where('LOWER(area.name) = LOWER(:name)', { name });
    if (excludeId) {
      query.andWhere('area.id <> :excludeId', { excludeId });
    }

    if (await query.getExists()) {
      throw new ConflictException(`Ya existe un área con el nombre "${name}"`);
    }
  }

  private toResponse(area: Area): AreaResponseDto {
    return {
      id: area.id,
      name: area.name,
      description: area.description,
      isActive: area.isActive,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
    };
  }
}
