import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildEndpoint } from '../shared/config/api.config';

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

  constructor(private http: HttpClient) {}

  list(query: any = {}): Observable<Paginated<InventarioResponse>> {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      if (query[k] !== undefined && query[k] !== null) params = params.set(k, String(query[k]));
    });
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

  getById(id: number) {
    return this.http.get<{ data: InventarioResponse }>(`${this.base}/${id}`);
  }

  getExistencias(query: any) {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      if (query[k] !== undefined && query[k] !== null) params = params.set(k, String(query[k]));
    });
    return this.http.get<{ data: any[] }>(`${this.base}/existencias/consultar`, { params });
  }

  getHistorial(query: any) {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      if (query[k] !== undefined && query[k] !== null) params = params.set(k, String(query[k]));
    });
    return this.http.get<{ data: any[], meta?: any }>(`${this.base}/historial/movimientos`, { params });
  }

  getResumen() {
    return this.http.get<{ data: any }>(`${this.base}/resumen/general`);
  }

  getAlertas() {
    return this.http.get<{ data: any }>(`${this.base}/alertas/dashboard`);
  }

  getMovimientosRecientes(limit: number = 10) {
    return this.http.get<{ data: any[] }>(`${this.base}/movimientos/recientes?limit=${limit}`);
  }

  getExistenciasProducto(codigoInsumo: number) {
    return this.http.get<{ data: any }>(`${this.base}/productos/${codigoInsumo}/existencias`);
  }

  getDetallesLote(lote: string) {
    return this.http.get<{ data: any[], total: number }>(`${this.base}/lotes/${encodeURIComponent(lote)}/detalles`);
  }
}
