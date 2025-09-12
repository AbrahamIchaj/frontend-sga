// Interfaz para Catálogo de Insumos basada en el esquema Prisma
export interface CatalogoInsumo {
  idCatalogoInsumos: number;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  nombrePresentacion: string;
  unidadMedida: string;
  codigoPresentacion: number;
}

// Interfaz para Presentación de Insumo
export interface PresentacionInsumo {
  idCatalogoInsumos: number;
  codigoPresentacion: number;
  nombrePresentacion: string;
  unidadMedida: string;
  renglon: number;
}

// Interfaz para Lote
export interface Lote {
  idIngresoComprasLotes?: number;
  idIngresoComprasDetalle?: number;
  tipoIngreso: string;
  cantidad: number;
  lote?: string;
  fechaVencimiento?: Date | string;
}

// Interfaz para Detalle de Compra
export interface DetalleCompra {
  idIngresoComprasDetalle?: number;
  idIngresoCompras?: number;
  idCatalogoInsumos: number;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion: number;
  presentacion: string;
  cantidadTotal: number;
  precioUnitario: number;
  precioTotalFactura: number;
  cartaCompromiso: boolean;
  observaciones?: string;
  lotes: Lote[];
}

// Interfaz para Compra (Ingreso de Compras)
export interface Compra {
  idIngresoCompras?: number;
  numeroFactura: number;
  serieFactura: string;
  tipoCompra: string;
  fechaIngreso: Date | string;
  proveedor: string;
  ordenCompra: number;
  programa: number;
  numero1h: number;
  noKardex: number;
  detalles?: DetalleCompra[];
  fechaCreacion?: Date | string;
  totalFactura?: number;
}

// DTOs para crear/actualizar
export interface CreateLoteDto {
  tipoIngreso: string;
  cantidad: number;
  lote?: string;
  fechaVencimiento?: Date | string;
}

export interface CreateDetalleCompraDto {
  idCatalogoInsumos: number;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion: number;
  presentacion: string;
  cantidadTotal: number;
  precioUnitario: number;
  precioTotalFactura: number;
  cartaCompromiso?: boolean;
  observaciones?: string;
  lotes: CreateLoteDto[];
}

export interface CreateCompraDto {
  numeroFactura: number;
  serieFactura: string;
  tipoCompra: string;
  fechaIngreso: Date | string;
  proveedor: string;
  ordenCompra: number;
  programa: number;
  numero1h: number;
  noKardex: number;
  detalles: CreateDetalleCompraDto[];
}

// Respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
}

export interface CompraResponse extends ApiResponse<Compra> {}
export interface ComprasListResponse extends ApiResponse<Compra[]> {}
export interface CatalogoResponse extends ApiResponse<CatalogoInsumo[]> {}

// Filtros para búsquedas
export interface FiltrosCompra {
  fechaDesde?: string;
  fechaHasta?: string;
  proveedor?: string;
  programa?: number;
  numeroFactura?: number;
}