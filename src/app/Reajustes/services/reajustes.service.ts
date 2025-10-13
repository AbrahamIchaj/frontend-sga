import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { buildEndpoint } from '../../shared/config/api.config';
import {
  CatalogoInsumoResumen,
  CreateReajusteDto,
  ReajusteCompleto,
  ReajusteFilters,
  ReajusteResumen,
  ReajustesListResponse
} from '../interfaces/reajustes.interface';

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
export class ReajustesService {
  private readonly baseUrl = buildEndpoint('/reajustes');

  constructor(private http: HttpClient, private authService: AuthService) {}

  listar(filtros: ReajusteFilters = {}): Observable<ReajustesListResponse> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          const valores = value.filter(
            (item) => item !== undefined && item !== null,
          ) as Array<string | number>;
          if (valores.length) {
            params = params.set(key, valores.join(','));
          }
        } else {
          params = params.set(key, String(value));
        }
      }
    });

    const usuario = this.authService.getCurrentUser();
    const idUsuario = usuario?.idUsuario;

    if (idUsuario && !params.has('idUsuario')) {
      params = params.set('idUsuario', String(idUsuario));
    }

    const renglonesFiltro =
      filtros.renglones && filtros.renglones.length
        ? filtros.renglones
        : usuario?.renglonesPermitidos ?? [];

    if (renglonesFiltro.length && !params.has('renglones')) {
      params = params.set('renglones', renglonesFiltro.join(','));
    }

    const anio = filtros.anio ?? new Date().getFullYear();
    params = params.set('anio', String(anio));

    return this.http.get<ApiListResponse<ReajusteResumen[]>>(this.baseUrl, { params }).pipe(
      map(res => {
        const data = (Array.isArray(res?.data) ? res.data! : []) as ReajusteResumen[];
        const meta = {
          total: res?.meta?.total ?? data.length,
          page: res?.meta?.page ?? Number(filtros.page ?? 1),
          limit: res?.meta?.limit ?? Number(filtros.limit ?? (data.length || 10)),
          totalPages:
            res?.meta?.totalPages ??
            (res?.meta?.total && res?.meta?.limit ? Math.ceil(res.meta.total / res.meta.limit) : 1)
        };
        return { data, meta } as ReajustesListResponse;
      })
    );
  }

  obtenerPorId(id: number): Observable<ReajusteCompleto> {
    return this.http.get<ApiResponse<ReajusteCompleto>>(`${this.baseUrl}/${id}`).pipe(
      map(res => {
        if (!res?.data) {
          throw new Error('No se encontró el reajuste solicitado');
        }
        const payload = res.data;
        return {
          ...payload,
          usuarioNombre: payload.usuarioNombre ?? `${payload.Usuarios?.nombres ?? ''} ${payload.Usuarios?.apellidos ?? ''}`.trim()
        };
      })
    );
  }

  crear(dto: CreateReajusteDto): Observable<ReajusteCompleto> {
    const user = this.authService.getCurrentUser();
    const idUsuario = user?.idUsuario ?? 0;
    const body = {
      reajuste: dto,
      idUsuario
    };
    return this.http
      .post<ApiResponse<ReajusteCompleto | { idReajuste: number }>>(this.baseUrl, body)
      .pipe(
        switchMap(res => {
          if (!res?.data) {
            throw new Error(res?.message ?? 'No se pudo crear el reajuste');
          }
          if ((res.data as any).ReajusteDetalle) {
            return of(res.data as ReajusteCompleto);
          }
          if ('idReajuste' in (res.data as any)) {
            const idReajuste = Number((res.data as any).idReajuste);
            return this.obtenerPorId(idReajuste);
          }
          throw new Error('Respuesta inesperada al crear reajuste');
        })
      );
  }

  eliminar(idReajuste: number): Observable<void> {
    const user = this.authService.getCurrentUser();
    const idUsuario = user?.idUsuario ?? 0;

    if (!idUsuario) {
      return throwError(() => new Error('No hay un usuario autenticado para eliminar el reajuste.'));
    }

    const options = {
      body: {
        idUsuario
      }
    };

    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${idReajuste}`, options).pipe(
      map(res => {
        if (res && res.success === false) {
          throw new Error(res.message ?? 'No se pudo eliminar el reajuste');
        }
        return;
      })
    );
  }

  buscarCatalogo(termino: string): Observable<CatalogoInsumoResumen[]> {
    if (!termino || !termino.trim()) {
      return of([]);
    }
    let params = new HttpParams().set('q', termino.trim());

    const usuario = this.authService.getCurrentUser();
    if (usuario?.idUsuario) {
      params = params.set('idUsuario', String(usuario.idUsuario));
    }

    const renglones = usuario?.renglonesPermitidos ?? [];
    if (renglones.length) {
      params = params.set('renglones', renglones.join(','));
    }

    return this.http
      .get<ApiResponse<CatalogoInsumoResumen[]>>(`${this.baseUrl}/catalogo/buscar`, { params })
      .pipe(map(res => (Array.isArray(res?.data) ? res!.data! : [])));
  }
}
