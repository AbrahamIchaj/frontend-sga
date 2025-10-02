import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Usuario,
  CreateUsuarioDto,
  UpdateUsuarioDto,
  ApiResponse,
  UsuarioConRol,
  AdminChangePasswordDto,
  GenerateTemporaryPasswordDto,
  PasswordResponse,
  LogPasswordTemporal,
  PasswordTemporalResponse
} from '../models/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/usuarios';
  private readonly authUrl = 'http://localhost:3000/api/v1/usuarios/auth';

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  findAll(): Observable<ApiResponse<UsuarioConRol[]>> {
    return this.http.get<ApiResponse<UsuarioConRol[]>>(this.apiUrl);
  }

  // Obtener un usuario por ID
  findOne(id: number): Observable<ApiResponse<UsuarioConRol>> {
    return this.http.get<ApiResponse<UsuarioConRol>>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo usuario
  create(usuario: CreateUsuarioDto): Observable<ApiResponse<UsuarioConRol>> {
    return this.http.post<ApiResponse<UsuarioConRol>>(this.apiUrl, usuario);
  }

  // Actualizar un usuario
  update(id: number, usuario: UpdateUsuarioDto): Observable<ApiResponse<UsuarioConRol>> {
    return this.http.put<ApiResponse<UsuarioConRol>>(`${this.apiUrl}/${id}`, usuario);
  }

  // Actualizar renglones permitidos de un usuario
  updateRenglones(id: number, renglones: number[]): Observable<ApiResponse<UsuarioConRol>> {
    return this.http.put<ApiResponse<UsuarioConRol>>(
      `${this.apiUrl}/${id}/renglones`,
      { renglones }
    );
  }

  // Eliminar un usuario
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Activar/Desactivar usuario
  toggleStatus(id: number, activo: boolean): Observable<ApiResponse<UsuarioConRol>> {
    return this.http.patch<ApiResponse<UsuarioConRol>>(`${this.apiUrl}/${id}/status`, { activo });
  }

  // Cambiar contraseña como administrador
  changePassword(id: number, dto: Omit<AdminChangePasswordDto, 'usuarioId'>): Observable<PasswordResponse> {
    return this.http.put<PasswordResponse>(`${this.authUrl}/${id}/password`, dto);
  }

  // Generar contraseña temporal para un usuario
  generateTemporaryPassword(id: number, dto: GenerateTemporaryPasswordDto): Observable<ApiResponse<PasswordTemporalResponse>> {
    return this.http.post<ApiResponse<PasswordTemporalResponse>>(`${this.authUrl}/${id}/password/generate`, dto);
  }

  // Obtener historial de contraseñas temporales de un usuario
  getPasswordHistory(id: number): Observable<ApiResponse<LogPasswordTemporal[]>> {
    return this.http.get<ApiResponse<LogPasswordTemporal[]>>(`${this.authUrl}/${id}/password/history`);
  }

  // Marcar que el usuario debe cambiar contraseña
  requirePasswordChange(id: number): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.authUrl}/${id}/require-password-change`, {});
  }

  // Obtener renglones disponibles en el sistema
  getRenglonesDisponibles(): Observable<ApiResponse<number[]>> {
    return this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/renglones/disponibles`);
  }
}