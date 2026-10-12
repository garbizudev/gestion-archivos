import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../audit-action.enum';

export class AuditActorDto {
  @ApiProperty({ example: 'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e' })
  id: string;

  @ApiProperty({ example: 'Tomás Técnico' })
  fullName: string;

  @ApiProperty({ example: 'usuario.tec@example.com' })
  email: string;
}

export class AuditLogResponseDto {
  @ApiProperty({ example: '42' })
  id: string;

  @ApiProperty({ enum: AuditAction, example: AuditAction.DOWNLOAD })
  action: AuditAction;

  @ApiProperty({ type: AuditActorDto, nullable: true })
  actor: AuditActorDto | null;

  @ApiProperty({
    nullable: true,
    example: '7c1e4b2a-9f3d-4c8e-a1b2-3d4e5f6a7b8c',
  })
  fileId: string | null;

  @ApiProperty({ nullable: true, example: 'Portafolio - Tomás Técnico.txt' })
  fileName: string | null;

  @ApiProperty({ nullable: true, example: '127.0.0.1' })
  ipAddress: string | null;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    example: { sizeBytes: 248133, mimeType: 'application/pdf' },
  })
  details: Record<string, unknown> | null;

  @ApiProperty()
  createdAt: Date;
}

export class AuditLogPageDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items: AuditLogResponseDto[];

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
