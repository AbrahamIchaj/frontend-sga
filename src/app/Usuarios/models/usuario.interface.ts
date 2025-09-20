export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: number;
  fechaCreacion: string;
  img?: Uint8Array;
  activo: boolean;
  fechaDesabilitacion?: string;
  ultimoAcceso?: string;
  idRol: number;
  esTemporal: boolean;
  fechaPasswordTemporal?: string;
  debesCambiarPassword: boolean;
  intentosCambioPassword: number;
  Roles?: Rol;
}

export interface Rol {
  idRoles: number;
  nombreRol: string;
  descripcion: string;
  RolPermisos?: RolPermiso[];
  Usuarios?: Usuario[];
}

export interface Permiso {
  idPermisos: number;
  permiso: string;
  descripcion: string;
  RolPermisos?: RolPermiso[];
}

export interface RolPermiso {
  idRoles: number;
  idPermisos: number;
  activo: boolean;
  Roles?: Rol;
  Permisos?: Permiso;
}

// DTOs para crear/actualizar
export interface CreateUsuarioDto {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  telefono?: number;
  idRol: number;
  activo?: boolean;
}

export interface UpdateUsuarioDto {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: number;
  idRol?: number;
  activo?: boolean;
}

export interface CreateRolDto {
  nombreRol: string;
  descripcion: string;
}

export interface UpdateRolDto {
  nombreRol?: string;
  descripcion?: string;
}

export interface CreatePermisoDto {
  permiso: string;
  descripcion: string;
}

export interface UpdatePermisoDto {
  permiso?: string;
  descripcion?: string;
}

export interface AsignarPermisosDto {
  permisos: number[];
}

export interface RevocarPermisosDto {
  permisos: number[];
}

export interface SincronizarPermisosDto {
  permisos: number[];
}

// DTOs para gestión de contraseñas
export interface AdminChangePasswordDto {
  usuarioId: number;
  newPassword?: string;
  generarTemporal?: boolean;
  notificarEmail?: boolean;
  adminEmail: string;
  ip?: string;
}

export interface GenerateTemporaryPasswordDto {
  adminEmail: string;
  motivo?: string;
  ip?: string;
}

export interface PasswordResponse {
  success: boolean;
  message: string;
  temporaryPassword?: string;
  fechaExpiracion?: string;
  data?: {
    temporaryPassword?: string;
    fechaExpiracion?: string;
    passwordChanged?: boolean;
  };
}

// Respuestas API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

export interface UsuarioConRol extends Usuario {
  Roles: Rol;
}

export interface RolConPermisos {
  idRoles: number;
  nombreRol: string;
  descripcion: string;
  RolPermisos: Array<{
    Permisos: Permiso;
  }>;
  Usuarios: Array<{
    idUsuario: number;
    nombres: string;
    apellidos: string;
    correo: string;
    activo: boolean;
  }>;
}

export interface PermisoConRoles {
  idPermisos: number;
  permiso: string;
  descripcion: string;
  RolPermisos: Array<{
    Roles: Rol;
  }>;
}

// Interface para el log de contraseñas temporales
export interface LogPasswordTemporal {
  idLog: number;
  idUsuario: number;
  passwordTemporal: string; // Solo para passwords temporales
  fechaGeneracion: string;
  fechaExpiracion: string;
  usado: boolean;
  fechaUso?: string;
  ipGeneracion?: string;
  adminGenerador: string;
  motivoGeneracion: string;
  Usuario?: Usuario;
}

// DTOs para generar contraseña temporal
export interface GenerateTemporaryPasswordDto {
  motivoGeneracion: string;
  adminEmail: string;
  horasExpiracion?: number; // Por defecto 24 horas
}

export interface PasswordTemporalResponse {
  passwordTemporal: string;
  fechaExpiracion: string;
  mensaje: string;
}