import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildEndpoint } from '../shared/config/api.config';
import { AuthService } from '../shared/services/auth.service';
import { ActualizarEstadoAbastecimientoResponse } from '../Abastecimientos/abastecimientos.service';

export interface AbastecimientoGeneralPeriodoResponse {
  periodo: {
    anio: number;
    mes: number;
    nombreMes: string;
    fechaInicio: string;
    fechaFin: string;
  };
  resumen: {
    totalInsumos: number;
    activos: number;
    inactivos: number;
    existenciasBodegaActual: number;
    valorInventarioEstimado: number;
    promedioMesesCobertura: number;
  };
  insumos: AbastecimientoGeneralItemResponse[];
  consumo: {
    periodos: Array<{
      etiqueta: string;
      mesesConsiderados: number;
      mesesConDatos: number;
      totalCantidad: number;
      totalGeneral: number;
      totalDespachos: number;
      promedioCantidad: number;
      promedioGeneral: number;
      promedioDespachos: number;
    }>;
  };
}

export interface AbastecimientoGeneralItemResponse {
  codigoInsumo: number;
  renglon: number;
  nombreInsumo: string;
  caracteristicas?: string | null;
  presentacion?: string | null;
  unidadMedida?: string | null;
  estadoActivo: boolean;
  snapshot: {
    existenciasBodega: number;
    existenciasTotales: number;
    promedioMensual: number;
    mesesAbastecimiento: number;
    precioUnitario: number | null;
    valorTotal: number | null;
    activo: boolean;
    creadoEn?: string;
    actualizadoEn?: string;
  } | null;
  calculado: {
    existenciasBodega: number;
    existenciasTotales: number;
    promedioMensualSugerido: number;
    mesesAbastecimiento: number;
    precioUnitario: number | null;
    valorInventario: number | null;
  };
  consumo: Record<string, {
    etiqueta: string;
    mesesConsiderados: number;
    mesesConDatos: number;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
    promedioCantidad: number;
    promedioGeneral: number;
    promedioDespachos: number;
  }>;
  lotes: Array<{
    lote?: string | null;
    cantidad: number;
    fechaVencimiento?: string | null;
    cartaCompromiso?: boolean | null;
    mesesDevolucion?: number | null;
  }>;
}

export interface GuardarAbastecimientoGeneralPayload {
  codigoInsumo: number;
  renglon: number;
  existenciasBodega: number;
  promedioMensual: number;
  precioUnitario?: number | null;
  nombreInsumo?: string;
  presentacion?: string;
  unidadMedida?: string | null;
  caracteristicas?: string | null;
  activo: boolean;
  totalUnidades?: number;
  consumoMensual?: number;
  mesesCobertura?: number;
  valorEstimado?: number | null;
}

export interface GuardarAbastecimientosGeneralPayload {
  anio: number;
  mes: number;
  fechaConsulta: string;
  resumen: AbastecimientoGeneralPeriodoResponse['resumen'];
  cobertura: {
    filas: Array<{
      etiqueta: string;
      cantidad: number;
      porcentaje: number;
    }>;
    totalCantidad: number;
    totalPorcentaje: number;
    disponibilidad: number;
    abastecimiento: number;
  };
  insumos: GuardarAbastecimientoGeneralPayload[];
}

export interface AbastecimientoGeneralGuardado {
  idRegistro: number;
  anio: number;
  mes: number;
  fechaConsulta: string;
  resumen: AbastecimientoGeneralPeriodoResponse['resumen'];
  cobertura: GuardarAbastecimientosGeneralPayload['cobertura'];
  insumos: GuardarAbastecimientoGeneralPayload[];
  creadoEn: string;
  actualizadoEn?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AbastecimientosGeneralService {
  private readonly base = buildEndpoint('/abastecimientos-general');

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  private buildParams(anio: number, mes: number): HttpParams {
    let params = new HttpParams()
      .set('anio', String(anio))
      .set('mes', String(mes));

    const usuario = this.authService.getCurrentUser();
    if (usuario?.idUsuario) {
      params = params.set('idUsuario', String(usuario.idUsuario));
    }

    const renglones = Array.isArray(usuario?.renglonesPermitidos)
      ? (usuario!.renglonesPermitidos as Array<number | string>)
      : [];

    if (renglones.length) {
      const lista = renglones
        .map((valor) => Number(valor))
        .filter((valor) => Number.isFinite(valor) && valor > 0);
      if (lista.length) {
        params = params.set('renglones', lista.join(','));
      }
    }

    return params;
  }

  obtenerPeriodo(anio: number, mes: number): Observable<AbastecimientoGeneralPeriodoResponse> {
    const params = this.buildParams(anio, mes);
    return this.http
      .get<{ data: AbastecimientoGeneralPeriodoResponse }>(this.base, { params })
      .pipe(map((response) => response.data));
  }

  guardar(payload: GuardarAbastecimientosGeneralPayload): Observable<any> {
    const usuario = this.authService.getCurrentUser();
    const body: any = {
      ...payload,
      idUsuario: usuario?.idUsuario ?? undefined,
    };

    if (Array.isArray(usuario?.renglonesPermitidos) && usuario!.renglonesPermitidos.length) {
      body.renglones = usuario!.renglonesPermitidos;
    }

    return this.http.post(this.base, body);
  }

  listarHistorial(params?: { anio?: number; mes?: number; fechaDesde?: string; fechaHasta?: string }): Observable<AbastecimientoGeneralGuardado[]> {
    let httpParams = new HttpParams();
    if (params?.anio) {
      httpParams = httpParams.set('anio', String(params.anio));
    }
    if (params?.mes) {
      httpParams = httpParams.set('mes', String(params.mes));
    }
    if (params?.fechaDesde) {
      httpParams = httpParams.set('fechaDesde', params.fechaDesde);
    }
    if (params?.fechaHasta) {
      httpParams = httpParams.set('fechaHasta', params.fechaHasta);
    }

    const usuario = this.authService.getCurrentUser();
    if (usuario?.idUsuario) {
      httpParams = httpParams.set('idUsuario', String(usuario.idUsuario));
    }

    const renglones = Array.isArray(usuario?.renglonesPermitidos)
      ? (usuario!.renglonesPermitidos as Array<number | string>)
      : [];

    if (renglones.length) {
      const lista = renglones
        .map((valor) => Number(valor))
        .filter((valor) => Number.isFinite(valor) && valor > 0);
      if (lista.length) {
        httpParams = httpParams.set('renglones', lista.join(','));
      }
    }

    return this.http
      .get<{ data: AbastecimientoGeneralGuardado[] }>(`${this.base}/historial`, { params: httpParams })
      .pipe(map((response) => response.data ?? []));
  }

  actualizarEstado(payload: {
    anio: number;
    mes: number;
    codigoInsumo: number;
    activo: boolean;
  }): Observable<ActualizarEstadoAbastecimientoResponse> {
    return this.http
      .patch<{ data: ActualizarEstadoAbastecimientoResponse }>(
        buildEndpoint('/abastecimientos/estado'),
        payload,
      )
      .pipe(map((response) => response.data));
  }
}
