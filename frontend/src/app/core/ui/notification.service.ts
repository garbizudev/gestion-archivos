import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'ga-snackbar--success');
  }

  error(message: string): void {
    this.open(message, 'ga-snackbar--error', 6000);
  }

  private open(message: string, panelClass: string, duration = 4000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['ga-snackbar', panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
