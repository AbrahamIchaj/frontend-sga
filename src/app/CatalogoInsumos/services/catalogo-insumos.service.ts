import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CatalogoInsumosService {
  private apiUrl = 'http://localhost:3000/api/v1/catalogo-insumos';

  constructor(private http: HttpClient) { }

  // Obtener todos los registros sin filtros - el filtrado se hace en el componente
  getAll(): Observable<any[]> {
    console.log('Haciendo petición al backend:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data => {
        console.log('Respuesta del backend:', data);
        if (!data || !Array.isArray(data)) {
          console.warn('La respuesta no es un array válido:', data);
          return [];
        }
        return data;
      })
    );
  }

}
