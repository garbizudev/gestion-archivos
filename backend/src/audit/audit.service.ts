import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContext } from '../common/request-context';
import { AuditAction } from './audit-action.enum';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditEntry {
  action: AuditAction;
  /** Quién realizó la acción (nulo si no se pudo identificar, p. ej. email inexistente). */
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
}
