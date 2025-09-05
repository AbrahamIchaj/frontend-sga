import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CatalogoInsumosService {
  private apiUrl = 'http://localhost:3000/catalogo-insumos';

  constructor(private http: HttpClient) { }

  // Obtener todos los registros. Si el backend soporta filtros por query params
  // se los pasamos; en caso contrario devolvemos todo y aplicamos filtros en cliente.
  getAll(options?: { q?: string; unidad?: string; presentacion?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (options?.q) params = params.set('q', options.q);
    if (options?.unidad) params = params.set('unidadMedida', options.unidad);
    if (options?.presentacion) params = params.set('nombrePresentacion', options.presentacion);

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(list => {
        if (!list || !Array.isArray(list)) return [];
        let filtered = list;
        if (options?.q) {
          const q = options.q.toLowerCase();
          filtered = filtered.filter(item =>
            (item.nombreInsumo || '').toLowerCase().includes(q) ||
            (String(item.codigoInsumo) || '').toLowerCase().includes(q) ||
            (item.caracteristicas || '').toLowerCase().includes(q)
          );
        }
        if (options?.unidad) {
          filtered = filtered.filter(i => (i.unidadMedida || '') === options.unidad);
        }
        if (options?.presentacion) {
          filtered = filtered.filter(i => (i.nombrePresentacion || '') === options.presentacion);
        }
        return filtered;
      })
    );
  }

}
