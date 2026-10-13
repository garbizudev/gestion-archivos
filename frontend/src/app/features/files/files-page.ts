import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { RoleCode } from '../../core/models/auth.models';
import {
  FileItem,
  FileQuery,
  UploadRules,
} from '../../core/models/file.models';
import { NotificationService } from '../../core/ui/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog';
import { FileIconPipe } from '../../shared/pipes/file-icon.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { getApiErrorMessage } from '../../shared/utils/http-error';
import { saveBlob } from '../../shared/utils/save-blob';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FilesService } from './files.service';

@Component({
  selector: 'app-files-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
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
  protected readonly uploadRules = signal<UploadRules | null>(null);
  protected readonly uploading = signal<{
    fileName: string;
    progress: number;
  } | null>(null);
  protected readonly acceptedTypes = computed(
    () =>
      this.uploadRules()
        ?.allowedExtensions.map((extension) => `.${extension}`)
        .join(',') ?? '',
  );
  protected readonly uploadHint = computed(() => {
    const rules = this.uploadRules();
    if (!rules) {
      return '';
    }
    return `Máximo ${this.fileSize.transform(rules.maxUploadBytes)} · ${rules.allowedExtensions.join(', ')}`;
  });

  private readonly fileSize = new FileSizePipe();
  protected readonly files = signal<FileItem[]>([]);
  protected readonly total = signal(0);
  protected readonly query = signal<FileQuery>({ page: 1, limit: 10, search: '' });
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  private readonly searchTerms = new Subject<string>();

  constructor() {
    this.searchTerms
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => {
        this.query.update((query) => ({ ...query, search, page: 1 }));
        this.load();
      });
  }

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

  protected readonly canUpload = computed(
    () => this.auth.user()?.roleCode !== RoleCode.ADMIN,
  );

  ngOnInit(): void {
    this.load();
    if (this.canUpload()) {
      this.filesService.uploadRules().subscribe({
        next: (rules) => this.uploadRules.set(rules),
        error: () => this.uploadRules.set(null),
      });
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const validationError = this.validateFile(file);
    if (validationError) {
      this.notifications.error(validationError);
      return;
    }

    this.upload(file);
  }

  private validateFile(file: File): string | null {
    if (file.size === 0) {
      return 'El archivo está vacío.';
    }

    const rules = this.uploadRules();
    if (!rules) {
      return null;
    }

    if (file.size > rules.maxUploadBytes) {
      return `El archivo supera el tamaño máximo permitido de ${this.fileSize.transform(rules.maxUploadBytes)}.`;
    }

    const extension = file.name.includes('.')
      ? file.name.split('.').pop()!.toLowerCase()
      : '';
    if (!rules.allowedExtensions.includes(extension)) {
      return `Tipo de archivo no permitido. Extensiones permitidas: ${rules.allowedExtensions.join(', ')}.`;
    }

    return null;
  }

  private upload(file: File): void {
    this.uploading.set({ fileName: file.name, progress: 0 });

    this.filesService.upload(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total
            ? Math.round((event.loaded / event.total) * 100)
            : 0;
          this.uploading.set({ fileName: file.name, progress });
        } else if (event.type === HttpEventType.Response && event.body) {
          const created = event.body;
          this.uploading.set(null);
          this.notifications.success(`Se cargó "${created.originalName}".`);
          this.query.update((query) => ({ ...query, page: 1 }));
          this.load();
        }
      },
      error: (error: unknown) => {
        this.uploading.set(null);
        this.notifications.error(
          getApiErrorMessage(error, 'No se pudo cargar el archivo.'),
        );
      },
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);

    //Este proceso de listar arhcvos se carga en el inicio de la operación
    this.filesService.list(this.query()).subscribe({
      next: (page) => {
        this.files.set(page.items);
        this.total.set(page.total);
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
        this.notifications.success(`Se eliminó "${file.originalName}".`);
        if (this.files().length === 1 && this.query().page > 1) {
          this.query.update((query) => ({ ...query, page: query.page - 1 }));
        }
        this.load();
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

  protected onSearch(event: Event): void {
    this.searchTerms.next((event.target as HTMLInputElement).value.trim());
  }

  protected onPageChange(event: PageEvent): void {
    this.query.update((query) => ({
      ...query,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    }));
    this.load();
  }

  protected isMine(file: FileItem): boolean {
    return file.owner.id === this.auth.user()?.id;
  }
}
