import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { AdminArea } from '../../../core/models/admin.models';
import { getApiErrorMessage } from '../../../shared/utils/http-error';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-area-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './area-form-dialog.html',
  styleUrl: './area-form-dialog.scss',
})
export class AreaFormDialog {
  private readonly area = inject<AdminArea | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AreaFormDialog, AdminArea>);
  private readonly admin = inject(AdminService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly isEdit = this.area !== null;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [
      this.area?.name ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    description: [this.area?.description ?? '', Validators.maxLength(500)],
  });

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const name = value.name.trim();
    const description = value.description.trim();

    const request: Observable<AdminArea> = this.area
      ? this.admin.updateArea(this.area.id, { name, description })
      : this.admin.createArea({ name, ...(description ? { description } : {}) });

    this.saving.set(true);
    this.errorMessage.set(null);

    request.subscribe({
      next: (saved) => this.dialogRef.close(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'No se pudo guardar el área.'));
      },
    });
  }
}
