import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {
  constructor(private readonly themeService: ThemeService) {}

  private getThemeConfig() {
    const theme = this.themeService?.currentTheme ?? 'dark';
    const isDark = theme === 'dark';

    const primaryButtonClass = 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors';
    const secondaryButtonClass = isDark
      ? 'bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors';
    const dangerButtonClass = 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors';

    const base = {
      customClass: {
        popup: isDark ? 'bg-[#1e293b] text-gray-100' : 'bg-white text-gray-800',
        title: isDark ? 'text-gray-100' : 'text-gray-900',
        htmlContainer: isDark ? 'text-gray-300' : 'text-gray-600',
        confirmButton: primaryButtonClass,
        cancelButton: secondaryButtonClass,
        denyButton: dangerButtonClass
      },
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#1f2937'
    };

    const fieldClass = isDark
      ? 'bg-[#334155] text-gray-100 border border-[#475569] rounded px-3 py-2 w-full'
      : 'bg-white text-gray-800 border border-gray-300 rounded px-3 py-2 w-full';

    return { isDark, base, fieldClass } as const;
  }

  // Alerta de éxito
  success(title: string, text?: string, timer: number = 3000) {
    const { base } = this.getThemeConfig();
    return Swal.fire({
      ...base,
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
    const { base } = this.getThemeConfig();
    return Swal.fire({
      ...base,
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Entendido',
      iconColor: '#ef4444'
    });
  }

  // Alerta de advertencia
  warning(title: string, text?: string) {
    const { base } = this.getThemeConfig();
    return Swal.fire({
      ...base,
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

    const { base } = this.getThemeConfig();

    return Swal.fire({
      ...base,
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
    const { base } = this.getThemeConfig();
    const result = await Swal.fire({
      ...base,
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
    const { base } = this.getThemeConfig();
    const result = await Swal.fire({
      ...base,
      icon: 'warning',
      title: '¿Estás seguro?',
      text: `Esta acción eliminará ${itemName} permanentemente`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      iconColor: '#ef4444',
      customClass: {
        ...base.customClass,
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors'
      }
    });
    return result.isConfirmed;
  }

  // Alerta de carga/loading
  loading(title: string = 'Procesando...', text?: string) {
    const { base } = this.getThemeConfig();
    return Swal.fire({
      ...base,
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

    const { isDark } = this.getThemeConfig();

    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: isDark ? '#1e293b' : '#f8fafc',
      color: isDark ? '#f1f5f9' : '#1f2937',
      iconColor: iconColors[type],
      customClass: {
        popup: isDark
          ? 'bg-[#1e293b] text-gray-100 shadow-lg border border-[#334155]'
          : 'bg-white text-gray-800 shadow-lg border border-[#e2e8f0]'
      }
    });
  }

  // Entrada de texto
  async input(title: string, placeholder: string = '', inputType: 'text' | 'email' | 'password' | 'textarea' = 'text'): Promise<string | null> {
    const { base, fieldClass } = this.getThemeConfig();
    const result = await Swal.fire({
      ...base,
      title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputAttributes: {
        class: fieldClass
      }
    });
    
    return result.isConfirmed ? result.value : null;
  }

  // Selección múltiple
  async select(title: string, options: { value: string, text: string }[]): Promise<string | null> {
    const optionsHtml = options.map(option => 
      `<option value="${option.value}">${option.text}</option>`
    ).join('');

    const { base, fieldClass } = this.getThemeConfig();
    const result = await Swal.fire({
      ...base,
      title,
      html: `<select class="${fieldClass}">${optionsHtml}</select>`,
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