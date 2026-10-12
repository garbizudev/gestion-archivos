import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user';
import { RequestContext } from '../common/request-context';
import { AuditAction } from './audit-action.enum';
import { AuditPolicy } from './audit.policy';
import {
  AuditLogPageDto,
  AuditLogResponseDto,
} from './dto/audit-log-response.dto';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditEntry {
  action: AuditAction;
  actor?: { id: string; areaId: string | null } | null;
  file?: { id: string; originalName: string } | null;
  context?: RequestContext;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
    private readonly policy: AuditPolicy,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    const log = this.auditLogs.create({
      action: entry.action,
      actorId: entry.actor?.id ?? null,
      actorAreaId: entry.actor?.areaId ?? null,
      fileId: entry.file?.id ?? null,
      fileName: entry.file?.originalName ?? null,
      ipAddress: entry.context?.ipAddress ?? null,
      userAgent: entry.context?.userAgent ?? null,
      details: entry.details ?? null,
    });
    await this.auditLogs.save(log);
  }

  //Metodo para lisatr movimientos
  async list(
    user: AuthUser,
    query: ListAuditQueryDto,
  ): Promise<AuditLogPageDto> {
    const builder = this.auditLogs
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.createdAt', 'DESC')
      .addOrderBy('log.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

      //Validamos el scope según el usuario
    const scope = this.policy.visibleScope(user);
    if (!scope.all) {
      builder.andWhere(
        new Brackets((where) => {
          where.where('log.actorId = :scopeActorId', {
            scopeActorId: scope.actorId,
          });
          if (scope.actorAreaIds.length > 0) {
            where.orWhere('log.actorAreaId IN (:...scopeAreaIds)', {
              scopeAreaIds: scope.actorAreaIds,
            });
          }
        }),
      );
    }

    if (query.action) {
      builder.andWhere('log.action = :action', { action: query.action });
    }

    const [logs, total] = await builder.getManyAndCount();

    return {
      items: logs.map((log) => this.toResponse(log)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private toResponse(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action,
      actor: log.actor
        ? {
            id: log.actor.id,
            fullName: log.actor.fullName,
            email: log.actor.email,
          }
        : null,
      fileId: log.fileId,
      fileName: log.fileName,
      ipAddress: log.ipAddress,
      details: log.details,
      createdAt: log.createdAt,
    };
  }
}
