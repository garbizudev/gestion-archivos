import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileItem, UploadRules } from '../../core/models/file.models';

@Injectable({ providedIn: 'root' })
export class FilesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/files`;

  //List es el método para imprimir los archivos
  list(): Observable<FileItem[]> {
    return this.http.get<FileItem[]>(this.baseUrl);
  }

  //Descarga de archivo
  download(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob',
    });
  }

  //Servicio de eliminación
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  //Retorna las reglas de carga como extensión y tamaño
  uploadRules(): Observable<UploadRules> {
    return this.http.get<UploadRules>(`${this.baseUrl}/upload-rules`);
  }

  //Servicio de carga de archivo
  upload(file: File): Observable<HttpEvent<FileItem>> {
    const body = new FormData();
    body.append('file', file, file.name);

    return this.http.post<FileItem>(this.baseUrl, body, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
