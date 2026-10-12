import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth/auth.service';
import { RoleCode } from '../../core/models/auth.models';
import { FileItem } from '../../core/models/file.models';
import { FileIconPipe } from '../../shared/pipes/file-icon.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { FilesService } from './files.service';

@Component({
  selector: 'app-files-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FileIconPipe,
    FileSizePipe,
  ],
  templateUrl: './files-page.html',
  styleUrl: './files-page.scss',
})
export class FilesPage implements OnInit {
  private readonly filesService = inject(FilesService);
  protected readonly auth = inject(AuthService);

  protected readonly columns = ['name', 'owner', 'area', 'size', 'createdAt'];
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

  protected isMine(file: FileItem): boolean {
    return file.owner.id === this.auth.user()?.id;
  }
}
