import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'quetzal',
  standalone: true
})
export class QuetzalPipe implements PipeTransform {
  transform(value: number | string | null | undefined, digits: string = '1.2-2'): string {
    if (value === null || value === undefined || value === '') return '';
    const n = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
    if (isNaN(n)) return '';
    // Usar Intl.NumberFormat para formateo con separadores de miles y decimales
    try {
      const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `Q ${nf.format(n)}`;
    } catch (e) {
      return `Q ${n.toFixed(2)}`;
    }
  }
}
