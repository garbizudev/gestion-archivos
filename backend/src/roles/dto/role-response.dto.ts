import { ApiProperty } from '@nestjs/swagger';
import { RoleCode } from '../role-code.enum';

export class RoleResponseDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ enum: RoleCode, example: RoleCode.MANAGER })
  code: RoleCode;

  @ApiProperty({ example: 'Gerente' })
  name: string;

  @ApiProperty({
    nullable: true,
    example:
      'Visualiza, descarga y elimina archivos de las áreas a su cargo y consulta su historial.',
  })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}
