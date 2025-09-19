import { Pipe, PipeTransform } from '@angular/core';

type Semaforo = 'rojo' | 'amarillo' | 'verde';

/**
 * Pipe standalone `semaforo`.
 * Uso: {{ fechaVencimiento | semaforo }} -> 'rojo'|'amarillo'|'verde'
 * También puede aceptar un segundo argumento 'class' o 'hex' para
 * devolver respectivamente las clases CSS ('bg-red-500') o el color hex.
 *
 * Regla: se dividen ventanas de 6 meses relativas al inicio del mes actual:
 * - Ventana 0 (más próxima): rojo
 * - Ventana 1: amarillo
 * - Ventana 2 y superiores: verde
 *
 * Ejemplo: hoy es Septiembre 2025.
 * - Fechas entre 09/2025 y 02/2026 -> rojo (ventana 0)
 * - Fechas entre 03/2026 y 08/2026 -> amarillo (ventana 1)
 * - Fechas >= 09/2026 -> verde (ventana >=2)
 */
@Pipe({
  name: 'semaforo',
  standalone: true
})
export class SemaforoPipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    output: 'label' | 'class' | 'hex' = 'label'
  ): Semaforo | string {
    if (!value) return (output === 'label') ? 'verde' : this.out('verde', output);

    // Normalizar a Date
    const d = this.parseToDate(value);
    if (!d) return (output === 'label') ? 'verde' : this.out('verde', output);

    const now = new Date();
    // Inicio del mes actual (00:00:00)
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Calcular diferencia en meses entre fecha de vencimiento y startOfThisMonth
    const monthsDiff = this.monthsBetween(startOfThisMonth, d);

    // Cada ventana cubre 6 meses
    const ventana = Math.floor(monthsDiff / 6);

    let res: Semaforo = 'verde';
    if (ventana <= 0) res = 'rojo';
    else if (ventana === 1) res = 'amarillo';
    else res = 'verde';

    if (output === 'label') return res;
    return this.out(res, output);
  }

  private out(s: Semaforo, output: 'class' | 'hex' | 'label') {
    const mapClass: Record<Semaforo, string> = {
      rojo: 'bg-red-600 text-white',
      amarillo: 'bg-yellow-500 text-black',
      verde: 'bg-green-600 text-white'
    };
    const mapHex: Record<Semaforo, string> = {
      rojo: '#dc2626',
      amarillo: '#edf50bff',
      verde: '#15e862ff'
    };
    if (output === 'class') return mapClass[s];
    if (output === 'hex') return mapHex[s];
    return s;
  }

  private parseToDate(v: string | Date) {
    if (v instanceof Date) return v;
    const s = String(v).trim();
    // ISO yyyy-mm-dd
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    // dd/MM/yyyy
    const sl = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (sl) return new Date(Number(sl[3]), Number(sl[2]) - 1, Number(sl[1]));
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt;
    return null;
  }

  private monthsBetween(a: Date, b: Date) {
    // número de meses desde a hasta b
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  }
}
