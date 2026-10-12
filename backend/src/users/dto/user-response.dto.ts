import { ApiProperty } from '@nestjs/swagger';
import { RoleCode } from '../../roles/role-code.enum';

export class UserRoleDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ enum: RoleCode, example: RoleCode.MANAGER })
  code: RoleCode;

  @ApiProperty({ example: 'Gerente' })
  name: string;
}

export class UserAreaDto {
  @ApiProperty({ example: 'c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f' })
  id: string;

  @ApiProperty({ example: 'Tecnología' })
  name: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e' })
  id: string;

  @ApiProperty({ example: 'gerente@example.com' })
  email: string;

  @ApiProperty({ example: 'Gonzalo Gerente' })
  fullName: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: UserRoleDto })
  role: UserRoleDto;

  @ApiProperty({ type: UserAreaDto, nullable: true })
  area: UserAreaDto | null;

  @ApiProperty({ type: [UserAreaDto] })
  managedAreas: UserAreaDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
