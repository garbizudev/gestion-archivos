import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Area } from '../../areas/entities/area.entity';
import { User } from '../../users/entities/user.entity';

// Postgres devuelve BIGINT como string; lo convertimos a number (tamaños < 2^53).
const bigintToNumber = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/**
 * Metadatos de un archivo. El contenido vive en el almacenamiento (S3 o disco)
 * bajo `storageKey`, una clave opaca que nunca se expone al cliente.
 */
@Entity('files')
export class StoredFile {
  // Identificador único del archivo, usado en la API.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Column({ name: 'storage_key', length: 255, unique: true, select: false })
  storageKey: string;

  @Column({ name: 'mime_type', length: 150 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'bigint', transformer: bigintToNumber })
  sizeBytes: number;

  @Column({ name: 'checksum_sha256', type: 'char', length: 64 })
  checksumSha256: string;

  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  // Área del dueño al momento de la carga: si el usuario cambia de área,
  // el archivo sigue perteneciendo al área donde se generó.
  @Index()
  @ManyToOne(() => Area, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'area_id' })
  area: Area | null;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Borrado lógico: el historial conserva la referencia al archivo.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'deleted_by_id' })
  deletedBy: User | null;

  @Column({ name: 'deleted_by_id', type: 'uuid', nullable: true })
  deletedById: string | null;
}
