import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { buildEndpoint } from '../../shared/config/api.config';
import { 
  Compra, 
  CreateCompraDto, 
  CompraResponse, 
  ComprasListResponse, 
  FiltrosCompra,
  ApiResponse
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  private readonly apiUrl = buildEndpoint('/compras');

  constructor(private http: HttpClient, private authService: AuthService) {}


  obtenerTodas(filtros?: FiltrosCompra): Observable<ComprasListResponse> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
      if (filtros.proveedor) params = params.set('proveedor', filtros.proveedor);
      if (filtros.programa) params = params.set('programa', filtros.programa.toString());
      if (filtros.numeroFactura) params = params.set('numeroFactura', filtros.numeroFactura.toString());
    }

    return this.http.get<ComprasListResponse>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<CompraResponse> {
    return this.http.get<CompraResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, datos: Partial<Compra>): Observable<CompraResponse> {
    return this.http.put<CompraResponse>(`${this.apiUrl}/${id}`, datos);
  }

  anular(id: number, motivo: string): Observable<ApiResponse<any>> {
    const user = this.authService.getCurrentUser();
    const idUsuario = user?.idUsuario || 0;
    const body = { motivo, idUsuario };
    // El backend define @Delete(':id/anular'), por eso usamos delete con body en las opciones
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}/anular`, { body });
  }

  obtenerEstadisticas(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/estadisticas`);
  }

  obtenerDetalleCompleto(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}/detalle-completo`);
  }

  crear(compra: CreateCompraDto): Observable<CompraResponse> {
    const user = this.authService.getCurrentUser();
    const idUsuario = user?.idUsuario || 0;
    const compraCopy: any = JSON.parse(JSON.stringify(compra, (_key, value) => {
      if (typeof value === 'bigint') return value.toString();
      return value;
    }));

    if ((compra as any).numeroFactura && typeof (compra as any).numeroFactura === 'bigint') {
      compraCopy.numeroFactura = (compra as any).numeroFactura.toString();
    }

    const body = { compra: compraCopy, idUsuario };
    return this.http.post<CompraResponse>(this.apiUrl, body);
  }

  create(compra: CreateCompraDto): Observable<CompraResponse> {
    return this.crear(compra);
  }
}