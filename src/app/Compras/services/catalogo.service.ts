import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CatalogoInsumo, PresentacionInsumo, CatalogoResponse, ApiResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/catalogo-insumos';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los insumos del catálogo
   */
  obtenerTodos(): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(this.apiUrl);
  }

  /**
   * Buscar insumo por código exacto
   */
  buscarPorCodigo(codigo: number): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.apiUrl}/buscar-por-codigo/${codigo}`);
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