import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileIcon' })
export class FileIconPipe implements PipeTransform {
  transform(mimeType: string): string {
    if (mimeType === 'application/pdf') {
      return 'picture_as_pdf';
    }
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
      return 'table_chart';
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return 'slideshow';
    }
    if (mimeType.includes('word') || mimeType === 'text/plain') {
      return 'description';
    }
    if (mimeType === 'application/zip') {
      return 'folder_zip';
    }
    return 'insert_drive_file';
  }
}
