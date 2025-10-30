import { Pipe, PipeTransform } from '@angular/core';

export type CoberturaSemaforoTipo = 'disponibilidad' | 'abastecimiento';

@Pipe({
  name: 'coberturaSemaforo',
  standalone: true,
})
export class CoberturaSemaforoPipe implements PipeTransform {
  transform(valor: number | null | undefined, tipo: CoberturaSemaforoTipo): string {
    const porcentaje = Number(valor ?? 0);
    const safe = Number.isFinite(porcentaje) ? porcentaje : 0;

    if (tipo === 'disponibilidad') {
      if (safe < 80) return 'semaforo-rojo';
      if (safe < 90) return 'semaforo-amarillo';
      return 'semaforo-verde';
    }

    if (tipo === 'abastecimiento') {
      if (safe < 70) return 'semaforo-rojo';
      if (safe < 80) return 'semaforo-amarillo';
      return 'semaforo-verde';
    }

    return 'semaforo-neutro';
  }
}
