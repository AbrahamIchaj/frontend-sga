import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DashboardMetrics {
  totalInsumos: number;
  totalExistencias: number;
  insumosProximosVencer: number;
  insumosVencidos: number;
  stockBajo: number;
  valorInventario: number;
  totalIngresosCompras: number;
  comprasMesActual: number;
  insumosIngresadosMes: number;
  montoComprasMes: number;
  mesActual: string;
  ultimaActualizacion: string;
}

export interface SerieTemporal {
  labels: string[];
  ingresos: number[];
  despachos: number[];
}

export interface DistribucionInventario {
  labels: string[];
  data: number[];
}

export interface TopProveedores {
  labels: string[];
  data: number[];
}

export interface DespachoResumen {
  idDespacho: number;
  codigo: string;
  fecha: string;
  servicio: string | null;
  usuario: string | null;
  totalCantidad: number;
  totalGeneral: number;
}

export interface DashboardResumen {
  metrics: DashboardMetrics;
  charts: {
    ingresosVsDespachos: SerieTemporal;
    estadoInventario: DistribucionInventario;
    comprasPorProveedor: TopProveedores;
  };
  despachosRecientes: DespachoResumen[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API_URL = 'http://localhost:3000/api/v1/dashboard/resumen';

  constructor(private readonly http: HttpClient) {}

  obtenerResumen(): Observable<DashboardResumen> {
    return this.http.get<{ success: boolean; data: DashboardResumen }>(this.API_URL).pipe(
      map((response) => response.data),
    );
  }
}
