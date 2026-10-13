import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminArea,
  AdminUser,
  CreateAreaRequest,
  CreateUserRequest,
  RoleOption,
  UpdateAreaRequest,
  UpdateUserRequest,
} from '../../core/models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  createUser(body: CreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/users`, body);
  }

  updateUser(id: string, body: UpdateUserRequest): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${id}`, body);
  }

  listRoles(): Observable<RoleOption[]> {
    return this.http.get<RoleOption[]>(`${this.apiUrl}/roles`);
  }

  listAreas(): Observable<AdminArea[]> {
    return this.http.get<AdminArea[]>(`${this.apiUrl}/areas`);
  }

  createArea(body: CreateAreaRequest): Observable<AdminArea> {
    return this.http.post<AdminArea>(`${this.apiUrl}/areas`, body);
  }

  updateArea(id: string, body: UpdateAreaRequest): Observable<AdminArea> {
    return this.http.patch<AdminArea>(`${this.apiUrl}/areas/${id}`, body);
  }
}
