import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import {
  AdminArea,
  AdminUser,
  RoleOption,
  ROLES_REQUIRING_AREA,
} from '../../../core/models/admin.models';
import { RoleCode } from '../../../core/models/auth.models';
import { getApiErrorMessage } from '../../../shared/utils/http-error';
import { AdminService } from '../admin.service';

export interface UserFormDialogData {
  user: AdminUser | null;
  roles: RoleOption[];
  areas: AdminArea[];
}

const PASSWORD_VALIDATORS = [
  Validators.minLength(8),
  Validators.maxLength(72),
  Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
];

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './user-form-dialog.html',
  styleUrl: './user-form-dialog.scss',
})
export class UserFormDialog {
  private readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog, AdminUser>);
  private readonly admin = inject(AdminService);
  private readonly formBuilder = inject(FormBuilder);

  private readonly user = this.data.user;
  protected readonly isEdit = this.user !== null;

  protected readonly roles = this.data.roles.filter(
    (role) => role.isActive || role.code === this.user?.role.code,
  );
  protected readonly areas = this.data.areas.filter(
    (area) =>
      area.isActive ||
      area.id === this.user?.area?.id ||
      this.user?.managedAreas.some((managed) => managed.id === area.id),
  );

  protected readonly form = this.formBuilder.group({
    fullName: this.formBuilder.nonNullable.control(this.user?.fullName ?? '', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(150),
    ]),
    email: this.formBuilder.nonNullable.control(
      { value: this.user?.email ?? '', disabled: this.isEdit },
      [Validators.required, Validators.email, Validators.maxLength(150)],
    ),
    password: this.formBuilder.nonNullable.control(
      '',
      this.isEdit ? PASSWORD_VALIDATORS : [Validators.required, ...PASSWORD_VALIDATORS],
    ),
    roleCode: this.formBuilder.nonNullable.control<RoleCode>(
      this.user?.role.code ?? RoleCode.STANDARD,
      Validators.required,
    ),
    areaId: this.formBuilder.control<string | null>(this.user?.area?.id ?? null),
    managedAreaIds: this.formBuilder.nonNullable.control<string[]>(
      this.user?.managedAreas.map((area) => area.id) ?? [],
    ),
  });

  private readonly roleCode = toSignal(this.form.controls.roleCode.valueChanges, {
    initialValue: this.form.controls.roleCode.value,
  });
  protected readonly requiresArea = computed(() =>
    ROLES_REQUIRING_AREA.includes(this.roleCode()),
  );
  protected readonly isManager = computed(() => this.roleCode() === RoleCode.MANAGER);

  protected readonly hidePassword = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const areaControl = this.form.controls.areaId;
      areaControl.setValidators(this.requiresArea() ? Validators.required : null);
      areaControl.updateValueAndValidity();

      if (!this.isManager()) {
        this.form.controls.managedAreaIds.setValue([]);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const common = {
      fullName: value.fullName.trim(),
      roleCode: value.roleCode,
      areaId: value.areaId,
      managedAreaIds: this.isManager() ? value.managedAreaIds : [],
    };

    const request: Observable<AdminUser> = this.user
      ? this.admin.updateUser(this.user.id, {
          ...common,
          ...(value.password ? { password: value.password } : {}),
        })
      : this.admin.createUser({
          ...common,
          email: value.email.trim().toLowerCase(),
          password: value.password,
        });

    this.saving.set(true);
    this.errorMessage.set(null);

    request.subscribe({
      next: (saved) => this.dialogRef.close(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorMessage.set(
          getApiErrorMessage(error, 'No se pudo guardar el usuario.'),
        );
      },
    });
  }
}
