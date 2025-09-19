import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, InventarioResponse } from './inventario.service';
import { QuetzalPipe } from './quetzal.pipe';
import { SemaforoPipe } from './semaforo.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Filter {
  codigoInsumo?: number | null;
  nombreInsumo?: string | null;
  lote?: string | null;
  proximosVencer?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-inventario-list',
  templateUrl: './inventario-list.component.html',
  imports: [CommonModule, FormsModule, QuetzalPipe, SemaforoPipe],
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
  // vista única: tabla

  filter: Filter = { proximosVencer: false };

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

  // helper para evitar problemas de tipo en template (Angular strict)
  slice(lotes: any, start: number, end: number) {
    return (lotes || []).slice(start, end);
  }

  load() {
    this.loading = true;
    this.error = '';
    const q = this.buildQuery();
    this.svc.list(q).subscribe((res: any) => {
      // El servicio devuelve siempre { data, meta }
      const data: InventarioResponse[] = res?.data ?? [];
      this.items = data;
      this.total = res?.meta?.total ?? this.items.length;

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
    });
  }

  applyFilters() {
    this.load();
  }

  resetFilters() {
    this.filter = { proximosVencer: false };
    // Emitir cambio para que el flujo de debounce vuelva a cargar
    this.filterSubject.next({ ...this.filter });
  }
}
