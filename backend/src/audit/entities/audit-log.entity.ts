import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '../audit-action.enum';
import { StoredFile } from '../../files/entities/stored-file.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Registro inmutable de acciones. Guarda copias (snapshots) de datos clave
 * para que el historial siga siendo fiel aunque cambien usuarios o archivos.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'enum', enum: AuditAction, enumName: 'audit_action' })
  action: AuditAction;

  // Nulo en intentos de login con un correo inexistente.
  @Index()
  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  // Área del actor al momento de la acción (define el alcance del gerente).
  @Index()
  @Column({ name: 'actor_area_id', type: 'uuid', nullable: true })
  actorAreaId: string | null;

  @Index()
  @ManyToOne(() => StoredFile, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'file_id' })
  file: StoredFile | null;

  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  fileId: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
