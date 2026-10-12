import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleCode } from '../../roles/role-code.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo.usuario@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'Nuevo Usuario' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 150)
  fullName: string;

  @ApiProperty({ example: 'Clave2026', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'La contraseña debe contener letras y números',
  })
  password: string;

  @ApiProperty({ enum: RoleCode, example: RoleCode.STANDARD })
  @IsEnum(RoleCode)
  roleCode: RoleCode;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Obligatoria para usuarios estándar y jefes de área.',
  })
  @IsOptional()
  @IsUUID()
  areaId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Solo para gerentes: áreas bajo su gestión.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  managedAreaIds?: string[];
}
