import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildEndpoint } from '../shared/config/api.config';
import { AuthService } from '../shared/services/auth.service';

export interface InventarioResponse {
  idInventario: number;
  renglon: number;
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  codigoPresentacion: number;
  presentacion: string;
  unidadMedida: string;
  lote: string;
  noKardex: number;
  cartaCompromiso?: boolean;
  mesesDevolucion?: number | null;
  observacionesDevolucion?: string | null;
  fechaVencimiento: string | null;
  cantidadDisponible: number;
  precioUnitario: number;
  precioTotal: number;
  ingresoCompras: {
    idIngresoCompras: number;
    numeroFactura: number;
    serieFactura: string;
    fechaIngreso: string;
    proveedor: string;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private base = buildEndpoint('/inventario');

  constructor(private http: HttpClient, private authService: AuthService) {}

  private buildParamsFromQuery(query: Record<string, any> = {}): HttpParams {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        const filtered = value
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item));

        if (filtered.length) {
          params = params.set(key, filtered.join(','));
        }
      } else {
        params = params.set(key, String(value));
      }
    });

    return params;
  }

  private ensureUserScope(params: HttpParams): HttpParams {
    const user = this.authService.getCurrentUser();
    const idUsuario = user?.idUsuario;

    if (idUsuario && !params.has('idUsuario')) {
      params = params.set('idUsuario', String(idUsuario));
    }

    if (!params.has('renglones')) {
      const permitidos = Array.isArray(user?.renglonesPermitidos)
        ? (user?.renglonesPermitidos as Array<number | string>)
        : [];

      const renglones = permitidos
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

      if (renglones.length) {
        params = params.set('renglones', renglones.join(','));
      }
    }

    return params;
  }

  list(query: any = {}): Observable<Paginated<InventarioResponse>> {
    let params = this.buildParamsFromQuery(query);
    params = this.ensureUserScope(params);
    // Normalizar la respuesta para devolver siempre { data, meta }
    return this.http.get<any>(this.base, { params }).pipe(
      map((res: any) => {
        if (!res) return { data: [], meta: { total: 0 } };
        // Si el backend devuelve un array directo
        if (Array.isArray(res)) return { data: res as InventarioResponse[], meta: { total: res.length } };
        // Si viene { data: [...], meta: {...} }
        if (res.data && Array.isArray(res.data)) return { data: res.data as InventarioResponse[], meta: res.meta ?? { total: res.data.length } };
        // Si viene { data: {...} } pero no es arreglo
        if (res.data && !Array.isArray(res.data)) return { data: [], meta: res.meta ?? { total: 0 } };
        // Fallback: intentar usar res.data o convertir a array vacío
        return { data: res.data ?? [], meta: res.meta ?? { total: (res.data?.length ?? 0) } };
      })
    ) as Observable<Paginated<InventarioResponse>>;
  }

  getProximosVencer(query: { dias?: number; meses?: number } = {}): Observable<Paginated<InventarioResponse>> {
    let params = this.buildParamsFromQuery(query);
    params = this.ensureUserScope(params);

    return this.http
      .get<any>(`${this.base}/vencimientos/proximos`, { params })
      .pipe(
        map((res: any) => {
          const data: InventarioResponse[] = Array.isArray(res?.data) ? res.data : [];
          const total = res?.total ?? data.length ?? 0;
          const meta: any = {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            mesesConsultados: res?.mesesConsultados,
            diasConsultados: res?.diasConsultados,
            rangoConsulta: res?.rangoConsulta,
            message: res?.message,
          };

          return { data, meta } as Paginated<InventarioResponse>;
        })
      );
  }

  getById(id: number) {
    return this.http.get<{ data: InventarioResponse }>(`${this.base}/${id}`);
  }

  getExistencias(query: any) {
    let params = this.buildParamsFromQuery(query);
    params = this.ensureUserScope(params);
    return this.http.get<{ data: any[] }>(`${this.base}/existencias/consultar`, { params });
  }

  getHistorial(query: any) {
    let params = this.buildParamsFromQuery(query);
    params = this.ensureUserScope(params);
    return this.http.get<{ data: any[], meta?: any }>(`${this.base}/historial/movimientos`, { params });
  }

  getResumen() {
    const params = this.ensureUserScope(new HttpParams());
    return this.http.get<{ data: any }>(`${this.base}/resumen/general`, { params });
  }

  getAlertas() {
    const params = this.ensureUserScope(new HttpParams());
    return this.http.get<{ data: any }>(`${this.base}/alertas/dashboard`, { params });
  }

  getMovimientosRecientes(limit: number = 10) {
    let params = new HttpParams();
    if (limit !== undefined && limit !== null) {
      params = params.set('limit', String(limit));
    }
    params = this.ensureUserScope(params);
    return this.http.get<{ data: any[] }>(`${this.base}/movimientos/recientes`, { params });
  }

  getExistenciasProducto(codigoInsumo: number) {
    const params = this.ensureUserScope(new HttpParams());
    return this.http.get<{ data: any }>(
      `${this.base}/productos/${codigoInsumo}/existencias`,
      { params },
    );
  }

  getDetallesLote(lote: string) {
    const params = this.ensureUserScope(new HttpParams());
    return this.http.get<{ data: any[], total: number }>(
      `${this.base}/lotes/${encodeURIComponent(lote)}/detalles`,
      { params },
    );
  }
}
