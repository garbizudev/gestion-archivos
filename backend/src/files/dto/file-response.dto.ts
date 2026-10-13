import { ApiProperty } from '@nestjs/swagger';

export class FileOwnerDto {
  @ApiProperty({ example: 'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e' })
  id: string;

  @ApiProperty({ example: 'Tomás Técnico' })
  fullName: string;

  @ApiProperty({ example: 'usuario.tec@example.com' })
  email: string;
}

export class FileAreaDto {
  @ApiProperty({ example: 'c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f' })
  id: string;

  @ApiProperty({ example: 'Tecnología' })
  name: string;
}

export class FileResponseDto {
  @ApiProperty({ example: '7c1e4b2a-9f3d-4c8e-a1b2-3d4e5f6a7b8c' })
  id: string;

  @ApiProperty({ example: 'informe-trimestral.pdf' })
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 248133 })
  sizeBytes: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: FileOwnerDto })
  owner: FileOwnerDto;

  @ApiProperty({ type: FileAreaDto, nullable: true })
  area: FileAreaDto | null;

  @ApiProperty({ example: true })
  canDelete: boolean;
}

export class FileListResponseDto {
  @ApiProperty({ type: [FileResponseDto] })
  items: FileResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
