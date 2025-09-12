export interface Servicio {
  idServicio?: number;
  nombre: string;
  observaciones?: string;
}

export interface CreateServicioDto {
  nombre: string;
  observaciones?: string;
}

export interface UpdateServicioDto {
  nombre?: string;
  observaciones?: string;
}
