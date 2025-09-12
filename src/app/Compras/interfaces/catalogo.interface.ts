// Interfaces para el Catálogo de Insumos

export interface CatalogoInsumoInterface {
  id: number;
  codigo: string;
  nombre: string;
  caracteristicas?: string;
  presentacion?: string;
  unidadMedida?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresentacionInterface {
  id: number;
  codigo: string;
  nombre: string;
  unidadMedida: string;
}

export interface CreateCatalogoInsumoDto {
  codigo: string;
  nombre: string;
  caracteristicas?: string;
  presentacion?: string;
  unidadMedida?: string;
}

export interface UpdateCatalogoInsumoDto {
  codigo?: string;
  nombre?: string;
  caracteristicas?: string;
  presentacion?: string;
  unidadMedida?: string;
  activo?: boolean;
}

export interface CatalogoApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
}

export interface CatalogoListResponse extends CatalogoApiResponse<CatalogoInsumoInterface[]> {}
export interface CatalogoItemResponse extends CatalogoApiResponse<CatalogoInsumoInterface> {}