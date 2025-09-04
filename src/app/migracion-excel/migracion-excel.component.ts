import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoInsumosService } from '../services/catalogo-insumos.service';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-migracion-excel',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [CatalogoInsumosService, HttpClient],
  templateUrl: './migracion-excel.component.html',
  styleUrls: ['./migracion-excel.component.css']
})
export class MigracionExcelComponent {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  message: string = '';
  error: string = '';
  uploadProgress: number = 0;
  currentUploadSubscription: Subscription | null = null;

  constructor(private catalogoService: CatalogoInsumosService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.error = '';
    } else {
      this.error = 'Por favor, seleccione un archivo CSV válido';
      this.selectedFile = null;
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.error = 'Por favor, seleccione un archivo primero';
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.error = '';
    this.uploadProgress = 0;

    this.currentUploadSubscription = this.catalogoService.uploadFile(this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
            this.message = `Subiendo archivo... ${this.uploadProgress}%`;
          }
        } else if (event.type === HttpEventType.DownloadProgress) {
          // Este evento indica que el servidor está procesando el archivo
          this.message = 'Procesando archivo en el servidor...';
        } else if (event.type === HttpEventType.ResponseHeader) {
          // El servidor ha empezado a responder
          this.message = 'Finalizando el proceso...';
        } else if (event.type === HttpEventType.Response) {
          this.message = 'Archivo cargado exitosamente';
          this.isLoading = false;
          this.selectedFile = null;
          this.uploadProgress = 100;
          // Resetear el input file
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      },
      error: (error) => {
        this.error = 'Error al cargar el archivo: ' + (error.message || 'Error desconocido');
        this.isLoading = false;
        this.uploadProgress = 0;
      },
      complete: () => {
        this.currentUploadSubscription = null;
      }
    });
  }

  onCancel(): void {
    if (this.currentUploadSubscription) {
      // Primero cancelamos la petición en el servicio
      this.catalogoService.cancelUpload();
      // Luego nos desuscribimos
      this.currentUploadSubscription.unsubscribe();
      this.currentUploadSubscription = null;
      this.isLoading = false;
      this.uploadProgress = 0;
      this.error = 'Carga cancelada';
      // Limpiar el input file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      this.selectedFile = null;
    }
  }
}
