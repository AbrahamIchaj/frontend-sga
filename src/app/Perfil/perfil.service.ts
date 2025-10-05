import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROOT } from '../shared/config/api.config';

export interface PerfilData {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: number | null;
  activo: boolean;
  fechaCreacion: string;
  fechaDesabilitacion?: string | null;
  ultimoAcceso?: string | null;
  rol: {
    idRoles: number;
    nombreRol: string;
    descripcion: string;
  } | null;
  fotoPerfil?: string | null;
}

export interface PerfilResponse {
  success: boolean;
  message: string;
  data: PerfilData;
}

export interface UpdatePerfilPayload {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  fotoBase64?: string | null;
  eliminarFoto?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly API_URL = API_ROOT;

  constructor(private http: HttpClient) {}

  obtenerPerfil(idUsuario: number): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(
      `${this.API_URL}/usuarios/${idUsuario}/perfil`,
    );
  }

  actualizarPerfil(
    idUsuario: number,
    payload: UpdatePerfilPayload,
  ): Observable<PerfilResponse> {
    return this.http.patch<PerfilResponse>(
      `${this.API_URL}/usuarios/${idUsuario}/perfil`,
      payload,
    );
  }
}
