import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '../models/servicio.model';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private apiUrl = 'http://localhost:3000/api/v1/servicios';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Servicio[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // Si la respuesta tiene la estructura { success, message, data }
        if (response && response.data && Array.isArray(response.data)) {
          return response.data as Servicio[];
        }
        
        // Si la respuesta es directamente un array
        if (Array.isArray(response)) {
          return response as Servicio[];
        }
        
        console.warn('Respuesta inesperada del servidor:', response);
        return [];
      }),
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<Servicio> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response && response.data) {
          return response.data as Servicio;
        }
        return response as Servicio;
      }),
      catchError(this.handleError)
    );
  }


  create(servicio: CreateServicioDto): Observable<Servicio> {
    return this.http.post<any>(this.apiUrl, servicio).pipe(
      map(response => {
        if (response && response.data) {
          return response.data as Servicio;
        }
        return response as Servicio;
      }),
      catchError(this.handleError)
    );
  }


  update(id: number, servicio: UpdateServicioDto): Observable<Servicio> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, servicio).pipe(
      map(response => {
        if (response && response.data) {
          return response.data as Servicio;
        }
        
        if (response && response.idServicio) {
          return response as Servicio;
        }
        
        if (response && response.success) {
          const updatedServicio: Servicio = {
            idServicio: id,
            nombre: servicio.nombre || '',
            observaciones: servicio.observaciones
          };
          return updatedServicio;
        }
        
        return response as Servicio;
      }),
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        return;
      }),
      catchError(this.handleError)
    );
  }

  // Manejo centralizado de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Datos inválidos enviados al servidor';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('Error en ServiciosService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
