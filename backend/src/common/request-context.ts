import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Datos del origen de la petición, usados en el historial de acciones. */
export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent')?.slice(0, 255) ?? null,
    };
  },
);
