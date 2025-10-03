import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

type ID = number;

interface SeccionOpt {
  id: ID;
  nombre: string;
  curso: { codigo: string; nombre?: string };
}

interface StudentOpt {
  id: ID;
  codigo: string;
  apellido?: string;
  apellidos?: string;
  nombre?: string;
  nombres?: string;
}

interface NotaApi {
  id: ID;
  estudiante: ID;

  // Campos reales (backend DRF)
  avance1?: number; avance2?: number; avance3?: number;
  participacion?: number; proyecto_final?: number; nota_final?: number;

  // Aliases usados por el HTML (opcionales para que compile)
  av1?: number; av2?: number; av3?: number;
  part?: number; proyecto?: number; final?: number;
  estudiante_codigo?: string;
  estudiante_nombre?: string;
}

@Component({
  selector: 'app-register-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-grades.html',
})
export class RegisterGrades implements OnInit {
  // selects
  secciones: SeccionOpt[] = [];
  seccionId?: ID;
  estudiantes: StudentOpt[] = [];
  estudianteId?: ID;

  // formulario
  av1 = 0; av2 = 0; av3 = 0; participacion = 0; proyecto = 0; final = 0;

  // tabla
  private notasRaw: any[] = [];
  notas: NotaApi[] = [];

  // edición
  editId?: ID;

  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarSecciones();
  }

  private cargarSecciones() {
    this.loading = true;
    this.api.secciones({ page_size: 1000 }).subscribe({
      next: (res: any) => {
        this.secciones = (res?.results ?? res ?? []) as SeccionOpt[];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onSeccionChange() {
    this.estudianteId = undefined;
    this.resetValores();
    if (!this.seccionId) {
      this.estudiantes = [];
      this.notasRaw = [];
      this.notas = [];
      return;
    }
    this.cargarEstudiantes(this.seccionId);
    this.cargarNotas(this.seccionId);
  }

  private cargarEstudiantes(seccionId: ID) {
    this.loading = true;
    this.api.estudiantes(seccionId, 1000).subscribe({
      next: (arr: any) => {
        this.estudiantes = (arr?.results ?? arr ?? []) as StudentOpt[];
        this.loading = false;
        this.rebuildNotas();   // refresca nombres/códigos en la tabla
      },
      error: () => (this.loading = false),
    });
  }

  private cargarNotas(seccionId: ID) {
    this.loading = true;
    this.api.notas({ seccion: seccionId, page_size: 1000 }).subscribe({
      next: (resp: any) => {
        this.notasRaw = (resp?.results ?? resp ?? []) as any[];
        this.loading = false;
        this.rebuildNotas();
      },
      error: () => (this.loading = false),
    });
  }

  private codigoEstudiante(id: ID): string {
    const e = this.estudiantes.find(x => x.id === id);
    return e?.codigo ?? '-';
  }

  nombreEstudiante(id: ID): string {
    const e = this.estudiantes.find(x => x.id === id);
    if (!e) return '-';
    const ap = (e.apellido || e.apellidos || '').trim();
    const no = (e.nombre || e.nombres || '').trim();
    return `${ap}${ap && no ? ', ' : ''}${no}`.trim() || e.codigo || '-';
  }

  private rebuildNotas() {
    // Mapea backend -> aliases usados por el HTML y rellena nombre/código
    this.notas = this.notasRaw.map((n: any) => {
      const estId: ID = n.estudiante;
      return {
        ...n,
        av1: n.avance1 ?? n.av1 ?? 0,
        av2: n.avance2 ?? n.av2 ?? 0,
        av3: n.avance3 ?? n.av3 ?? 0,
        part: n.participacion ?? n.part ?? 0,
        proyecto: n.proyecto_final ?? n.proyecto ?? 0,
        final: n.nota_final ?? n.final ?? 0,
        estudiante_codigo: n.estudiante_codigo ?? this.codigoEstudiante(estId),
        estudiante_nombre: n.estudiante_nombre ?? this.nombreEstudiante(estId),
      } as NotaApi;
    });
  }

  editar(n: NotaApi) {
    this.editId = n.id;
    this.estudianteId = n.estudiante;
    this.av1 = n.avance1 ?? n.av1 ?? 0;
    this.av2 = n.avance2 ?? n.av2 ?? 0;
    this.av3 = n.avance3 ?? n.av3 ?? 0;
    this.participacion = n.participacion ?? n.part ?? 0;
    this.proyecto = n.proyecto_final ?? n.proyecto ?? 0;
    this.final = n.nota_final ?? n.final ?? 0;
  }

  eliminar(id: ID) {
    if (!confirm('¿Eliminar la nota?')) return;
    this.api.eliminarNota(id).subscribe({
      next: () => {
        if (this.seccionId) this.cargarNotas(this.seccionId);
      },
    });
  }

  guardar() {
    if (!this.seccionId || !this.estudianteId) return;

    const dto = {
      seccionId: this.seccionId,
      estudianteId: this.estudianteId,
      av1: Number(this.av1) || 0,
      av2: Number(this.av2) || 0,
      av3: Number(this.av3) || 0,
      participacion: Number(this.participacion) || 0,
      proyecto: Number(this.proyecto) || 0,
      final: Number(this.final) || 0,
    };

    const req = this.editId
      ? this.api.actualizarNota(this.editId, dto)
      : this.api.crearNota(dto);

    this.loading = true;
    req.subscribe({
      next: () => {
        this.loading = false;
        this.resetFormulario();
        if (this.seccionId) this.cargarNotas(this.seccionId);
      },
      error: () => (this.loading = false),
    });
  }

  limpiar() {
    this.resetFormulario();
  }

  private resetValores() {
    this.av1 = this.av2 = this.av3 = this.participacion = this.proyecto = this.final = 0;
    this.editId = undefined;
  }

  private resetFormulario() {
    this.estudianteId = undefined;
    this.resetValores();
  }
}
