import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { takeUntil, finalize, catchError, map } from 'rxjs/operators';
import { buildEndpoint } from '../../shared/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CatalogoInsumosService {
  private apiUrl = buildEndpoint('/catalogo-insumos');
  private currentUploadId: string | null = null;
  private cancelUpload$ = new Subject<void>();

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<HttpEvent<any>> {
    // Generar un ID único para esta carga
    this.currentUploadId = this.generateUploadId();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadId', this.currentUploadId);
        const headers = new HttpHeaders({
      'X-Upload-ID': this.currentUploadId
      // NO incluir 'Content-Type' - Angular lo maneja automáticamente
    });
  
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      takeUntil(this.cancelUpload$),
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          console.log(`Progreso: ${progress}%`);
        } else if (event.type === HttpEventType.Response) {
          console.log('Respuesta del servidor:', event.body);
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en upload:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.currentUploadId = null;
        return throwError(() => error);
      }),
      finalize(() => {
        console.log(`Upload finalizado para ID: ${this.currentUploadId}`);
        this.currentUploadId = null;
      })
    );
  }

  // Método alternativo para upload básico sin headers personalizados
  uploadFileSimple(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`Upload simple - Archivo: ${file.name}`);
    
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          console.log(`Progreso: ${progress}%`);
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en upload simple:', error);
        return throwError(() => error);
      })
    );
  }

  async cancelUpload(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.currentUploadId) {
        console.warn('No hay upload activo para cancelar');
        resolve({ success: false, message: 'No hay upload activo' });
        return;
      }

      const uploadIdToCancel = this.currentUploadId;
      console.log(`Cancelando upload: ${uploadIdToCancel}`);

      // Primero notificamos al backend que cancele el proceso
      this.http.post(`${this.apiUrl}/cancel-upload`, {
        uploadId: uploadIdToCancel
      }).subscribe({
        next: (response) => {
          console.log('Backend notificado de cancelación:', response);
          this.triggerLocalCancellation();
          resolve(response);
        },
        error: (error) => {
          console.error('Error al cancelar en el backend:', error);
          // Aunque falle el backend, seguimos con la cancelación local
          this.triggerLocalCancellation();
          resolve({ 
            success: false, 
            message: 'Error al cancelar en backend pero cancelado localmente',
            localCancellation: true 
          });
        }
      });
    });
  }

  private triggerLocalCancellation(): void {
    // Cancelar el observable actual
    this.cancelUpload$.next();
    this.cancelUpload$.complete();
    
    // Crear nuevo subject para futuras cancellaciones
    this.cancelUpload$ = new Subject<void>();
    this.currentUploadId = null;

    console.log('Cancelación local completada');
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // Método para verificar si hay un upload activo
  isUploading(): boolean {
    return this.currentUploadId !== null;
  }

  // Método para obtener el ID de upload actual
  getCurrentUploadId(): string | null {
    return this.currentUploadId;
  }

  // Método para debug de la base de datos
  debugDatabase(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debug-db`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en debug de BD:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para verificar la conectividad con el servidor
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error de conexión:', error);
        return throwError(() => error);
      })
    );
  }
}
