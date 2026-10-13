import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAreaDto {
  @ApiProperty({ example: 'Operaciones' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ example: 'Logística y servicios generales.' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
