import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import {
  AdminArea,
  AdminUser,
  RoleOption,
} from '../../../core/models/admin.models';
import { RoleCode } from '../../../core/models/auth.models';
import { NotificationService } from '../../../core/ui/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { getApiErrorMessage } from '../../../shared/utils/http-error';
import { AdminService } from '../admin.service';
import { UserFormDialog, UserFormDialogData } from './user-form-dialog';

const ROLE_TONES: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: 'accent',
  [RoleCode.MANAGER]: 'info',
  [RoleCode.AREA_HEAD]: 'success',
  [RoleCode.STANDARD]: 'neutral',
};

@Component({
  selector: 'app-users-page',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['user', 'role', 'area', 'managedAreas', 'status', 'actions'];

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly roles = signal<RoleOption[]>([]);
  protected readonly areas = signal<AdminArea[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly updatingId = signal<string | null>(null);
  protected readonly search = signal('');

  protected readonly filteredUsers = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.users();
    }
    return this.users().filter(
      (user) =>
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      users: this.admin.listUsers(),
      roles: this.admin.listRoles(),
      areas: this.admin.listAreas(),
    }).subscribe({
      next: ({ users, roles, areas }) => {
        this.users.set(users);
        this.roles.set(roles);
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected roleTone(code: RoleCode): string {
    return ROLE_TONES[code];
  }

  protected isSelf(user: AdminUser): boolean {
    return user.id === this.auth.user()?.id;
  }

  protected openForm(user: AdminUser | null = null): void {
    const data: UserFormDialogData = {
      user,
      roles: this.roles(),
      areas: this.areas(),
    };

    this.dialog
      .open<UserFormDialog, UserFormDialogData, AdminUser>(UserFormDialog, {
        data,
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
          user ? `Se actualizó a ${saved.fullName}.` : `Se creó a ${saved.fullName}.`,
        );
      });
  }

  protected confirmToggleActive(user: AdminUser): void {
    const deactivate = user.isActive;
    const data: ConfirmDialogData = deactivate
      ? {
          title: '¿Desactivar usuario?',
          message: 'No podrá iniciar sesión y perderá el acceso de inmediato.',
          detail: user.fullName,
          confirmText: 'Desactivar',
          tone: 'danger',
        }
      : {
          title: '¿Reactivar usuario?',
          message: 'Podrá volver a iniciar sesión con su rol y área actuales.',
          detail: user.fullName,
          confirmText: 'Reactivar',
        };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.setActive(user, !deactivate);
        }
      });
  }

  private setActive(user: AdminUser, isActive: boolean): void {
    this.updatingId.set(user.id);

    this.admin.updateUser(user.id, { isActive }).subscribe({
      next: (saved) => {
        this.updatingId.set(null);
        this.upsert(saved);
        this.notifications.success(
          isActive ? `Se reactivó a ${saved.fullName}.` : `Se desactivó a ${saved.fullName}.`,
        );
      },
      error: (error: unknown) => {
        this.updatingId.set(null);
        this.notifications.error(
          getApiErrorMessage(error, 'No se pudo actualizar el usuario.'),
        );
      },
    });
  }

  private upsert(saved: AdminUser): void {
    this.users.update((users) => {
      const exists = users.some((user) => user.id === saved.id);
      const next = exists
        ? users.map((user) => (user.id === saved.id ? saved : user))
        : [...users, saved];
      return next.sort((a, b) => a.fullName.localeCompare(b.fullName));
    });
  }
}
