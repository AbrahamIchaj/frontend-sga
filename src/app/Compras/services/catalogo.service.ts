import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { CatalogoInsumo, PresentacionInsumo, CatalogoResponse, ApiResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/catalogo-insumos';

  constructor(private http: HttpClient) {}


  obtenerTodos(): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(this.apiUrl);

  }

  /**
   * Buscar insumo por código exacto
   */
  buscarPorCodigo(codigo: number): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.apiUrl}/buscar-por-codigo/${codigo}`);
  }

  private buscarPorCodigoApi(codigo: number): Observable<any> {
    const altUrl = `${this.apiUrl}-api/buscar-por-codigo/${codigo}`;
    return this.http.get<any>(altUrl);
  }

  buscarPorCodigoArray(codigo: string | number): Observable<CatalogoInsumo[]> {
    const codigoNum = typeof codigo === 'string' ? Number(codigo) : codigo;
    const codigoToUse = Number.isNaN(codigoNum) ? 0 : codigoNum;
    // Intentar primero el endpoint con sufijo -api (ej: catalogo-insumos-api/buscar-por-codigo)
    return this.buscarPorCodigoApi(codigoToUse).pipe(
      catchError((err) => {
        console.warn('buscarPorCodigoApi falló, intentando endpoint sin sufijo -api:', err?.status || err);
        // Si falla, intentar el endpoint sin sufijo
        return this.buscarPorCodigo(codigoToUse).pipe(
          catchError((err2) => {
            console.warn('buscarPorCodigo (sin -api) también falló:', err2?.status || err2);
            return of(null as any);
          })
        );
      }),
      map((resp: any) => {
        if (!resp) return [];
        if (Array.isArray(resp)) return resp as CatalogoInsumo[];
        if (Array.isArray(resp.data)) return resp.data as CatalogoInsumo[];
        if (resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data)) return [resp.data as CatalogoInsumo];
        return [];
      }),
      // Si no obtuvo resultados del endpoint principal, intentar el endpoint alternativo usado por findByCode
      switchMap((items: CatalogoInsumo[]) => {
        if (items && items.length > 0) return of(items);
        console.log('No se obtuvieron items del endpoint principal, llamando a findByCode fallback');
        return this.findByCode(String(codigo)).pipe(
          map((single: CatalogoInsumo) => single ? [single] : []),
          catchError((err) => {
            console.warn('findByCode también falló o no encontró resultados:', err?.status || err);
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Buscar insumos por término
   */
  buscarPorTermino(termino: string, limite?: number): Observable<CatalogoResponse> {
    let params = new HttpParams().set('q', termino);
    if (limite) {
      params = params.set('limit', limite.toString());
    }
    return this.http.get<CatalogoResponse>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Obtener un insumo específico por ID
   */
  obtenerPorId(id: number): Observable<ApiResponse<CatalogoInsumo>> {
    return this.http.get<ApiResponse<CatalogoInsumo>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener presentaciones disponibles para un código de insumo
   */
  obtenerPresentaciones(codigoInsumo: number): Observable<ApiResponse<PresentacionInsumo[]>> {
    return this.http.get<ApiResponse<PresentacionInsumo[]>>(`${this.apiUrl}/presentaciones/${codigoInsumo}`);
  }

  /**
   * Buscar insumo por código (alias para compatibilidad)
   */
  findByCode(codigo: string): Observable<CatalogoInsumo> {
    console.log(`Buscando insumo con código: ${codigo}`);
    const url = `http://localhost:3000/api/v1/catalogo-insumos-api/codigo/${codigo}`;
    console.log(`URL completa: ${url}`);
    
    return this.http.get<{success: boolean, data: CatalogoInsumo, message: string}>(url)
      .pipe(
        map((response: any) => {
          console.log('Respuesta del servidor:', response);
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Insumo no encontrado');
        })
      );
  }
}