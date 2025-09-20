import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Rol,
  CreateRolDto,
  UpdateRolDto,
  ApiResponse,
  RolConPermisos,
  AsignarPermisosDto,
  RevocarPermisosDto,
  SincronizarPermisosDto
} from '../models/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/roles';

  constructor(private http: HttpClient) {}

  // Obtener todos los roles
  findAll(): Observable<ApiResponse<RolConPermisos[]>> {
    return this.http.get<ApiResponse<RolConPermisos[]>>(this.apiUrl);
  }

  // Obtener un rol por ID
  findOne(id: number): Observable<ApiResponse<RolConPermisos>> {
    return this.http.get<ApiResponse<RolConPermisos>>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo rol
  create(rol: CreateRolDto): Observable<ApiResponse<RolConPermisos>> {
    return this.http.post<ApiResponse<RolConPermisos>>(this.apiUrl, rol);
  }

  // Actualizar un rol
  update(id: number, rol: UpdateRolDto): Observable<ApiResponse<RolConPermisos>> {
    return this.http.patch<ApiResponse<RolConPermisos>>(`${this.apiUrl}/${id}`, rol);
  }

  // Eliminar un rol
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Asignar permisos a un rol
  asignarPermisos(id: number, permisos: AsignarPermisosDto): Observable<ApiResponse<RolConPermisos>> {
    return this.http.post<ApiResponse<RolConPermisos>>(`${this.apiUrl}/${id}/permisos`, permisos);
  }

  // Revocar permisos de un rol
  revocarPermisos(id: number, permisos: RevocarPermisosDto): Observable<ApiResponse<RolConPermisos>> {
    return this.http.delete<ApiResponse<RolConPermisos>>(`${this.apiUrl}/${id}/permisos`, {
      body: permisos
    });
  }

  // Sincronizar permisos de un rol (reemplaza todos los permisos actuales)
  sincronizarPermisos(id: number, permisos: SincronizarPermisosDto): Observable<ApiResponse<RolConPermisos>> {
    return this.http.put<ApiResponse<RolConPermisos>>(`${this.apiUrl}/${id}/permisos`, permisos);
  }

  // Obtener permisos de un rol específico
  getPermisos(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${id}/permisos`);
  }
}