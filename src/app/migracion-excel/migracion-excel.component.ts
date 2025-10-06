import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoInsumosService } from './services/catalogo-insumos.service';
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
  isCancelling: boolean = false;

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
    this.isCancelling = false;
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
          const response = event.body;
          console.log('📦 Respuesta completa:', response);
          
          if (response?.cancelled) {
            this.error = '❌ Carga cancelada por el usuario';
            this.message = '';
          } else if (response && response.success) {
            this.message = `✅ ${response.message}`;
            if (response.registrosExitosos) {
              this.message += ` (${response.registrosExitosos}/${response.registrosTotales} registros procesados)`;
            }
            if (response.errores > 0) {
              this.message += ` - ${response.errores} errores encontrados`;
            }
          } else {
            this.error = response?.message || 'Error procesando el archivo';
          }
          
          this.isLoading = false;
          this.selectedFile = null;
          this.uploadProgress = 100;
          
          // Resetear el input file
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      },
      error: (error) => {
        if (error.status === 408 || error.message?.includes('cancelado')) {
          this.error = '❌ Carga cancelada por el usuario';
          this.message = '';
        } else {
          this.error = 'Error al cargar el archivo: ' + (error.error?.message || error.message || 'Error desconocido');
        }
        this.isLoading = false;
        this.isCancelling = false;
        this.uploadProgress = 0;
      },
      complete: () => {
        this.currentUploadSubscription = null;
        this.isCancelling = false;
      }
    });
  }

  onCancel(): void {
    if (this.currentUploadSubscription && !this.isCancelling) {
      this.isCancelling = true;
      this.message = 'Cancelando...';
      
      // Cancelar en el servicio (notifica al backend y cancela el observable)
      this.catalogoService.cancelUpload().then((response) => {
        console.log('Resultado de cancelación:', response);
        
        // Cancelar la suscripción local
        if (this.currentUploadSubscription) {
          this.currentUploadSubscription.unsubscribe();
          this.currentUploadSubscription = null;
        }
        
        // Resetear el estado
        this.isLoading = false;
        this.isCancelling = false;
        this.uploadProgress = 0;
        this.error = 'Carga cancelada exitosamente';
        this.message = '';
        
        // Limpiar el input file
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.selectedFile = null;
      }).catch((error) => {
        console.error('Error durante cancelación:', error);
        this.isCancelling = false;
        this.error = 'Error al cancelar la carga';
      });
    }
  }
}
