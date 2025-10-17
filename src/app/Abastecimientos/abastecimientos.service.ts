import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildEndpoint } from '../shared/config/api.config';
import { AuthService } from '../shared/services/auth.service';

export interface AbastecimientoPeriodoResponse {
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
    existenciasCocinaRegistrada: number;
    valorInventarioEstimado: number;
    promedioMesesCobertura: number;
  };
  insumos: AbastecimientoItemResponse[];
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

export interface AbastecimientoItemResponse {
  codigoInsumo: number;
  renglon: number;
  nombreInsumo: string;
  caracteristicas?: string | null;
  presentacion?: string | null;
  unidadMedida?: string | null;
  snapshot: {
    existenciasBodega: number;
    existenciasCocina: number;
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
    existenciasCocinaSugerida: number;
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

export interface GuardarAbastecimientoInsumoPayload {
  codigoInsumo: number;
  renglon: number;
  existenciasBodega: number;
  existenciasCocina: number;
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

export interface GuardarAbastecimientosPayload {
  anio: number;
  mes: number;
  fechaConsulta: string;
  resumen: AbastecimientoPeriodoResponse['resumen'];
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
  insumos: GuardarAbastecimientoInsumoPayload[];
}

export interface AbastecimientoGuardado {
  idRegistro: number;
  anio: number;
  mes: number;
  fechaConsulta: string;
  resumen: AbastecimientoPeriodoResponse['resumen'];
  cobertura: GuardarAbastecimientosPayload['cobertura'];
  insumos: GuardarAbastecimientoInsumoPayload[];
  creadoEn: string;
  actualizadoEn?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AbastecimientosService {
  private readonly base = buildEndpoint('/abastecimientos');

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

  obtenerPeriodo(anio: number, mes: number): Observable<AbastecimientoPeriodoResponse> {
    const params = this.buildParams(anio, mes);
    return this.http.get<{ data: AbastecimientoPeriodoResponse }>(this.base, { params }).pipe(
      map((response) => response.data),
    );
  }

  guardar(payload: GuardarAbastecimientosPayload): Observable<any> {
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

  listarHistorial(params?: { anio?: number; mes?: number; fechaDesde?: string; fechaHasta?: string }): Observable<AbastecimientoGuardado[]> {
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

    return this.http
      .get<{ data: AbastecimientoGuardado[] }>(`${this.base}/historial`, {
        params: httpParams,
      })
      .pipe(map((response) => response.data ?? []));
  }
}
