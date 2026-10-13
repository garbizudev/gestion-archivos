import { Request } from 'express';
import { AuthUser } from './dto/auth-user.dto';

export { AuthUser };

export interface JwtPayload {
  sub: string;
}

export type AuthenticatedRequest = Request & { user: AuthUser };
