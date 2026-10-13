import { Pipe, PipeTransform } from '@angular/core';

const UNITS = ['B', 'KB', 'MB', 'GB'];

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined || bytes < 0) {
      return '—';
    }

    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < UNITS.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    const decimals = unitIndex === 0 || value >= 10 ? 0 : 1;
    return `${value.toFixed(decimals)} ${UNITS[unitIndex]}`;
  }
}
