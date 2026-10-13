import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminArea } from '../../../core/models/admin.models';
import { NotificationService } from '../../../core/ui/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { getApiErrorMessage } from '../../../shared/utils/http-error';
import { AdminService } from '../admin.service';
import { AreaFormDialog } from './area-form-dialog';

@Component({
  selector: 'app-areas-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './areas-page.html',
  styleUrl: './areas-page.scss',
})
export class AreasPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['name', 'description', 'status', 'updatedAt', 'actions'];

  protected readonly areas = signal<AdminArea[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly updatingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.admin.listAreas().subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected openForm(area: AdminArea | null = null): void {
    this.dialog
      .open<AreaFormDialog, AdminArea | null, AdminArea>(AreaFormDialog, {
        data: area,
        autoFocus: 'first-tabbable',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((saved) => {
        if (!saved) {
          return;
        }
        this.upsert(saved);
        this.notifications.success(
          area ? `Se actualizó el área ${saved.name}.` : `Se creó el área ${saved.name}.`,
        );
      });
  }

  protected confirmToggleActive(area: AdminArea): void {
    const deactivate = area.isActive;
    const data: ConfirmDialogData = deactivate
      ? {
          title: '¿Desactivar área?',
          message:
            'No se podrá asignar a usuarios nuevos. Los usuarios y archivos actuales se conservan.',
          detail: area.name,
          confirmText: 'Desactivar',
          tone: 'danger',
        }
      : {
          title: '¿Reactivar área?',
          message: 'Volverá a estar disponible para asignar a usuarios.',
          detail: area.name,
          confirmText: 'Reactivar',
        };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.setActive(area, !deactivate);
        }
      });
  }

  private setActive(area: AdminArea, isActive: boolean): void {
    this.updatingId.set(area.id);

    this.admin.updateArea(area.id, { isActive }).subscribe({
      next: (saved) => {
        this.updatingId.set(null);
        this.upsert(saved);
        this.notifications.success(
          isActive ? `Se reactivó el área ${saved.name}.` : `Se desactivó el área ${saved.name}.`,
        );
      },
      error: (error: unknown) => {
        this.updatingId.set(null);
        this.notifications.error(getApiErrorMessage(error, 'No se pudo actualizar el área.'));
      },
    });
  }

  private upsert(saved: AdminArea): void {
    this.areas.update((areas) => {
      const exists = areas.some((area) => area.id === saved.id);
      const next = exists
        ? areas.map((area) => (area.id === saved.id ? saved : area))
        : [...areas, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }
}
