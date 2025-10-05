import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { buildEndpoint } from '../../shared/config/api.config';
import {
  CreateDespachoRequest,
  DespachoCompleto,
  DespachoFilters,
  DespachoResumen,
  DespachosListResponse,
  DisponibilidadProducto,
} from '../interfaces/despachos.interface';

interface ApiListResponse<T> {
  success?: boolean;
  data?: T;
  meta?: any;
  message?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class DespachosService {
  private readonly baseUrl = buildEndpoint('/despachos');

  constructor(private http: HttpClient, private authService: AuthService) {}

  listar(filtros: DespachoFilters = {}): Observable<DespachosListResponse> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<ApiListResponse<DespachoResumen[]>>(this.baseUrl, { params })
      .pipe(
        map((res) => {
          const data = (Array.isArray(res?.data) ? res.data! : []) as DespachoResumen[];
          const meta = {
            total: res?.meta?.total ?? data.length,
            page: Number(res?.meta?.page ?? filtros.page ?? 1),
            limit: Number(res?.meta?.limit ?? filtros.limit ?? (data.length || 10)),
            totalPages:
              res?.meta?.totalPages ??
              (res?.meta?.total && res?.meta?.limit ? Math.ceil(res.meta.total / res.meta.limit) : 1),
          };
          return { data, meta } as DespachosListResponse;
        }),
      );
  }

  obtenerPorId(id: number): Observable<DespachoCompleto> {
    return this.http
      .get<ApiResponse<DespachoCompleto>>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error('No se encontró el despacho solicitado');
          }
          return res.data;
        }),
      );
  }

  crear(payload: CreateDespachoRequest): Observable<DespachoCompleto> {
    const user = this.authService.getCurrentUser();
    const idUsuario = user?.idUsuario ?? 0;

    if (!idUsuario) {
      return throwError(() => new Error('No hay usuario autenticado para registrar el despacho.'));
    }

    const body = {
      despacho: payload,
      idUsuario,
    };

    return this.http
      .post<ApiResponse<DespachoCompleto | { idDespacho: number }>>(this.baseUrl, body)
      .pipe(
        switchMap((res) => {
          if (!res?.data) {
            throw new Error(res?.message ?? 'No se pudo registrar el despacho');
          }

          if ('detalles' in (res.data as DespachoCompleto)) {
            return of(res.data as DespachoCompleto);
          }

          if ('idDespacho' in (res.data as any)) {
            const idDespacho = Number((res.data as any).idDespacho);
            return this.obtenerPorId(idDespacho);
          }

          throw new Error('Respuesta inesperada al crear el despacho');
        }),
      );
  }

  disponibilidad(filtros: {
    codigoInsumo?: number;
    lote?: string;
    codigoPresentacion?: number;
  } = {}): Observable<DisponibilidadProducto[]> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<ApiResponse<DisponibilidadProducto[]>>(`${this.baseUrl}/disponibilidad`, { params })
      .pipe(map((res) => (Array.isArray(res?.data) ? res.data! : [])));
  }
}
