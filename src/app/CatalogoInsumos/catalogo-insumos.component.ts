import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoInsumosService } from './services/catalogo-insumos.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'catalogo-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-insumos.component.html',
  styleUrls: ['./catalogo-insumos.component.css']
})
export class CatalogoInsumosComponent implements OnInit {
  items: any[] = [];
  filtered: any[] = [];
  query = '';
  unidad = '';
  presentacion = '';
  unidades: string[] = [];
  presentaciones: string[] = [];

  loading = false;

  constructor(private svc: CatalogoInsumosService) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: data => {
        this.items = data;
        this.filtered = data;
        this.unidades = Array.from(new Set(data.map((d: any) => d.unidadMedida).filter(Boolean)));
        this.presentaciones = Array.from(new Set(data.map((d: any) => d.nombrePresentacion).filter(Boolean)));
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    const opts: any = {};
    if (this.query) opts.q = this.query;
    if (this.unidad) opts.unidad = this.unidad;
    if (this.presentacion) opts.presentacion = this.presentacion;

    this.loading = true;
    this.svc.getAll(opts).subscribe({ next: data => { this.filtered = data; this.loading = false; }, error: () => this.loading = false });
  }

  clearFilters() {
    this.query = '';
    this.unidad = '';
    this.presentacion = '';
    this.filtered = this.items;
  }
}
