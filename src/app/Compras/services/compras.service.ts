import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private readonly apiUrl = 'http://localhost:3000/api/v1/compras';

  constructor(private http: HttpClient) {}


  crear(compra: CreateCompraDto, idUsuario: number): Observable<CompraResponse> {
    const body = { compra, idUsuario };
    return this.http.post<CompraResponse>(this.apiUrl, body);
  }

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
    const body = { 
      motivo,
      idUsuario: 1 // TODO: Obtener del contexto de usuario autenticado
    };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/anular`, body);
  }

  obtenerEstadisticas(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/estadisticas`);
  }

  obtenerDetalleCompleto(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}/detalle-completo`);
  }

  create(compra: any): Observable<CompraResponse> {
    const body = { compra, idUsuario: 1 }; // Por ahora usamos idUsuario hardcoded
    return this.http.post<CompraResponse>(this.apiUrl, body);
  }
}