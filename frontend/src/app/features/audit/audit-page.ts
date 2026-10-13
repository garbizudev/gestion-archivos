import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth/auth.service';
import {
  AUDIT_ACTIONS,
  AuditAction,
  AuditLog,
  AuditQuery,
} from '../../core/models/audit.models';
import { RoleCode } from '../../core/models/auth.models';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { AuditService } from './audit.service';

const LOGIN_FAILURE_REASONS: Record<string, string> = {
  UNKNOWN_EMAIL: 'Correo no registrado',
  INVALID_PASSWORD: 'Contraseña incorrecta',
  INACTIVE_USER: 'Usuario inactivo',
};

const OPERATIONS: Record<string, string> = {
  DOWNLOAD: 'descarga',
  DELETE: 'eliminación',
};

@Component({
  selector: 'app-audit-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.scss',
})
export class AuditPage implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly auth = inject(AuthService);
  private readonly fileSize = new FileSizePipe();

  protected readonly actions = AUDIT_ACTIONS;
  protected readonly actionOptions = Object.values(AuditAction);
  protected readonly columns = ['createdAt', 'action', 'actor', 'file', 'details', 'ip'];
  protected readonly pageSizeOptions = [10, 20, 50];

  protected readonly query = signal<AuditQuery>({ page: 1, limit: 20, action: null });
  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly scopeDescription = computed(() => {
    const user = this.auth.user();
    switch (user?.roleCode) {
      case RoleCode.ADMIN:
        return 'Historial general de todas las acciones del sistema.';
      case RoleCode.MANAGER: {
        const areas = user.managedAreas.map((area) => area.name).join(', ');
        return areas
          ? `Tus acciones y las de los usuarios de las áreas que gestionas: ${areas}.`
          : 'Tus acciones.';
      }
      default:
        return 'Tus acciones sobre el sistema.';
    }
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.auditService.list(this.query()).subscribe({
      next: (page) => {
        this.logs.set(page.items);
        this.total.set(page.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected onActionChange(action: AuditAction | null): void {
    this.query.update((query) => ({ ...query, action, page: 1 }));
    this.load();
  }

  protected onPageChange(event: PageEvent): void {
    this.query.update((query) => ({
      ...query,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    }));
    this.load();
  }

  protected actionInfo(action: AuditAction) {
    return this.actions[action];
  }

  protected describe(log: AuditLog): string {
    const details = log.details ?? {};

    switch (log.action) {
      case AuditAction.LOGIN_FAILED: {
        const reason = LOGIN_FAILURE_REASONS[String(details['reason'])] ?? 'Intento fallido';
        return details['email'] ? `${reason} (${String(details['email'])})` : reason;
      }
      case AuditAction.UPLOAD:
        return typeof details['sizeBytes'] === 'number'
          ? this.fileSize.transform(details['sizeBytes'])
          : '—';
      case AuditAction.ACCESS_DENIED: {
        const operation = OPERATIONS[String(details['operation'])];
        return operation ? `Intento de ${operation} fuera de su alcance` : 'Fuera de su alcance';
      }
      default:
        return '—';
    }
  }
}
