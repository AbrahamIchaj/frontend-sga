import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'coloresMesesAbastecimiento',
  standalone: true,
})
export class ColoresMesesAbastecimientoPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    const meses = Number(valor ?? 0);
    if (!Number.isFinite(meses) || meses <= 0) {
      return 'rango-0';
    }
    if (meses <= 0.5) {
      return 'rango-1';
    }
    if (meses <= 1) {
      return 'rango-2';
    }
    if (meses <= 3) {
      return 'rango-3';
    }
    if (meses <= 6) {
      return 'rango-4';
    }
    return 'rango-5';
  }
}
