import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, InventarioResponse } from './inventario.service';

interface Filter {
  codigoInsumo?: number | null;
  nombreInsumo?: string | null;
  lote?: string | null;
  proximosVencer?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-inventario-list',
  template: `
    <div class="p-4 flex flex-col h-full bg-gray-900 text-gray-100">
      <h2 class="text-xl font-bold mb-4 text-gray-100">Inventario</h2>

      <!-- Filters -->
      <div class="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
        <div>
          <label class="text-sm text-gray-300">Código Insumo</label>
          <input [(ngModel)]="filter.codigoInsumo" type="number" class="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 text-gray-100 rounded" />
        </div>
        <div>
          <label class="text-sm text-gray-300">Nombre</label>
          <input [(ngModel)]="filter.nombreInsumo" type="text" class="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 text-gray-100 rounded" />
        </div>
        <div>
          <label class="text-sm text-gray-300">Lote</label>
          <input [(ngModel)]="filter.lote" type="text" class="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 text-gray-100 rounded" />
        </div>
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-300">Próximos a vencer</label>
          <input [(ngModel)]="filter.proximosVencer" type="checkbox" class="mt-1" />
        </div>
      </div>

      <div class="mb-4 flex items-center space-x-2">
        <button (click)="applyFilters()" class="px-3 py-1 bg-indigo-500 text-white rounded">Aplicar</button>
        <button (click)="resetFilters()" class="px-3 py-1 bg-gray-700 text-gray-200 rounded">Limpiar</button>
        <div class="ml-auto text-sm text-gray-300">Registros: {{ total }}</div>
      </div>

      <!-- Content area con max-height y scroll interno -->
      <div [style.maxHeight]="'calc(100vh - 220px)'" class="overflow-y-auto p-2 rounded">
        <div *ngIf="loading" class="p-4">Cargando inventario...</div>
        <div *ngIf="error" class="p-4 text-red-400">{{ error }}</div>
        <div *ngIf="!loading && !error && (itemsGrouped?.length ?? 0) === 0" class="p-4 text-gray-400">No se encontraron registros</div>

        <div *ngIf="!loading && !error && (itemsGrouped?.length ?? 0) > 0">
          <div *ngFor="let prod of (itemsGrouped || [])" class="mb-6 border rounded shadow-sm border-gray-700 overflow-hidden">
            <div class="bg-gray-800 px-4 py-3 font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-0.5">
                <div class="text-gray-100"><span class="font-medium">Renglón:</span> {{ prod.renglon }}</div>
                <div class="text-indigo-300"><span class="font-medium">Código:</span> {{ prod.codigoInsumo }}</div>
                <div class="text-gray-100"><span class="font-medium">Nombre:</span> {{ prod.nombreInsumo }}</div>
                <div class="text-sm text-gray-400"><span class="font-medium">Características:</span> {{ prod.caracteristicas }}</div>
                <div class="text-sm text-gray-400"><span class="font-medium">Presentación:</span> {{ prod.presentacion }}</div>
                <div class="text-sm text-gray-400"><span class="font-medium">Unidad:</span> {{ prod.unidadMedida }}</div>
              </div>
              <div class="mt-2 sm:mt-0 text-sm text-gray-400">Lotes: {{ prod.lotes.length }}</div>
            </div>

            <table class="min-w-full bg-transparent">
              <thead>
                <tr class="text-gray-300">
                  <th class="px-4 py-2 text-center">Lote</th>
                  <th class="px-4 py-2 text-center">Fecha Vencimiento</th>
                  <th class="px-4 py-2 text-center">Carta Compromiso</th>
                  <th class="px-4 py-2 text-center">Meses Devolución</th>
                  <th class="px-4 py-2 text-center">Cantidad</th>
                  <th class="px-4 py-2 text-center">Precio Unitario</th>
                  <th class="px-4 py-2 text-center">Precio Total</th>
                </tr>
              </thead>
              <tbody class="bg-gray-900 text-gray-100">
                <tr *ngFor="let lote of prod.lotes" class="border-b border-gray-800 hover:bg-gray-800">
                  <td class="px-4 py-2 text-center">{{ lote.lote }}</td>
                  <td class="px-4 py-2 text-center">{{ lote.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2 text-center">{{ lote.cartaCompromiso ? 'Sí' : 'No' }}</td>
                  <td class="px-4 py-2 text-center">{{ lote.mesesDevolucion ?? '-' }}</td>
                  <td class="px-4 py-2 text-center">{{ lote.cantidadDisponible }}</td>
                  <td class="px-4 py-2 text-center">{{ lote.precioUnitario | number:'1.2-2' }}</td>
                  <td class="px-4 py-2 text-center">{{ lote.precioTotal | number:'1.2-2' }}</td>
                </tr>

              </tbody>
              <tfoot>
                <tr>
                  <td colspan="7" class="px-4 py-3 bg-gray-800/60">
                    <div class="flex flex-col sm:flex-row sm:justify-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-300">Totales</span>
                      </div>
                      <div class="flex items-center space-x-2 sm:ml-4">
                        <div class="bg-yellow-400 text-gray-900 px-3 py-1 rounded-md font-bold shadow">Cantidad: <span class="ml-2">{{ prod.totalCantidad }}</span></div>
                        <div class="bg-indigo-600 text-white px-3 py-1 rounded-md font-bold shadow">Precio total: <span class="ml-2">{{ prod.totalPrecio | number:'1.2-2' }}</span></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class InventarioListComponent implements OnInit {
  items: InventarioResponse[] = [];
  itemsGrouped: any[] = [];
  loading = false;
  error = '';
  // Sin paginación: cargamos todo y usamos scroll
  total = 0;

  filter: Filter = { proximosVencer: false };

  constructor(private svc: InventarioService) {}

  ngOnInit(): void {
    this.load();
  }

  buildQuery() {
    const q: any = {};
    if (this.filter.codigoInsumo) q.codigoInsumo = this.filter.codigoInsumo;
    if (this.filter.nombreInsumo) q.nombreInsumo = this.filter.nombreInsumo;
    if (this.filter.lote) q.lote = this.filter.lote;
    if (this.filter.proximosVencer) q.proximosVencer = true;
    return q;
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

      // Ordenar lotes por fechaVencimiento ascendente dentro de cada grupo y calcular totales
      const grouped = Array.from(map.values()).map((g: any) => {
        // Parseador que intenta reconocer YYYY-MM-DD, DD/MM/YYYY o formatos ISO;
        // devuelve {d,m,y} o null si no puede.
        const parseDMY = (val: any) => {
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
        g.lotes.sort((a: any, b: any) => {
          const pa = parseDMY(a.fechaVencimiento);
          const pb = parseDMY(b.fechaVencimiento);
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
    this.load();
  }
}
