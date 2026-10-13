import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleCode } from '../role-code.enum';
import { User } from '../../users/entities/user.entity';

/**
 * Catálogo de roles. `code` es el identificador estable que usa la lógica de
 * permisos (ver RoleCode); `name` es el texto visible y puede editarse.
 */
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  code: RoleCode;

  @Column({ length: 60 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
