export interface ReporteFiltros {
  anio?: number;
  anioInicio?: number;
  anioFin?: number;
  mes?: number;
  mesesPromedio?: number;
  idServicio?: number;
  codigoInsumo?: number;
  renglones?: number[];
  idUsuario?: number;
}

export interface ConsumoInsumoResumen {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
}

export interface ConsumoRenglonResumen {
  renglon: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  insumos: ConsumoInsumoResumen[];
}

export interface ConsumoMensualResumen {
  mes: number;
  nombreMes: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  renglones: ConsumoRenglonResumen[];
}

export interface ConsumoMensualResponse {
  anio: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  meses: ConsumoMensualResumen[];
}

export interface DiaCalendarioConsumo {
  fecha: string;
  anio: number;
  mes: number;
  dia: number;
  etiqueta: string;
  nombreMes: string;
}

export interface ConsumoInsumoDetallePeriodo {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  renglon?: number | null;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioCantidad: number;
  promedioGeneral: number;
  promedioDespachos: number;
  dias?: Array<{
    fecha: string;
    anio: number;
    mes: number;
    dia: number;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
}

export interface ConsumoPeriodoDetalle {
  etiqueta: string;
  mesesConsiderados: number;
  mesesEsperados: number;
  mesesConDatos: number;
  fechaInicio: string;
  fechaFin: string;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioCantidad: number;
  promedioGeneral: number;
  promedioDespachos: number;
  dias?: DiaCalendarioConsumo[];
  resumenPorDia?: Array<{
    fecha: string;
    anio: number;
    mes: number;
    dia: number;
    etiqueta: string;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
  mesesResumen?: Array<{
    anio: number;
    mes: number;
    nombreMes: string;
    fechaInicio: string;
    fechaFin: string;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
  insumos: ConsumoInsumoDetallePeriodo[];
}

export interface ConsumoMensualDetalleResponse {
  anio: number;
  mes: number;
  nombreMes: string;
  fechaInicio: string;
  fechaFin: string;
  periodos: ConsumoPeriodoDetalle[];
}

export interface ReporteResumenResponse {
  anio: number;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  promedioMensualCantidad: number;
  promedioMensualGeneral: number;
  meses: Array<{
    mes: number;
    nombreMes: string;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
  topRenglones: Array<{
    renglon: number;
    totalCantidad: number;
    totalGeneral: number;
  }>;
}

export interface ReporteAnualMesResumen {
  mes: number;
  nombreMes: string;
  totalRegistros: number;
  totalCantidad: number;
  totalGeneral: number;
}

export interface ReajusteAnualDetalle {
  idReajuste: number;
  fecha: string;
  tipoReajuste: number;
  referenciaDocumento: string;
  observaciones?: string | null;
  usuario?: {
    idUsuario: number;
    nombres: string;
    apellidos: string;
  } | null;
  totalCantidad: number;
  insumos: Array<{
    codigoInsumo: number | null;
    nombreInsumo: string;
    caracteristicas: string;
    cantidad: number;
    renglon?: number | null;
  }>;
}

export interface ReporteAnualResponse {
  tipo: 'compras' | 'despachos' | 'reajustes';
  anios: Array<{
    anio: number;
    totalRegistros: number;
    totalCantidad: number;
    totalGeneral: number;
    meses: ReporteAnualMesResumen[];
  }>;
  detalle?: ReajusteAnualDetalle[];
}
