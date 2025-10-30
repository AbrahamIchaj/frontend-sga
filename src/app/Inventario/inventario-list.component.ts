import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, InventarioResponse } from './inventario.service';
import { QuetzalesPipe } from '../shared/pipes/quetzales.pipe';
import { SemaforoPipe } from './semaforo.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Filter {
  codigoInsumo?: number | null;
  nombreInsumo?: string | null;
  lote?: string | null;
  proximosVencer?: boolean;
  proximosVencerExtendido?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-inventario-list',
  templateUrl: './inventario-list.component.html',
  imports: [CommonModule, FormsModule, QuetzalesPipe, SemaforoPipe],
  providers: [DatePipe]
})
export class InventarioListComponent implements OnInit, OnDestroy {
  private filterSubject = new Subject<Filter>();
  private filterSub?: Subscription;

  items: InventarioResponse[] = [];
  itemsGrouped: any[] = [];
  loading = false;
  error = '';
  total = 0;
  metaInfo: any = null;
  visibleRange: { desde: string; hasta: string } | null = null;
  // vista única: tabla

  filter: Filter = { proximosVencer: false, proximosVencerExtendido: false };

  constructor(private svc: InventarioService) {}

  ngOnInit(): void {
    // Suscribirse a cambios en los filtros con debounce
    this.filterSub = this.filterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged((a: Filter, b: Filter) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(() => this.load());

    // carga inicial
    this.load();
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  buildQuery() {
    const q: any = {};
    if (this.filter.codigoInsumo) q.codigoInsumo = this.filter.codigoInsumo;
    if (this.filter.nombreInsumo) q.nombreInsumo = this.filter.nombreInsumo;
    if (this.filter.lote) q.lote = this.filter.lote;
    if (this.filter.proximosVencer) q.proximosVencer = true;
    return q;
  }

  // Empleado por ngModelChange para buscar automáticamente
  onFilterChange() {
    this.filterSubject.next({ ...this.filter });
  }

  // getters para counts similares a la UI de Servicios
  get totalRecords() {
    return this.total ?? 0;
  }

  get filteredRecords() {
    return this.items?.length ?? 0;
  }

  get showingGroups() {
    return this.itemsGrouped?.length ?? 0;
  }

  get lastUpdatedDate() {
    if (!this.itemsGrouped || this.itemsGrouped.length === 0) {
      return null;
    }

    const firstGroup = this.itemsGrouped[0];
    const firstLote = firstGroup?.lotes?.[0];
    return firstLote?.fechaVencimiento ?? null;
  }

  // helper para evitar problemas de tipo en template (Angular strict)
  slice(lotes: any, start: number, end: number) {
    return (lotes || []).slice(start, end);
  }

  load() {
    this.loading = true;
    this.error = '';
    this.metaInfo = null;
    this.visibleRange = null;
    const q = this.buildQuery();
    const request$ = this.filter.proximosVencerExtendido
      ? this.svc.getProximosVencer({ meses: 12 })
      : this.filter.proximosVencer
        ? this.svc.getProximosVencer()
        : this.svc.list(q);

    request$.subscribe((res: any) => {
      // El servicio devuelve siempre { data, meta }
      const data: InventarioResponse[] = res?.data ?? [];
      const rangeOptions = this.buildRangeOptions(res?.meta);
      const processed = this.applyLocalFilters(data, rangeOptions);

      this.items = processed;
      this.total = processed.length;
      this.metaInfo =
        this.filter.proximosVencer || this.filter.proximosVencerExtendido
          ? res?.meta ?? null
          : null;
      this.visibleRange = this.computeVisibleRange(res?.meta);

      // Agrupar por codigoInsumo::codigoPresentacion
      const map = new Map<string, any>();
      for (const it of this.items) {
        const key = `${it.codigoInsumo}::${it.codigoPresentacion}`;
        if (!map.has(key)) {
          map.set(key, {
            renglon: it.renglon,
            codigoInsumo: it.codigoInsumo,
            nombreInsumo: it.nombreInsumo,
            caracteristicas: it.caracteristicas,
            presentacion: it.presentacion,
            unidadMedida: it.unidadMedida,
            lotes: [] as any[]
          });
        }
        const grupo = map.get(key)!;
        grupo.lotes.push({
          idInventario: it.idInventario,
          lote: it.lote,
          noKardex: it.noKardex,
          fechaVencimiento: it.fechaVencimiento,
          cartaCompromiso: it.cartaCompromiso,
          mesesDevolucion: it.mesesDevolucion,
          observacionesDevolucion: it.observacionesDevolucion,
          cantidadDisponible: it.cantidadDisponible,
          precioUnitario: it.precioUnitario,
          precioTotal: it.precioTotal
        });
      }

      // Parseador para fechas
      const parseDateToParts = (val: any) => {
        if (!val) return null;
        const s = String(val).trim();
        const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return { d: Number(iso[3]), m: Number(iso[2]), y: Number(iso[1]) };
        const sl = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (sl) return { d: Number(sl[1]), m: Number(sl[2]), y: Number(sl[3]) };
        const dt = new Date(s);
        if (!isNaN(dt.getTime())) return { d: dt.getDate(), m: dt.getMonth() + 1, y: dt.getFullYear() };
        return null;
      };

      // Ordenar cronológicamente: año -> mes -> día. Los valores sin fecha van al final.
      const grouped = Array.from(map.values()).map((g: any) => {
        g.lotes.sort((a: any, b: any) => {
          const pa = parseDateToParts(a.fechaVencimiento);
          const pb = parseDateToParts(b.fechaVencimiento);
          if (!pa && !pb) return 0;
          if (!pa) return 1;
          if (!pb) return -1;
          if (pa.y !== pb.y) return pa.y - pb.y;
          if (pa.m !== pb.m) return pa.m - pb.m;
          return pa.d - pb.d;
        });

        // Calcular totales por insumo
        g.totalCantidad = g.lotes.reduce((s: number, l: any) => s + (Number(l.cantidadDisponible) || 0), 0);
        g.totalPrecio = g.lotes.reduce((s: number, l: any) => s + (Number(l.precioTotal) || 0), 0);
        return g;
      });

      this.itemsGrouped = grouped;
      this.loading = false;
    }, (err: any) => {
      this.loading = false;
      this.error = err?.message || 'Error al cargar inventario';
      this.metaInfo = null;
    });
  }

  private applyLocalFilters(
    data: InventarioResponse[],
    options?: { minDate?: Date; maxDate?: Date }
  ) {
    return data.filter((item) => {
      const matchesCodigo =
        !this.filter.codigoInsumo || item.codigoInsumo === this.filter.codigoInsumo;

      const nombre = item.nombreInsumo?.toLowerCase() ?? '';
      const nombreFiltro = this.filter.nombreInsumo
        ? this.filter.nombreInsumo.toLowerCase().trim()
        : '';
      const matchesNombre = !nombreFiltro || nombre.includes(nombreFiltro);

      const lote = item.lote?.toLowerCase() ?? '';
      const loteFiltro = this.filter.lote ? this.filter.lote.toLowerCase().trim() : '';
      const matchesLote = !loteFiltro || lote.includes(loteFiltro);

      let matchesFecha = true;
      if (options?.minDate || options?.maxDate) {
        const fechaVal = item.fechaVencimiento ? new Date(item.fechaVencimiento) : null;
        if (!fechaVal || Number.isNaN(fechaVal.getTime())) {
          matchesFecha = false;
        } else {
          if (options.minDate && fechaVal < options.minDate) matchesFecha = false;
          if (options.maxDate && fechaVal > options.maxDate) matchesFecha = false;
        }
      }

      return matchesCodigo && matchesNombre && matchesLote && matchesFecha;
    });
  }

  private buildRangeOptions(meta: any): { minDate?: Date; maxDate?: Date } | undefined {
    if (!this.filter.proximosVencer && !this.filter.proximosVencerExtendido) {
      return undefined;
    }

    let minDate: Date | undefined;
    let maxDate: Date | undefined;

    if (this.filter.proximosVencerExtendido) {
      minDate = this.getStartOfMonthOffset(6);

      const hasta = meta?.rangoConsulta?.hasta;
      if (hasta) {
        const parsedHasta = new Date(hasta);
        if (!Number.isNaN(parsedHasta.getTime())) {
          maxDate = parsedHasta;
        }
      }

      if (!maxDate) {
        maxDate = this.getEndOfMonthOffset(12);
      }
    } else if (this.filter.proximosVencer) {
      const desde = meta?.rangoConsulta?.desde;
      const hasta = meta?.rangoConsulta?.hasta;

      if (desde) {
        const parsedDesde = new Date(desde);
        if (!Number.isNaN(parsedDesde.getTime())) {
          minDate = parsedDesde;
        }
      }

      if (hasta) {
        const parsedHasta = new Date(hasta);
        if (!Number.isNaN(parsedHasta.getTime())) {
          maxDate = parsedHasta;
        }
      }
    }

    if (!minDate && !maxDate) {
      return undefined;
    }

    return { minDate, maxDate };
  }

  private computeVisibleRange(meta: any): { desde: string; hasta: string } | null {
    if (!this.filter.proximosVencer && !this.filter.proximosVencerExtendido) {
      return null;
    }

    const rango = meta?.rangoConsulta;

    if (this.filter.proximosVencerExtendido) {
      const inicio = this.getStartOfMonthOffset(6);
      let fin: Date | undefined;

      if (rango?.hasta) {
        const parsedHasta = new Date(rango.hasta);
        if (!Number.isNaN(parsedHasta.getTime())) {
          fin = parsedHasta;
        }
      }

      if (!fin) {
        fin = this.getEndOfMonthOffset(12);
      }

      return {
        desde: inicio.toISOString(),
        hasta: fin.toISOString(),
      };
    }

    if (rango?.desde && rango?.hasta) {
      return rango;
    }

    if (rango?.hasta) {
      const inicio = this.getStartOfMonthOffset(0);
      const parsedHasta = new Date(rango.hasta);
      if (!Number.isNaN(parsedHasta.getTime())) {
        return {
          desde: inicio.toISOString(),
          hasta: parsedHasta.toISOString(),
        };
      }
    }

    return null;
  }

  private getStartOfMonthOffset(offset: number): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() + offset);
    return date;
  }

  private getEndOfMonthOffset(offset: number): Date {
    const date = this.getStartOfMonthOffset(offset + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  applyFilters() {
    this.load();
  }

  toggleProximosVencer() {
    this.filter.proximosVencer = !this.filter.proximosVencer;
    if (this.filter.proximosVencer) {
      this.filter.proximosVencerExtendido = false;
    }
    this.filterSubject.next({ ...this.filter });
  }

  toggleProximosVencerExtendido() {
    this.filter.proximosVencerExtendido = !this.filter.proximosVencerExtendido;
    if (this.filter.proximosVencerExtendido) {
      this.filter.proximosVencer = false;
    }
    this.filterSubject.next({ ...this.filter });
  }

  resetFilters() {
    this.filter = { proximosVencer: false, proximosVencerExtendido: false };
    // Emitir cambio para que el flujo de debounce vuelva a cargar
    this.filterSubject.next({ ...this.filter });
  }
}
