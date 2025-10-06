import { InventarioResponse } from '../../Inventario/inventario.service';

export type TipoReajuste = 1 | 2;

export interface ReajusteResumen {
  idReajuste: number;
  fechaReajuste: string;
  tipoReajuste: TipoReajuste;
  referenciaDocumento: string;
  observaciones?: string | null;
  idUsuario: number;
  usuarioNombre: string;
  cantidadDetalles: number;
  totalCantidad: number;
}

export interface ReajusteDetalle {
  idReajusteDetalle: number;
  idReajuste: number;
  idInventario: number;
  codigoInsumo: number;
  renglon?: number | null;
  nombreInsumo: string;
  caracteristicas: string;
  cantidad: number;
  codigoPresentacion?: number | null;
  presentacion?: string | null;
  unidadMedida?: string | null;
  lote?: string | null;
  fechaVencimiento?: string | null;
  observaciones?: string | null;
  Inventario?: Pick<
    InventarioResponse,
    |
      'idInventario'
      | 'cantidadDisponible'
      | 'lote'
      | 'fechaVencimiento'
      | 'precioUnitario'
      | 'precioTotal'
      | 'noKardex'
  > | null;
  CatalogoInsumos?: {
    idCatalogoInsumos: number;
    codigoInsumo: number;
    nombreInsumo: string;
    nombrePresentacion?: string | null;
    unidadMedida?: string | null;
  } | null;
}

export interface ReajusteCompleto extends ReajusteResumen {
  Usuarios?: {
    nombres: string;
    apellidos: string;
  };
  ReajusteDetalle: ReajusteDetalle[];
}

export interface PaginacionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReajustesListResponse {
  data: ReajusteResumen[];
  meta: PaginacionMeta;
}

export interface CatalogoInsumoResumen {
  idCatalogoInsumos: number;
  renglon: number;
  codigoInsumo: number;
  codigoPresentacion?: number | null;
  nombreInsumo: string;
  caracteristicas: string;
  nombrePresentacion?: string | null;
  unidadMedida?: string | null;
  precioReferencial?: number | null;
}

export interface ReajusteFilters {
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoReajuste?: TipoReajuste | '';
  referencia?: string;
  idUsuario?: number;
}

export interface CreateReajusteDetalleDto {
  idCatalogoInsumos?: number;
  renglon?: number;
  codigoInsumo?: number;
  codigoPresentacion?: number;
  nombreInsumo?: string;
  caracteristicas?: string;
  presentacion?: string;
  unidadMedida?: string;
  lote?: string;
  fechaVencimiento?: string;
  cantidad: number;
  observaciones?: string;
  precioUnitario?: number;
  cartaCompromiso?: boolean;
  mesesDevolucion?: number;
  observacionesDevolucion?: string;
  noKardex?: number;
}

export interface CreateReajusteDto {
  fechaReajuste?: string;
  tipoReajuste: TipoReajuste;
  referenciaDocumento: string;
  observaciones?: string;
  detalles: CreateReajusteDetalleDto[];
}
