import { ApiProperty } from '@nestjs/swagger';

export class AreaResponseDto {
  @ApiProperty({ example: 'c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f' })
  id: string;

  @ApiProperty({ example: 'Tecnología' })
  name: string;

  @ApiProperty({ nullable: true, example: 'Desarrollo e infraestructura.' })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
