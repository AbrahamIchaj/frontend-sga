import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ComprasService } from '../../services/compras.service';
import { CatalogoService } from '../../services/catalogo.service';
import { CatalogoInsumo } from '../../interfaces/compras.interface';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';
import { AuthService } from '../../../shared/services/auth.service';
import { Subscription } from 'rxjs';
import { PROGRAMAS_DISPONIBLES, ProgramaOption } from '../../constants/programas.const';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

interface LoteDetalle {
  lote: string;
  fechaVencimiento: Date;
  cantidad: number;
}

@Component({
  selector: 'app-nueva-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuetzalesPipe],
  templateUrl: './nueva-compra.component.html',
  styleUrls: ['./nueva-compra.component.css']
})
export class NuevaCompraComponent implements OnInit {
  // Wizard step: 1 = Información General, 2 = Búsqueda & Detalle
  currentStep = 1;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private comprasService = inject(ComprasService);
  private catalogoService = inject(CatalogoService);
  private authService = inject(AuthService);
  private sweetAlert = inject(SweetAlertService);
  private userSub?: Subscription;

  compraForm!: FormGroup;
  renglonesPermitidos: number[] = [];
  codigoBusqueda = '';
  insumoEncontrado: CatalogoInsumo | null = null;
  // cuando hay varios insumos con el mismo código
  presentacionesEncontradas: CatalogoInsumo[] = [];
  showSelectionModal = false;
  selectionError = '';
  showInsumoModal = false;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  editingIndex: number | null = null;
  detalleForm!: FormGroup | null;
  errorBusqueda = '';
  modalError = '';
  isSubmitting = false;
  programasDisponibles: ProgramaOption[] = PROGRAMAS_DISPONIBLES;
  showProgramModal = false;
  programSelectionTemp: number[] = [];

  ngOnInit() {
    this.initializeForm();
    this.actualizarRenglonesPermitidos(this.authService.getCurrentUser()?.renglonesPermitidos);
    this.userSub = this.authService.currentUser$.subscribe(usuario => {
      this.actualizarRenglonesPermitidos(usuario?.renglonesPermitidos);
    });
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.canProceedToSearch()) {
        return;
      }
    }
    this.currentStep = Math.min(2, this.currentStep + 1);
    // Llevar la vista al inicio del formulario
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  prevStep() {
    this.currentStep = Math.max(1, this.currentStep - 1);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  get programasControl(): FormControl {
    return this.compraForm.get('programas') as FormControl;
  }

  get selectedProgramas(): number[] {
    return (this.programasControl?.value as number[]) || [];
  }

  get selectedProgramLabels(): ProgramaOption[] {
    const seleccionados = new Set(this.selectedProgramas);
    return this.programasDisponibles.filter((p) => seleccionados.has(p.value));
  }

  openProgramModal() {
    this.programSelectionTemp = [...this.selectedProgramas];
    this.showProgramModal = true;
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
  }

  closeProgramModal() {
    this.showProgramModal = false;
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  toggleProgramSelection(programaId: number) {
    if (this.programSelectionTemp.includes(programaId)) {
      this.programSelectionTemp = this.programSelectionTemp.filter((id) => id !== programaId);
    } else {
      this.programSelectionTemp = [...this.programSelectionTemp, programaId];
    }
  }

  isProgramTempSelected(programaId: number): boolean {
    return this.programSelectionTemp.includes(programaId);
  }

  confirmProgramSelection() {
    const uniqueSelection = Array.from(new Set(this.programSelectionTemp));
    this.programasControl.setValue(uniqueSelection);
    this.programasControl.markAsDirty();
    this.programasControl.markAsTouched();
    this.closeProgramModal();
  }

  clearProgramSelection() {
    this.programasControl.setValue([]);
    this.programasControl.markAsDirty();
    this.programasControl.markAsTouched();
    this.programSelectionTemp = [];
  }

  removeProgram(programaId: number) {
    const remaining = this.selectedProgramas.filter((id) => id !== programaId);
    this.programasControl.setValue(remaining);
    this.programasControl.markAsDirty();
    this.programasControl.markAsTouched();
  }

  private canProceedToSearch(): boolean {
    // Validar campos básicos de la sección Información General
    const required = [
      'numeroFactura',
      'serieFactura',
      'tipoCompra',
      'fechaIngreso',
      'proveedor',
      'ordenCompra',
      'programas',
      'numero1h',
      'noKardex'
    ];

    let valid = true;
    for (const key of required) {
      const ctrl = this.compraForm.get(key);
      if (ctrl) {
        ctrl.markAsTouched();
        if (ctrl.invalid) valid = false;
      }
    }

    return valid;
  }

  private initializeForm() {
    this.compraForm = this.fb.group({
      numeroFactura: [0, [Validators.required, Validators.min(1)]],
      serieFactura: ['', [Validators.required]],
      tipoCompra: ['COMPRA', [Validators.required]],
      fechaIngreso: [this.getTodayDateISO(), [Validators.required]],
      proveedor: ['', [Validators.required]],
      ordenCompra: [0, [Validators.required, Validators.min(1)]],
      programas: this.fb.control<number[]>([], [Validators.required]),
      numero1h: [0, [Validators.required, Validators.min(1)]],
      noKardex: [0, [Validators.required, Validators.min(1)]],
      // heredar el valor global si está marcado en la cabecera
      cartaCompromiso: [false],
      detalles: this.fb.array([])
    });
  }

  private getTodayDateISO(): string {
    const today = new Date();
    const month = `${today.getMonth() + 1}`.padStart(2, '0');
    const day = `${today.getDate()}`.padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  get detallesArray(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  getLotesArray(detalleIndex: number): FormArray {
    return this.detallesArray.at(detalleIndex).get('lotes') as FormArray;
  }

  buscarInsumo() {
    if (!this.codigoBusqueda.trim()) {
      this.errorBusqueda = 'Ingrese un código de insumo';
      return;
    }
    // Intentar búsqueda por código que puede devolver múltiples presentaciones
    const codigo = this.codigoBusqueda.trim();
    this.catalogoService.buscarPorCodigoArray(codigo).subscribe({
      next: (items: CatalogoInsumo[]) => {
        if (!items || items.length === 0) {
          this.insumoEncontrado = null;
          this.errorBusqueda = 'Insumo no encontrado con el código ingresado';
          return;
        }

        const presentacionesPermitidas = items.filter(item => this.esRenglonPermitido(item.renglon));

        if (!presentacionesPermitidas.length) {
          this.insumoEncontrado = null;
          this.presentacionesEncontradas = [];
          this.showSelectionModal = false;
          this.errorBusqueda = 'No tienes permiso para el renglón del insumo seleccionado.';
          this.validarRenglonDeInsumo(items[0]);
          return;
        }

        if (presentacionesPermitidas.length === 1) {
          const insumo = presentacionesPermitidas[0];
          this.insumoEncontrado = insumo;
          this.errorBusqueda = '';
          this.initializeDetalleFormFromInsumo(insumo);
          this.modalMode = 'add';
          this.editingIndex = null;
          this.openInsumoModal();
          return;
        }

        if (presentacionesPermitidas.length < items.length) {
          void this.sweetAlert.info(
            'Algunas presentaciones no están permitidas',
            'Mostramos únicamente las presentaciones del renglón autorizado para tu usuario.'
          );
        }

        this.presentacionesEncontradas = presentacionesPermitidas;
        this.showSelectionModal = true;
        this.errorBusqueda = '';
      },
      error: (error: any) => {
        this.insumoEncontrado = null;
        this.errorBusqueda = 'Error al buscar insumo';
        console.error('Error al buscar insumo:', error);
      }
    });
  }

  // Seleccionar una de las presentaciones cuando hay múltiples resultados
  selectPresentacion(index: number) {
    const insumo = this.presentacionesEncontradas[index];
    if (!insumo) {
      this.selectionError = 'Selección inválida';
      return;
    }
    if (!this.validarRenglonDeInsumo(insumo)) {
      return;
    }
    this.insumoEncontrado = insumo;
    this.initializeDetalleFormFromInsumo(insumo);
    this.modalMode = 'add';
    this.editingIndex = null;
    this.closeSelectionModal();
    this.openInsumoModal();
    // limpiar búsqueda
    this.codigoBusqueda = '';
  }

  closeSelectionModal() {
    this.showSelectionModal = false;
    this.presentacionesEncontradas = [];
    this.selectionError = '';
  }

  openInsumoModal() {
    this.showInsumoModal = true;
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
  }

  closeInsumoModal() {
    this.showInsumoModal = false;
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  agregarYCerrar() {
    // Guardar el detalle construido en el modal en el FormArray principal y cerrar modal
    this.saveDetalleFromModal();
    this.closeInsumoModal();
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    // Asegurar que el overflow se restaure si el componente se destruye
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  private actualizarRenglonesPermitidos(renglones?: number[] | null): void {
    if (!Array.isArray(renglones) || !renglones.length) {
      this.renglonesPermitidos = [];
      return;
    }

    this.renglonesPermitidos = renglones
      .map(valor => Number(valor))
      .filter(valor => Number.isFinite(valor));
  }

  private esRenglonPermitido(renglon?: number | null): boolean {
    if (!this.renglonesPermitidos.length) {
      return true;
    }

    if (renglon === null || typeof renglon === 'undefined') {
      return true;
    }

    const renglonNumero = Number(renglon);
    if (!Number.isFinite(renglonNumero)) {
      return true;
    }

    return this.renglonesPermitidos.includes(renglonNumero);
  }

  private alertarRenglonNoPermitido(
    insumoDescripcion: string,
    codigo?: number | string,
    renglon?: number | null
  ): void {
    const codigoTexto = codigo !== undefined && codigo !== null && `${codigo}`.trim() !== '' ? ` (código ${codigo})` : '';
    const renglonTexto = renglon !== undefined && renglon !== null && !Number.isNaN(Number(renglon))
      ? ` pertenece al renglón ${Number(renglon)}`
      : '';
    const renglonesAutorizados = this.renglonesPermitidos.join(', ');

    void this.sweetAlert.warning(
      'Renglón no autorizado',
      `${insumoDescripcion}${codigoTexto}${renglonTexto}. Solo puedes trabajar con los renglones ${renglonesAutorizados}.`
    );
  }

  private validarRenglonDeInsumo(insumo: {
    renglon?: number | null;
    nombreInsumo?: string;
    codigoInsumo?: number | string;
  }): boolean {
    const renglon = insumo?.renglon ?? null;
    if (this.esRenglonPermitido(renglon)) {
      return true;
    }

    const descripcionBase = insumo?.nombreInsumo ? `El insumo "${insumo.nombreInsumo}"` : 'El insumo seleccionado';
    this.alertarRenglonNoPermitido(descripcionBase, insumo?.codigoInsumo, renglon);
    return false;
  }

  // ----------------- Modal-backed detalle form helpers -----------------

  private normalizeFechaValor(valor: any): string {
    if (!valor) {
      return '';
    }

    if (valor instanceof Date) {
      return valor.toISOString().slice(0, 10);
    }

    if (typeof valor === 'string') {
      if (valor.includes('T')) {
        const fecha = new Date(valor);
        if (!Number.isNaN(fecha.getTime())) {
          return fecha.toISOString().slice(0, 10);
        }
      }
      return valor;
    }

    return '';
  }

  private fechaVencimientoValidator = (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) {
      return null;
    }

    const valorNormalizado = rawValue instanceof Date
      ? rawValue.toISOString().slice(0, 10)
      : typeof rawValue === 'string'
        ? rawValue
        : '';

    if (!valorNormalizado) {
      return { fechaFormato: true };
    }

    const match = valorNormalizado.match(/^(\d+)-(\d{2})-(\d{2})$/);
    if (!match) {
      return { fechaFormato: true };
    }

    const [_, yearStr, monthStr, dayStr] = match;

    if (yearStr.length > 4) {
      return { fechaYearLength: true };
    }

    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const day = Number(dayStr);

    const fecha = new Date(year, month, day);
    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.getFullYear() !== year ||
      fecha.getMonth() !== month ||
      fecha.getDate() !== day
    ) {
      return { fechaFormato: true };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    if (fecha < hoy) {
      return { fechaPasada: true };
    }

    return null;
  };

  private buildLoteFormGroup(data?: any): FormGroup {
    return this.fb.group({
      lote: [data?.lote ?? ''],
      fechaVencimiento: [this.normalizeFechaValor(data?.fechaVencimiento), [this.fechaVencimientoValidator]],
      cantidad: [data?.cantidad ?? 0, [Validators.required, Validators.min(0.01)]],
      cartaCompromiso: [data?.cartaCompromiso ?? false],
      mesesDevolucion: [data?.mesesDevolucion ?? ''],
      observacionesDevolucion: [data?.observacionesDevolucion ?? '']
    });
  }

  initializeDetalleFormFromInsumo(insumo: CatalogoInsumo) {
    this.detalleForm = this.fb.group({
      catalogoInsumoId: [insumo.idCatalogoInsumos],
      renglon: [insumo.renglon],
      codigoInsumo: [insumo.codigoInsumo],
      nombreInsumo: [insumo.nombreInsumo],
      caracteristicas: [insumo.caracteristicas],
      codigoPresentacion: [insumo.codigoPresentacion],
      presentacion: [insumo.nombrePresentacion],
      unidadMedida: [insumo.unidadMedida],
      cantidad: [0, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]],
      lotes: this.fb.array([]),
      observaciones: ['']
    });
  }

  crearDetalleFormFromGroup(group: any) {
    this.detalleForm = this.fb.group({
      catalogoInsumoId: [group.get('catalogoInsumoId')?.value],
      renglon: [group.get('renglon')?.value],
      codigoInsumo: [group.get('codigoInsumo')?.value],
      nombreInsumo: [group.get('nombreInsumo')?.value],
      caracteristicas: [group.get('caracteristicas')?.value],
      codigoPresentacion: [group.get('codigoPresentacion')?.value],
      presentacion: [group.get('presentacion')?.value],
      unidadMedida: [group.get('unidadMedida')?.value],
      cantidad: [group.get('cantidad')?.value, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [group.get('precioUnitario')?.value, [Validators.required, Validators.min(0.01)]],
      lotes: this.fb.array([]),
      observaciones: [group.get('observaciones')?.value || '']
    });
    // copiar lotes
    const lotesArray = this.detalleForm.get('lotes') as FormArray;
    const originalLotes = group.get('lotes') as FormArray;
    originalLotes?.controls.forEach((l) => {
      const loteGroup = l as FormGroup;
      lotesArray.push(
        this.buildLoteFormGroup({
          lote: loteGroup.get('lote')?.value,
          fechaVencimiento: loteGroup.get('fechaVencimiento')?.value,
          cantidad: loteGroup.get('cantidad')?.value,
          cartaCompromiso: loteGroup.get('cartaCompromiso')?.value,
          mesesDevolucion: loteGroup.get('mesesDevolucion')?.value,
          observacionesDevolucion: loteGroup.get('observacionesDevolucion')?.value
        })
      );
    });
  }

  addLoteToDetalleForm() {
    if (!this.detalleForm) return;
    const lotes = this.detalleForm.get('lotes') as FormArray;
    lotes.push(this.buildLoteFormGroup());
  }

  get detalleLotesArray(): FormArray | null {
    if (!this.detalleForm) return null;
    return this.detalleForm.get('lotes') as FormArray;
  }

  removeLoteFromDetalleForm(index: number) {
    if (!this.detalleForm) return;
    const lotes = this.detalleForm.get('lotes') as FormArray;
    lotes.removeAt(index);
  }

  saveDetalleFromModal() {
    if (!this.detalleForm) return;
    if (this.detalleForm.invalid) {
      this.detalleForm.markAllAsTouched();
      this.modalError = 'Revisa los campos requeridos en el detalle.';
      return;
    }

    // Validaciones específicas antes de guardar desde el modal
    const lotesArray = this.detalleForm.get('lotes') as FormArray;
    const cantidadDetalle = parseFloat(this.detalleForm.get('cantidad')?.value || 0);
    const totalLotes = lotesArray && lotesArray.length > 0
      ? lotesArray.controls.reduce((sum, l) => sum + parseFloat(l.get('cantidad')?.value || 0), 0)
      : cantidadDetalle;

    if (lotesArray && lotesArray.length > 0 && Math.abs(totalLotes - cantidadDetalle) > 0.01) {
      this.modalError = `La suma de cantidades en lotes (${totalLotes}) no coincide con la cantidad total (${cantidadDetalle}).`;
      return;
    }

    this.modalError = '';

    const detalleData = this.detalleForm.value;

    if (this.modalMode === 'add') {
      // Construir FormArray de lotes correctamente
      const lotesFA = this.fb.array(
        (detalleData.lotes || []).map((l: any) =>
          this.buildLoteFormGroup({
            lote: l.lote,
            fechaVencimiento: l.fechaVencimiento,
            cantidad: l.cantidad,
            cartaCompromiso: l.cartaCompromiso,
            mesesDevolucion: l.mesesDevolucion,
            observacionesDevolucion: l.observacionesDevolucion
          })
        )
      );

      const detalleGroup = this.fb.group({
        catalogoInsumoId: [detalleData.catalogoInsumoId, [Validators.required]],
        renglon: [detalleData.renglon, [Validators.required]],
        codigoInsumo: [detalleData.codigoInsumo, [Validators.required]],
        nombreInsumo: [detalleData.nombreInsumo, [Validators.required]],
        caracteristicas: [detalleData.caracteristicas, [Validators.required]],
        codigoPresentacion: [detalleData.codigoPresentacion, [Validators.required]],
        presentacion: [detalleData.presentacion, [Validators.required]],
        unidadMedida: [detalleData.unidadMedida, [Validators.required]],
        cantidad: [detalleData.cantidad, [Validators.required, Validators.min(0.01)]],
        precioUnitario: [detalleData.precioUnitario, [Validators.required, Validators.min(0.01)]],
        lotes: lotesFA,
        observaciones: [detalleData.observaciones || '']
      });

      this.detallesArray.push(detalleGroup);
      // Después de agregar, cerrar modal y limpiar búsqueda
      this.closeInsumoModal();
      this.codigoBusqueda = '';
      this.insumoEncontrado = null;
      this.modalMode = 'add';
      this.editingIndex = null;
      this.detalleForm = null;
      this.sweetAlert.toast('success', 'Insumo agregado a la lista');
    } else if (this.modalMode === 'edit' && this.editingIndex !== null) {
      const target = this.detallesArray.at(this.editingIndex) as FormGroup;
      if (!target) return;

      // Reconstruir lotes en el target
      const newLotesFA = this.fb.array(
        (detalleData.lotes || []).map((l: any) =>
          this.buildLoteFormGroup({
            lote: l.lote,
            fechaVencimiento: l.fechaVencimiento,
            cantidad: l.cantidad,
            cartaCompromiso: l.cartaCompromiso,
            mesesDevolucion: l.mesesDevolucion,
            observacionesDevolucion: l.observacionesDevolucion
          })
        )
      );

      // Patchear campos simples
      target.patchValue({
        catalogoInsumoId: detalleData.catalogoInsumoId,
        renglon: detalleData.renglon,
        codigoInsumo: detalleData.codigoInsumo,
        nombreInsumo: detalleData.nombreInsumo,
        caracteristicas: detalleData.caracteristicas,
        codigoPresentacion: detalleData.codigoPresentacion,
        presentacion: detalleData.presentacion,
        unidadMedida: detalleData.unidadMedida,
        cantidad: detalleData.cantidad,
        precioUnitario: detalleData.precioUnitario,
        observaciones: detalleData.observaciones || ''
      });

  // Reemplazar el FormArray 'lotes' del target
  (target as FormGroup).setControl('lotes', newLotesFA);
      // Después de editar, cerrar modal y limpiar estados
      this.closeInsumoModal();
      this.codigoBusqueda = '';
      this.insumoEncontrado = null;
      this.modalMode = 'add';
      this.editingIndex = null;
      this.detalleForm = null;
      this.sweetAlert.toast('success', 'Detalle actualizado');
    }
  }

  openEditDetalle(index: number) {
    const group = this.detallesArray.at(index);
    this.crearDetalleFormFromGroup(group);
    this.modalMode = 'edit';
    this.editingIndex = index;
    this.openInsumoModal();
  }


  async deleteDetalle(index: number) {
    const confirmed = await this.sweetAlert.confirm(
      '¿Eliminar insumo?',
      'Esta acción eliminará el insumo del detalle de la compra.',
      'Eliminar'
    );

    if (!confirmed) {
      return;
    }

    this.detallesArray.removeAt(index);
    void this.sweetAlert.success('Insumo eliminado', 'El insumo fue eliminado.');
  }

  agregarInsumoADetalle() {
    if (!this.insumoEncontrado) return;

    if (!this.validarRenglonDeInsumo(this.insumoEncontrado)) {
      this.errorBusqueda = 'No tienes permiso para el renglón de este insumo.';
      return;
    }

    // Verificar si el insumo ya está en el detalle
    const yaExiste = this.detallesArray.controls.some(
      detalle => detalle.get('catalogoInsumoId')?.value === this.insumoEncontrado!.idCatalogoInsumos
    );

    if (yaExiste) {
      this.errorBusqueda = 'Este insumo ya está agregado a la compra';
      return;
    }

    const detalleGroup = this.fb.group({
      catalogoInsumoId: [this.insumoEncontrado.idCatalogoInsumos, [Validators.required]],
      renglon: [this.insumoEncontrado.renglon, [Validators.required]],
      codigoInsumo: [this.insumoEncontrado.codigoInsumo, [Validators.required]],
      nombreInsumo: [this.insumoEncontrado.nombreInsumo, [Validators.required]],
      caracteristicas: [this.insumoEncontrado.caracteristicas, [Validators.required]],
      codigoPresentacion: [this.insumoEncontrado.codigoPresentacion, [Validators.required]],
      presentacion: [this.insumoEncontrado.nombrePresentacion, [Validators.required]],
      unidadMedida: [this.insumoEncontrado.unidadMedida, [Validators.required]],
      cantidad: [0, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]],
      lotes: this.fb.array([]),
      cartaCompromiso: [this.compraForm?.get('cartaCompromiso')?.value ?? false]
    });

    this.detallesArray.push(detalleGroup);
    
    // Limpiar búsqueda
    this.codigoBusqueda = '';
    this.insumoEncontrado = null;
    this.errorBusqueda = '';
  }

  eliminarDetalle(index: number) {
    this.detallesArray.removeAt(index);
  }

  agregarLote(detalleIndex: number) {
    this.getLotesArray(detalleIndex).push(this.buildLoteFormGroup());
  }

  eliminarLote(detalleIndex: number, loteIndex: number) {
    this.getLotesArray(detalleIndex).removeAt(loteIndex);
    this.validarCantidadLotes(detalleIndex);
  }

  validarCantidadLotes(detalleIndex: number) {
    const totalLotes = this.getTotalLotes(detalleIndex);
    const cantidadDetalle = this.getDetalleCantidad(detalleIndex);
    
    // Aquí podrías agregar validaciones adicionales si es necesario
  }

  getTotalLotes(detalleIndex: number): number {
    const lotes = this.getLotesArray(detalleIndex);
    return lotes.controls.reduce((total, lote) => {
      const cantidad = lote.get('cantidad')?.value || 0;
      return total + parseFloat(cantidad);
    }, 0);
  }

  getDetalleCantidad(detalleIndex: number): number {
    const cantidad = this.detallesArray.at(detalleIndex).get('cantidad')?.value || 0;
    return parseFloat(cantidad);
  }

  calcularTotalDetalle(index: number): number {
    const detalle = this.detallesArray.at(index);
    const cantidad = parseFloat(detalle.get('cantidad')?.value || 0);
    const precio = parseFloat(detalle.get('precioUnitario')?.value || 0);
    return cantidad * precio;
  }

  calcularTotalCompra(): number {
    const total = this.detallesArray.controls.reduce((sum, detalle) => {
      const cantidad = parseFloat(detalle.get('cantidad')?.value || 0);
      const precio = parseFloat(detalle.get('precioUnitario')?.value || 0);
      return sum + (cantidad * precio);
    }, 0);
    return total;
  }

  getInsumoNombre(detalleIndex: number): string {
    const detalle = this.detallesArray.at(detalleIndex);
    return detalle.get('nombreInsumo')?.value || 'Insumo no encontrado';
  }

  getInsumoCodigo(detalleIndex: number): string {
    const detalle = this.detallesArray.at(detalleIndex);
    return detalle.get('codigoInsumo')?.value?.toString() || 'Código no encontrado';
  }

  onSubmit() {
    // Marcar controles para mostrar mensajes de validación si faltan campos
    this.compraForm.markAllAsTouched();

    if (!this.compraForm.valid || !this.validarFormulario()) {
      return;
    }

    this.isSubmitting = true;

    const numeroFacturaRaw = this.compraForm.get('numeroFactura')?.value;
    const numeroFacturaStr =
      numeroFacturaRaw !== null && typeof numeroFacturaRaw !== 'undefined'
        ? String(numeroFacturaRaw)
        : '';

    const programasSeleccionados = Array.from(
      new Set(
        ((this.compraForm.get('programas')?.value as number[]) || []).map(
          (valor) => Number(valor),
        ),
      ),
    ).filter((valor) => Number.isFinite(valor) && valor > 0) as number[];

    const compraData = {
      numeroFactura: numeroFacturaStr,
      serieFactura: this.compraForm.get('serieFactura')?.value,
      tipoCompra: this.compraForm.get('tipoCompra')?.value,
      fechaIngreso: new Date(this.compraForm.get('fechaIngreso')?.value),
      proveedor: this.compraForm.get('proveedor')?.value,
      ordenCompra: parseInt(this.compraForm.get('ordenCompra')?.value, 10),
      programas: programasSeleccionados,
      numero1h: parseInt(this.compraForm.get('numero1h')?.value, 10),
      noKardex: parseInt(this.compraForm.get('noKardex')?.value, 10),
      detalles: this.detallesArray.value.map((detalle: any) => {
        const cantidad = parseFloat(detalle.cantidad);
        const precioUnitario = parseFloat(detalle.precioUnitario);
        const precioTotalFactura = cantidad * precioUnitario;

        const lotes = Array.isArray(detalle.lotes) ? detalle.lotes : [];

        return {
          idCatalogoInsumos: detalle.catalogoInsumoId,
          renglon: detalle.renglon,
          codigoInsumo: detalle.codigoInsumo,
          nombreInsumo: detalle.nombreInsumo,
          caracteristicas: detalle.caracteristicas,
          codigoPresentacion: detalle.codigoPresentacion,
          presentacion: detalle.presentacion,
          cantidadTotal: cantidad,
          precioUnitario: precioUnitario,
          precioTotalFactura: precioTotalFactura,
          observaciones: detalle.observaciones || null,
          lotes: lotes.map((lote: any) => ({
            cantidad: parseFloat(lote.cantidad),
            lote: lote.lote || null,
            fechaVencimiento: lote.fechaVencimiento
              ? new Date(lote.fechaVencimiento)
              : null,
            mesesDevolucion: lote.mesesDevolucion
              ? parseInt(lote.mesesDevolucion, 10)
              : null,
            observacionesDevolucion: lote.observacionesDevolucion || null,
            cartaCompromiso:
              typeof lote.cartaCompromiso !== 'undefined'
                ? lote.cartaCompromiso
                  ? 1
                  : 0
                : this.compraForm.get('cartaCompromiso')?.value
                ? 1
                : 0,
          })),
        };
      }),
    };

      this.comprasService.create(compraData).subscribe({
        next: (response: any) => {
          console.log('Compra creada exitosamente:', response);
          this.sweetAlert.success('Compra guardada', 'La compra se creó correctamente.').then(() => {
            this.router.navigate(['/compras']);
          });
        },
        error: (error: any) => {
          console.error('Error al crear la compra:', error);
          this.isSubmitting = false;
          const mensaje = this.obtenerMensajeError(
            error,
            'No se pudo guardar la compra. Intente nuevamente.'
          );
          void this.sweetAlert.error('Error al guardar la compra', mensaje);
        }
      });
  }

  private validarFormulario(): boolean {
    // Validar que haya al menos un detalle
    if (this.detallesArray.length === 0) {
      void this.sweetAlert.warning('Falta información', 'Debe agregar al menos un insumo a la compra');
      return false;
    }

    for (let i = 0; i < this.detallesArray.length; i++) {
      const lotes = this.getLotesArray(i);
      if (lotes.length > 0) {
        // Validar que la suma de lotes coincida con la cantidad del detalle
        const totalLotes = this.getTotalLotes(i);
        const cantidadDetalle = this.getDetalleCantidad(i);
        if (Math.abs(totalLotes - cantidadDetalle) > 0.01) {
          void this.sweetAlert.warning(
            'Error de cantidades',
            `La suma de cantidades en lotes del insumo ${i + 1} no coincide con la cantidad total`
          );
          return false;
        }
      }
    }

    return true;
  }

  cancelar() {
    this.router.navigate(['/compras']);
  }

  private obtenerMensajeError(error: any, fallback: string): string {
    if (!error) {
      return fallback;
    }

    const posibleMensaje = error?.error?.message ?? error?.message ?? error?.error;

    if (typeof posibleMensaje === 'string' && posibleMensaje.trim().length > 0) {
      return posibleMensaje;
    }

    if (Array.isArray(posibleMensaje) && posibleMensaje.length > 0) {
      return posibleMensaje.join('\n');
    }

    if (typeof posibleMensaje === 'object' && posibleMensaje?.message) {
      return `${posibleMensaje.message}`;
    }

    return fallback;
  }
}