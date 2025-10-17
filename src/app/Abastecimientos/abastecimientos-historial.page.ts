import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AbastecimientosService, AbastecimientoGuardado, GuardarAbastecimientoInsumoPayload } from './abastecimientos.service';

interface MesOption {
  value: number;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-abastecimientos-historial-page',
  templateUrl: './abastecimientos-historial.page.html',
  styleUrls: ['./abastecimientos-historial.page.css'],
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe, DatePipe, NgClass],
})
export class AbastecimientosHistorialPageComponent implements OnInit {
  private static readonly MESES: MesOption[] = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly registros = signal<AbastecimientoGuardado[]>([]);
  readonly filtroAnio = signal<number | null>(null);
  readonly filtroMes = signal<number | null>(null);

  readonly meses = AbastecimientosHistorialPageComponent.MESES;
  readonly anios = this.construirListaAnios();

  constructor(private readonly svc: AbastecimientosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  onAnioSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.actualizarAnio(value);
  }

  onMesSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.actualizarMes(value);
  }

  private actualizarAnio(value: string): void {
    const numero = Number(value);
    this.filtroAnio.set(Number.isFinite(numero) && numero > 0 ? numero : null);
    this.cargar();
  }

  private actualizarMes(value: string): void {
    const numero = Number(value);
    this.filtroMes.set(Number.isFinite(numero) && numero > 0 ? numero : null);
    this.cargar();
  }

  limpiarFiltros(): void {
    if (!this.hayFiltrosActivos()) {
      return;
    }
    this.filtroAnio.set(null);
    this.filtroMes.set(null);
    this.cargar();
  }

  hayFiltrosActivos(): boolean {
    return Boolean(this.filtroAnio() || this.filtroMes());
  }

  trackByRegistro(_: number, registro: AbastecimientoGuardado): number {
    return registro.idRegistro;
  }

  obtenerEtiquetaPeriodo(registro: AbastecimientoGuardado): string {
    const mes = this.obtenerNombreMes(registro.mes);
    return `${mes} ${registro.anio}`;
  }

  calcularMesesCobertura(insumo: GuardarAbastecimientoInsumoPayload): number {
    const existenciasBodega = Number(insumo.existenciasBodega ?? 0);
    const existenciasCocina = Number(insumo.existenciasCocina ?? 0);
    const promedio = Number(insumo.promedioMensual ?? 0);
    if (!Number.isFinite(promedio) || promedio <= 0) {
      return 0;
    }
    const total = existenciasBodega + existenciasCocina;
    const valor = total / promedio;
    return Math.round(valor * 100) / 100;
  }

  private cargar(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: { anio?: number; mes?: number } = {};
    if (this.filtroAnio()) {
      params.anio = this.filtroAnio()!;
    }
    if (this.filtroMes()) {
      params.mes = this.filtroMes()!;
    }

    this.svc.listarHistorial(params).subscribe({
      next: (data) => {
        this.registros.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const mensaje = err?.error?.message || err?.message || 'No fue posible cargar el historial.';
        this.error.set(mensaje);
      },
    });
  }

  private construirListaAnios(): number[] {
    const actual = new Date().getFullYear();
    const anioMinimo = Math.max(2018, actual - 9);
    const lista: number[] = [];
    for (let anio = actual; anio >= anioMinimo; anio -= 1) {
      lista.push(anio);
    }
    return lista;
  }

  private obtenerNombreMes(mes: number): string {
    return AbastecimientosHistorialPageComponent.MESES.find((m) => m.value === mes)?.label ?? `Mes ${mes}`;
  }
}
