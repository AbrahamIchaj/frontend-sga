import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CatalogoInsumoResumen } from '../../Reajustes/interfaces/reajustes.interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogoInsumosService {
  private apiUrl = 'http://localhost:3000/api/v1/catalogo-insumos';

  constructor(private http: HttpClient) { }

  // Obtener todos los registros sin filtros - el filtrado se hace en el componente
  getAll(): Observable<CatalogoInsumoResumen[]> {
    console.log('Haciendo petición al backend:', this.apiUrl);
    return this.http.get<any>(this.apiUrl).pipe(
      map(data => {
        console.log('Respuesta del backend:', data);
        const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (!Array.isArray(lista)) {
          console.warn('La respuesta no es un array válido:', data);
          return [];
        }
  return lista.map((item: any) => this.normalizeItem(item));
      }),
      catchError(error => {
        console.error('Error al obtener catálogo completo', error);
        return of([]);
      })
    );
  }

  search(term: string, limit = 25): Observable<CatalogoInsumoResumen[]> {
    const query = term?.trim();
    if (!query || query.length < 1) {
      return of([]);
    }

    let params = new HttpParams().set('query', query);
    if (limit) {
      params = params.set('limit', String(limit));
    }

    return this.http
      .get<any>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(respuesta => {
          const lista = Array.isArray(respuesta)
            ? respuesta
            : Array.isArray(respuesta?.data)
            ? respuesta.data
            : [];
          if (!Array.isArray(lista)) {
            return [];
          }
          return lista.map(item => this.normalizeItem(item));
        }),
        catchError(error => {
          console.error('Error al buscar en el catálogo', error);
          return of([]);
        })
      );
  }

  buscarPorCodigo(codigo: string | number): Observable<CatalogoInsumoResumen[]> {
    const codigoNormalizado = `${codigo ?? ''}`.trim();
    if (!codigoNormalizado) {
      return of([]);
    }
    const codigoNumero = Number(codigoNormalizado);

    if (!Number.isInteger(codigoNumero) || codigoNumero <= 0) {
      return this.search(codigoNormalizado, 10);
    }

    return this.http.get<any>(`${this.apiUrl}/codigo/${codigoNumero}`).pipe(
      map(respuesta => {
        const lista = Array.isArray(respuesta)
          ? respuesta
          : Array.isArray(respuesta?.data)
          ? respuesta.data
          : [];
        return lista.map((item: any) => this.normalizeItem(item));
      }),
      catchError(error => {
        console.error('Error al buscar código exacto, se usará búsqueda general', error);
        return this.search(codigoNormalizado, 10).pipe(
          map(resultados => resultados.filter(item => item.codigoInsumo === codigoNumero))
        );
      })
    );
  }

  private normalizeItem(item: any): CatalogoInsumoResumen {
    const parseNumber = (valor: any): number | undefined => {
      if (valor === null || valor === undefined || valor === '') {
        return undefined;
      }
      const numero = Number(valor);
      return Number.isNaN(numero) ? undefined : numero;
    };

    return {
      idCatalogoInsumos: parseNumber(item?.idCatalogoInsumos ?? item?.id) ?? 0,
      renglon: parseNumber(item?.renglon) ?? 0,
      codigoInsumo: parseNumber(item?.codigoInsumo) ?? 0,
      codigoPresentacion: parseNumber(item?.codigoPresentacion) ?? undefined,
      nombreInsumo: (item?.nombreInsumo ?? '').toString().trim(),
      caracteristicas: (item?.caracteristicas ?? '').toString().trim(),
      nombrePresentacion: (item?.nombrePresentacion ?? item?.presentacion ?? '').toString().trim() || undefined,
      unidadMedida: (item?.unidadMedida ?? item?.cantidadUnidad ?? '').toString().trim() || undefined,
      precioReferencial: parseNumber(item?.precioReferencial ?? item?.precioReferencialCatalogo)
    };
  }

}
