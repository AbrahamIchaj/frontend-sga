import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { buildEndpoint } from '../../shared/config/api.config';
import { AuthService } from '../../shared/services/auth.service';
import {
  ConsumoMensualDetalleResponse,
  ConsumoMensualResponse,
  ReporteAnualResponse,
  ReporteFiltros,
  ReporteResumenResponse,
} from '../interfaces/reportes.interface';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly baseUrl = buildEndpoint('/reportes');

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  private construirParams(filtros: ReporteFiltros = {}): HttpParams {
    let params = new HttpParams();
    const usuario = this.authService.getCurrentUser();

    const idUsuario = filtros.idUsuario ?? usuario?.idUsuario;
    if (idUsuario) {
      params = params.set('idUsuario', String(idUsuario));
    }

    const renglones =
      filtros.renglones && filtros.renglones.length
        ? filtros.renglones
        : usuario?.renglonesPermitidos ?? [];

    if (renglones.length) {
      params = params.set(
        'renglones',
        renglones.filter((item) => Number.isFinite(item)).join(','),
      );
    }

    const anioReferencia =
      filtros.anio ?? filtros.anioInicio ?? filtros.anioFin ?? new Date().getFullYear();
    params = params.set('anio', String(anioReferencia));

    if (filtros.anioInicio) {
      params = params.set('anioInicio', String(filtros.anioInicio));
    }

    if (filtros.anioFin) {
      params = params.set('anioFin', String(filtros.anioFin));
    }

    if (filtros.mes) {
      params = params.set('mes', String(filtros.mes));
    }

    if (filtros.mesesPromedio) {
      params = params.set('mesesPromedio', String(filtros.mesesPromedio));
    }

    if (filtros.idServicio) {
      params = params.set('idServicio', String(filtros.idServicio));
    }

    if (filtros.codigoInsumo) {
      params = params.set('codigoInsumo', String(filtros.codigoInsumo));
    }

    return params;
  }

  obtenerResumen(filtros: ReporteFiltros = {}): Observable<ReporteResumenResponse> {
    const params = this.construirParams(filtros);
    return this.http
      .get<{ success?: boolean; data?: ReporteResumenResponse }>(
        `${this.baseUrl}/resumen`,
        { params },
      )
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se pudo cargar el resumen de reportes');
          }
          return res.data;
        }),
      );
  }

  obtenerConsumosMensuales(
    filtros: ReporteFiltros = {},
  ): Observable<ConsumoMensualResponse> {
    const params = this.construirParams(filtros);
    return this.http
      .get<{ success?: boolean; data?: ConsumoMensualResponse }>(
        `${this.baseUrl}/consumos-mensuales`,
        { params },
      )
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se pudo cargar el detalle de consumos mensuales');
          }
          return res.data;
        }),
      );
  }

  obtenerConsumosMensualesDetalle(
    filtros: ReporteFiltros = {},
  ): Observable<ConsumoMensualDetalleResponse> {
    const params = this.construirParams(filtros);
    return this.http
      .get<{ success?: boolean; data?: ConsumoMensualDetalleResponse }>(
        `${this.baseUrl}/consumos-mensuales/detalle`,
        { params },
      )
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se pudo cargar el detalle de consumos mensuales');
          }
          return res.data;
        }),
      );
  }

  obtenerComprasAnuales(
    filtros: ReporteFiltros = {},
  ): Observable<ReporteAnualResponse> {
    const params = this.construirParams(filtros);
    return this.http
      .get<{ success?: boolean; data?: ReporteAnualResponse }>(
        `${this.baseUrl}/compras-anuales`,
        { params },
      )
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se pudo cargar el reporte de compras anuales');
          }
          return res.data;
        }),
      );
  }

  obtenerDespachosAnuales(
    filtros: ReporteFiltros = {},
  ): Observable<ReporteAnualResponse> {
    const params = this.construirParams(filtros);
    return this.http
      .get<{ success?: boolean; data?: ReporteAnualResponse }>(
        `${this.baseUrl}/despachos-anuales`,
        { params },
      )
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se pudo cargar el reporte de despachos anuales');
          }
          return res.data;
        }),
      );
  }

  obtenerReajustesAnuales(
    filtros: ReporteFiltros = {},
  ): Observable<ReporteAnualResponse> {
    const params = this.construirParams(filtros);
    return this.http
      .get<{ success?: boolean; data?: ReporteAnualResponse }>(
        `${this.baseUrl}/reajustes-anuales`,
        { params },
      )
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se pudo cargar el reporte de reajustes anuales');
          }
          return res.data;
        }),
      );
  }
}
