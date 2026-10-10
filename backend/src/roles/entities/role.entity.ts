import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleCode } from '../role-code.enum';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id: number;

  @Column({ type: 'enum', enum: RoleCode, enumName: 'role_code', unique: true })
  code: RoleCode;

  @Column({ length: 60 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
