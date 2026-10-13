import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogPage, AuditQuery } from '../../core/models/audit.models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  list(query: AuditQuery): Observable<AuditLogPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit);
    if (query.action) {
      params = params.set('action', query.action);
    }
    return this.http.get<AuditLogPage>(this.baseUrl, { params });
  }
}
