import { ApiProperty } from '@nestjs/swagger';

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
}
