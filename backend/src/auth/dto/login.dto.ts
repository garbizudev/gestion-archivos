import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  @MaxLength(72) // límite de bcrypt
  password: string;
}
