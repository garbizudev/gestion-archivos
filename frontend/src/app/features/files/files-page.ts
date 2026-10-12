import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { RoleCode } from '../../core/models/auth.models';
import { FileItem } from '../../core/models/file.models';
import { NotificationService } from '../../core/ui/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog';
import { FileIconPipe } from '../../shared/pipes/file-icon.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { getApiErrorMessage } from '../../shared/utils/http-error';
import { saveBlob } from '../../shared/utils/save-blob';
import { FilesService } from './files.service';

@Component({
  selector: 'app-files-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    FileIconPipe,
    FileSizePipe,
  ],
  templateUrl: './files-page.html',
  styleUrl: './files-page.scss',
})
export class FilesPage implements OnInit {
  private readonly filesService = inject(FilesService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  protected readonly auth = inject(AuthService);

  protected readonly columns = [
    'name',
    'owner',
    'area',
    'size',
    'createdAt',
    'actions',
  ];
  protected readonly downloadingId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly files = signal<FileItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly scopeDescription = computed(() => {
    const user = this.auth.user();
    switch (user?.roleCode) {
      case RoleCode.ADMIN:
        return 'Todos los archivos del sistema.';
      case RoleCode.MANAGER: {
        const areas = user.managedAreas.map((area) => area.name).join(', ');
        return areas
          ? `Tus archivos y los de las áreas que gestionas: ${areas}.`
          : 'Tus archivos.';
      }
      case RoleCode.AREA_HEAD:
        return user.areaName
          ? `Tus archivos y los del área ${user.areaName}.`
          : 'Tus archivos.';
      default:
        return 'Tus archivos.';
    }
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);

    //Este proceso de listar arhcvos se carga en el inicio de la operación
    this.filesService.list().subscribe({
      next: (files) => {
        this.files.set(files);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  //Metodo para descargar el archivo
  protected download(file: FileItem): void {
    if (this.downloadingId()) {
      return;
    }
    this.downloadingId.set(file.id);

    this.filesService.download(file.id).subscribe({
      next: (blob) => {
        saveBlob(blob, file.originalName);
        this.downloadingId.set(null);
      },
      error: (error: unknown) => {
        this.downloadingId.set(null);
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.notifications.error(
            'El archivo ya no está disponible. Se actualizó la lista.',
          );
          this.load();
        } else {
          this.notifications.error('No se pudo descargar el archivo.');
        }
      },
    });
  }

  //Confirmación de eliminación
  protected confirmRemove(file: FileItem): void {
    const data: ConfirmDialogData = {
      title: '¿Eliminar archivo?',
      message: 'El archivo dejará de estar disponible para todos los usuarios.',
      detail: file.originalName,
      confirmText: 'Eliminar',
      tone: 'danger',
    };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.remove(file); //Primero se consulta y luego se elimina
        }
      });
  }

  //Proceso de eliminar
  private remove(file: FileItem): void {
    this.deletingId.set(file.id);

    this.filesService.remove(file.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.files.update((files) => files.filter((item) => item.id !== file.id));
        this.notifications.success(`Se eliminó "${file.originalName}".`);
      },
      error: (error: unknown) => {
        this.deletingId.set(null);
        this.notifications.error(
          getApiErrorMessage(error, 'No se pudo eliminar el archivo.'),
        );
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.load();
        }
      },
    });
  }

  protected isMine(file: FileItem): boolean {
    return file.owner.id === this.auth.user()?.id;
  }
}
