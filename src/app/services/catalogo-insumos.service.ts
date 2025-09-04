import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
      takeUntil(this.cancelUpload$)
    );
  }

  async cancelUpload() {
    if (this.currentUploadId) {
      // Primero notificamos al backend que cancele el proceso
      try {
        await this.http.post(`${this.apiUrl}/cancel-upload`, {
          uploadId: this.currentUploadId
        }).toPromise();
      } catch (error) {
        console.error('Error al cancelar en el backend:', error);
      }

      // Luego cancelamos el observable actual
      this.cancelUpload$.next();
      this.cancelUpload$.complete();
      this.cancelUpload$ = new Subject<void>();
      this.currentUploadId = null;
    }
  }
}
