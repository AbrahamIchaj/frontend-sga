import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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
        return this.extractListFromResponse(data);
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
        map(respuesta => this.extractListFromResponse(respuesta)),
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
    const esEnteroPositivo = Number.isInteger(codigoNumero) && codigoNumero > 0;

    const endpoints: string[] = [];
    if (esEnteroPositivo) {
      endpoints.push(`${this.apiUrl}-api/buscar-por-codigo/${codigoNumero}`);
      endpoints.push(`${this.apiUrl}/buscar-por-codigo/${codigoNumero}`);
    }
    endpoints.push(`${this.apiUrl}-api/codigo/${codigoNormalizado}`);
    endpoints.push(`${this.apiUrl}/codigo/${codigoNormalizado}`);

    return this.tryEndpoints(endpoints).pipe(
      switchMap(lista => {
        const filtrados = this.filterByCodigo(lista, codigoNormalizado, esEnteroPositivo ? codigoNumero : null);
        if (filtrados.length) {
          return of(filtrados);
        }
        return this.search(codigoNormalizado, 25).pipe(
          map(resultados => this.filterByCodigo(resultados, codigoNormalizado, esEnteroPositivo ? codigoNumero : null))
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

  private extractListFromResponse(respuesta: any): CatalogoInsumoResumen[] {
    const lista = Array.isArray(respuesta)
      ? respuesta
      : Array.isArray(respuesta?.data)
      ? respuesta.data
      : respuesta?.data && typeof respuesta.data === 'object'
      ? [respuesta.data]
      : [];

    if (!Array.isArray(lista)) {
      return [];
    }

    return lista.map(item => this.normalizeItem(item));
  }

  private tryEndpoints(endpoints: string[]): Observable<CatalogoInsumoResumen[]> {
    if (!endpoints.length) {
      return of([]);
    }

    const [actual, ...resto] = endpoints;
    return this.fetchEndpoint(actual).pipe(
      switchMap(resultado => {
        const lista = Array.isArray(resultado) ? resultado : [];
        if (lista.length) {
          return of(lista);
        }
        if (!resto.length) {
          return of(lista);
        }
        return this.tryEndpoints(resto);
      })
    );
  }

  private fetchEndpoint(url: string): Observable<CatalogoInsumoResumen[] | null> {
    return this.http.get<any>(url).pipe(
      map(res => this.extractListFromResponse(res)),
      catchError(error => {
        console.warn('Error al consultar endpoint de catálogo', url, error?.status ?? error);
        return of(null);
      })
    );
  }

  private filterByCodigo(
    items: CatalogoInsumoResumen[] | null,
    codigoOriginal: string,
    codigoNumerico: number | null
  ): CatalogoInsumoResumen[] {
    if (!items || !items.length) {
      return [];
    }

    const codigoTrim = codigoOriginal.trim();
    const codigoNumericoStr = codigoNumerico !== null ? String(codigoNumerico) : null;

    const coincidencias = items.filter(item => {
      const codigoItem = item?.codigoInsumo !== undefined && item?.codigoInsumo !== null
        ? String(item.codigoInsumo).trim()
        : '';
      if (!codigoItem) {
        return false;
      }
      if (codigoNumericoStr !== null) {
        return codigoItem === codigoNumericoStr || codigoItem === codigoTrim;
      }
      return codigoItem === codigoTrim;
    });

    return coincidencias.length ? coincidencias : items;
  }

}
