import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Modulo, Usuario } from '../shared/services/auth.service';
import { DashboardService, DashboardResumen } from './dashboard.service';
import { Chart, ChartOptions, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'Dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser: Usuario | null = null;
  modulosDisponibles: Modulo[] = [];
  resumen: DashboardResumen | null = null;
  loading = true;
  error: string | null = null;

  @ViewChild('ingresosChart') ingresosChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('estadoChart') estadoChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('proveedoresChart') proveedoresChartRef?:
    ElementRef<HTMLCanvasElement>;

  private ingresosChart?: Chart;
  private estadoChart?: Chart;
  private proveedoresChart?: Chart;
  private viewInitialized = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual en Dashboard:', this.currentUser);
    
    this.modulosDisponibles = this.authService.getModulosDisponibles();
    console.log('Módulos disponibles:', this.modulosDisponibles);
    
    if (this.currentUser) {
      console.log('Permisos del usuario:', this.currentUser.rol?.permisos);
    }

    this.cargarResumen();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (this.resumen) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  navigateToModule(modulo: Modulo) {
    this.router.navigate([modulo.ruta]);
  }

  logout() {
    this.authService.logout();
  }

  getStockDisponibleSano(): number {
    if (!this.resumen) {
      return 0;
    }

    const { totalExistencias, insumosProximosVencer, insumosVencidos } =
      this.resumen.metrics;
    return Math.max(totalExistencias - insumosProximosVencer - insumosVencidos, 0);
  }

  cargarResumen(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.obtenerResumen().subscribe({
      next: (resumen) => {
        this.resumen = resumen;
        this.loading = false;
        if (this.viewInitialized) {
          this.renderCharts();
        }
      },
      error: (err) => {
        console.error('Error al cargar resumen del dashboard', err);
        this.error =
          err?.error?.message || 'No fue posible obtener la información del dashboard.';
        this.loading = false;
      },
    });
  }

  private renderCharts(): void {
    if (!this.resumen) {
      return;
    }

    this.renderIngresosChart();
    this.renderEstadoChart();
    this.renderProveedoresChart();
  }

  private renderIngresosChart(): void {
    if (!this.ingresosChartRef) {
      return;
    }

    const contexto = this.ingresosChartRef.nativeElement.getContext('2d');
    if (!contexto) {
      return;
    }

    this.ingresosChart?.destroy();

    const { labels, ingresos, despachos } =
      this.resumen!.charts.ingresosVsDespachos;

    this.ingresosChart = new Chart(contexto, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Insumos ingresados',
            data: ingresos,
            fill: true,
            tension: 0.35,
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.15)',
            pointBackgroundColor: '#312E81',
            pointRadius: 5,
          },
          {
            label: 'Insumos despachados',
            data: despachos,
            fill: false,
            tension: 0.35,
            borderColor: '#F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            pointBackgroundColor: '#C2410C',
            pointRadius: 5,
          },
        ],
      },
      options: this.getLineChartOptions(),
    });
  }

  private renderEstadoChart(): void {
    if (!this.estadoChartRef) {
      return;
    }

    const contexto = this.estadoChartRef.nativeElement.getContext('2d');
    if (!contexto) {
      return;
    }

    this.estadoChart?.destroy();

    const { labels, data } = this.resumen!.charts.estadoInventario;

    this.estadoChart = new Chart(contexto, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6366F1'],
            borderColor: '#0B1628',
            borderWidth: 2,
            hoverOffset: 10,
          },
        ],
      },
      options: this.getDoughnutOptions(),
    });
  }

  private renderProveedoresChart(): void {
    if (!this.proveedoresChartRef) {
      return;
    }

    const contexto = this.proveedoresChartRef.nativeElement.getContext('2d');
    if (!contexto) {
      return;
    }

    this.proveedoresChart?.destroy();

    const { labels, data } = this.resumen!.charts.comprasPorProveedor;

    this.proveedoresChart = new Chart(contexto, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Monto comprado (Q)',
            data,
            backgroundColor: '#1D4ED8',
            borderRadius: 8,
          },
        ],
      },
      options: this.getBarOptions(),
    });
  }

  private destroyCharts(): void {
    this.ingresosChart?.destroy();
    this.estadoChart?.destroy();
    this.proveedoresChart?.destroy();
  }

  private getLineChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#E5E7EB',
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#0B1628',
          titleFont: { weight: 'bold' },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#A5B4FC',
          },
          grid: {
            color: 'rgba(99, 102, 241, 0.15)',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#A5B4FC',
          },
          grid: {
            color: 'rgba(79, 70, 229, 0.1)',
          },
        },
      },
    };
  }

  private getDoughnutOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#E5E7EB',
          },
        },
      },
    };
  }

  private getBarOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#0B1628',
          titleFont: { weight: 'bold' },
        },
      },
      scales: {
        x: {
          ticks: { color: '#E2E8F0' },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#CBD5F5' },
          grid: { color: 'rgba(14, 116, 144, 0.15)' },
        },
      },
    };
  }
}
