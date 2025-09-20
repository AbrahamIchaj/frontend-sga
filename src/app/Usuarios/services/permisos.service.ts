import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Permiso,
  CreatePermisoDto,
  UpdatePermisoDto,
  ApiResponse,
  PermisoConRoles
} from '../models/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/permisos';

  constructor(private http: HttpClient) {}

  // Obtener todos los permisos
  findAll(): Observable<ApiResponse<PermisoConRoles[]>> {
    return this.http.get<ApiResponse<PermisoConRoles[]>>(this.apiUrl);
  }

  // Obtener un permiso por ID
  findOne(id: number): Observable<ApiResponse<PermisoConRoles>> {
    return this.http.get<ApiResponse<PermisoConRoles>>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo permiso
  create(permiso: CreatePermisoDto): Observable<ApiResponse<PermisoConRoles>> {
    return this.http.post<ApiResponse<PermisoConRoles>>(this.apiUrl, permiso);
  }

  // Actualizar un permiso
  update(id: number, permiso: UpdatePermisoDto): Observable<ApiResponse<PermisoConRoles>> {
    return this.http.patch<ApiResponse<PermisoConRoles>>(`${this.apiUrl}/${id}`, permiso);
  }

  // Eliminar un permiso
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}