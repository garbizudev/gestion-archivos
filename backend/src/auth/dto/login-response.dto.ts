import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from './auth-user.dto';

export class LoginResponseDto {
  /** JWT que debe enviarse en la cabecera `Authorization: Bearer <token>`. */
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  user: AuthUser;
}
