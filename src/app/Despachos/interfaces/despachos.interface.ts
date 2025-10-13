export interface DisponibilidadLote {
  idInventario: number;
  lote: string;
  fechaVencimiento: string | null;
  cantidad: number;
  precioUnitario: number;
  cartaCompromiso: boolean;
}

export interface DisponibilidadProducto {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  presentacion: string;
  unidadMedida: string;
  existenciaTotal: number;
  lotes: DisponibilidadLote[];
}

export interface CarritoItem {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  presentacion: string;
  unidadMedida: string;
  cantidadSolicitada: number;
  existenciaTotal: number;
}

export interface DespachoDetalle {
  idDespachoDetalle: number;
  idInventario: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion: number | null;
  presentacion: string | null;
  unidadMedida: string | null;
  lote: string | null;
  fechaVencimiento: string | null;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface DespachoResumen {
  idDespacho: number;
  codigoDespacho: string;
  fechaDespacho: string;
  servicio: string | null;
  usuario: string;
  totalCantidad: number;
  totalGeneral: number;
  totalItems: number;
  renglones: number[];
}

export interface DespachoCompleto {
  idDespacho: number;
  codigoDespacho: string;
  fechaDespacho: string;
  observaciones: string | null;
  totalCantidad: number;
  totalGeneral: number;
   renglones: number[];
  servicio: {
    idServicio: number | null;
    nombre: string | null;
  } | null;
  usuario: {
    idUsuario: number;
    nombres: string;
    apellidos: string;
  };
  detalles: DespachoDetalle[];
}

export interface DespachosListResponse {
  data: DespachoResumen[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DespachoFilters {
  page?: number;
  limit?: number;
  codigo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  idServicio?: number;
  buscar?: string;
  anio?: number;
  renglones?: number[];
  idUsuario?: number;
  idUsuarioCreador?: number;
}

export interface CreateDespachoRequest {
  idServicio?: number;
  observaciones?: string;
  detalles: {
    codigoInsumo: number;
    cantidad: number;
    codigoPresentacion?: number;
    idCatalogoInsumos?: number;
  }[];
}
