import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Area } from '../../areas/entities/area.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  // Nunca se selecciona por defecto para no filtrarlo en respuestas.
  @Column({ name: 'password_hash', length: 100, select: false })
  passwordHash: string;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'smallint' })
  roleId: number;

  // Área a la que pertenece el usuario. Puede ser nula (p. ej. administrador global).
  @ManyToOne(() => Area, (area) => area.users, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'area_id' })
  area: Area | null;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  // Áreas bajo la gestión de un gerente (relación N:M).
  @ManyToMany(() => Area)
  @JoinTable({
    name: 'manager_areas',
    joinColumn: { name: 'manager_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'area_id', referencedColumnName: 'id' },
  })
  managedAreas: Area[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
