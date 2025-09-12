import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'quetzales',
  standalone: true
})
export class QuetzalesPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showCurrency: boolean = true): string {
    if (value === null || value === undefined || value === '') {
      return showCurrency ? 'Q 0.00' : '0.00';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return showCurrency ? 'Q 0.00' : '0.00';
    }

    const formatted = numericValue.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return showCurrency ? `Q ${formatted}` : formatted;
  }
}