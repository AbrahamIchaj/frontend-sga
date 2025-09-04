import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CatalogoInsumosService {
  private apiUrl = 'http://localhost:3000/catalogo-insumos';
  private currentUploadId: string | null = null;
  private cancelUpload$ = new Subject<void>();

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<HttpEvent<any>> {
    // Generar un ID único para esta carga
    this.currentUploadId = Math.random().toString(36).substring(7);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadId', this.currentUploadId);
    
    const headers = new HttpHeaders().set('X-Upload-ID', this.currentUploadId);
    
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      takeUntil(this.cancelUpload$),
      finalize(() => {
        // Limpiar el uploadId cuando termine (exitoso o no)
        this.currentUploadId = null;
      })
    );
  }

  cancelUpload(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.currentUploadId) {
        resolve({ success: false, message: 'No hay upload activo' });
        return;
      }

      const uploadIdToCancel = this.currentUploadId;

      // Primero notificamos al backend que cancele el proceso
      this.http.post(`${this.apiUrl}/cancel-upload`, {
        uploadId: uploadIdToCancel
      }).subscribe({
        next: (response) => {
          console.log('Backend notificado de cancelación:', response);
          resolve(response);
        },
        error: (error) => {
          console.error('Error al cancelar en el backend:', error);
          // Aunque falle el backend, seguimos con la cancelación local
          resolve({ success: false, message: 'Error al cancelar en backend pero cancelado localmente' });
        }
      });

      // Luego cancelamos el observable actual
      this.cancelUpload$.next();
      this.cancelUpload$.complete();
      this.cancelUpload$ = new Subject<void>();
      this.currentUploadId = null;
    });
  }

  // Método para verificar si hay un upload activo
  isUploading(): boolean {
    return this.currentUploadId !== null;
  }

  // Método para obtener el ID de upload actual
  getCurrentUploadId(): string | null {
    return this.currentUploadId;
  }
}
