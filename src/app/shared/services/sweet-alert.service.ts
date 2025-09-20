import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  // Configuración base con tema oscuro que coincide con el diseño
  private getBaseConfig() {
    return {
      customClass: {
        popup: 'bg-[#1e293b] text-gray-100',
        title: 'text-gray-100',
        htmlContainer: 'text-gray-300',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors',
        cancelButton: 'bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors',
        denyButton: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors'
      },
      background: '#1e293b',
      color: '#f1f5f9'
    };
  }

  // Alerta de éxito
  success(title: string, text?: string, timer: number = 3000) {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'success',
      title,
      text,
      timer,
      showConfirmButton: false,
      iconColor: '#10b981'
    });
  }

  // Alerta de error
  error(title: string, text?: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Entendido',
      iconColor: '#ef4444'
    });
  }

  // Alerta de advertencia
  warning(title: string, text?: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Entendido',
      iconColor: '#f59e0b'
    });
  }

  // Alerta de información
  info(title: string, content?: string) {
    // Detectar si el contenido es HTML (contiene tags)
    const isHtml = content && /<[a-z][\s\S]*>/i.test(content);
    
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'info',
      title,
      [isHtml ? 'html' : 'text']: content,
      confirmButtonText: 'Entendido',
      iconColor: '#3b82f6',
      width: isHtml ? '600px' : undefined
    });
  }

  // Confirmación simple
  async confirm(title: string, text?: string, confirmText: string = 'Sí, confirmar'): Promise<boolean> {
    const result = await Swal.fire({
      ...this.getBaseConfig(),
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      iconColor: '#8b5cf6'
    });
    return result.isConfirmed;
  }

  // Confirmación de eliminación
  async confirmDelete(itemName: string = 'este elemento'): Promise<boolean> {
    const result = await Swal.fire({
      ...this.getBaseConfig(),
      icon: 'warning',
      title: '¿Estás seguro?',
      text: `Esta acción eliminará ${itemName} permanentemente`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      iconColor: '#ef4444',
      customClass: {
        ...this.getBaseConfig().customClass,
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors'
      }
    });
    return result.isConfirmed;
  }

  // Alerta de carga/loading
  loading(title: string = 'Procesando...', text?: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Cerrar alerta de carga
  closeLoading() {
    Swal.close();
  }

  // Toast notification (notificación pequeña)
  toast(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    const iconColors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#1e293b',
      color: '#f1f5f9',
      iconColor: iconColors[type],
      customClass: {
        popup: 'bg-[#1e293b] text-gray-100 shadow-lg border border-[#334155]'
      }
    });
  }

  // Entrada de texto
  async input(title: string, placeholder: string = '', inputType: 'text' | 'email' | 'password' | 'textarea' = 'text'): Promise<string | null> {
    const result = await Swal.fire({
      ...this.getBaseConfig(),
      title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputAttributes: {
        class: 'bg-[#334155] text-gray-100 border border-[#475569] rounded px-3 py-2 w-full'
      }
    });
    
    return result.isConfirmed ? result.value : null;
  }

  // Selección múltiple
  async select(title: string, options: { value: string, text: string }[]): Promise<string | null> {
    const optionsHtml = options.map(option => 
      `<option value="${option.value}">${option.text}</option>`
    ).join('');

    const result = await Swal.fire({
      ...this.getBaseConfig(),
      title,
      html: `<select class="bg-[#334155] text-gray-100 border border-[#475569] rounded px-3 py-2 w-full">${optionsHtml}</select>`,
      showCancelButton: true,
      confirmButtonText: 'Seleccionar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const select = Swal.getPopup()?.querySelector('select') as HTMLSelectElement;
        return select?.value;
      }
    });

    return result.isConfirmed ? result.value : null;
  }
}