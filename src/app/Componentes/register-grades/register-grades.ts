import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  SeccionApi,
  EstudianteApi,
  NotaApi,
} from '../../api.service';

@Component({
  selector: 'app-register-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-grades.html',
})
export class RegisterGrades implements OnInit {
  // combos
  secciones: SeccionApi[] = [];
  estudiantes: EstudianteApi[] = [];

  // selección
  seccionId: number | null = null;
  seccionNombre: string | null = null;
  estudianteId: number | null = null;

  // formulario de notas
  av1: number | null = null;
  av2: number | null = null;
  av3: number | null = null;
  participacion: number | null = null;
  proyecto: number | null = null;
  final: number | null = null;

  // tabla
  notas: NotaApi[] = [];

  // estado
  editId: number | null = null;
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.secciones({ page_size: 1000 }).subscribe({
      next: (arr) => (this.secciones = arr),
      error: () => (this.secciones = []),
    });
  }

  // Helpers
  getCursoCode(s: SeccionApi): string {
    const c: any = (s as any).curso;
    if (c && typeof c === 'object' && 'codigo' in c) return String(c.codigo);
    if (typeof c === 'string' || typeof c === 'number') return String(c);
    return '';
  }

  studentName(e: EstudianteApi): string {
    const a: any = e as any;
    const ap = a.apellido ?? a.apellidos ?? '';
    const no = a.nombre ?? a.nombres ?? '';
    return [ap, no].filter(Boolean).join(ap && no ? ', ' : '');
  }

  onSeccionChange(): void {
    if (this.seccionId == null) {
      this.estudiantes = [];
      this.notas = [];
      return;
    }
    this.cargarEstudiantes(this.seccionId);
    this.cargarNotas(this.seccionId);
    this.estudianteId = null;
    this.resetFormValuesOnly();
    this.editId = null;
  }

  private cargarEstudiantes(seccionId: number): void {
    this.api.estudiantes(seccionId, 1000).subscribe({
      next: (arr) => (this.estudiantes = arr),
      error: () => (this.estudiantes = []),
    });
  }

  private cargarNotas(seccionId: number): void {
    this.api.notas({ seccion: this.seccionId as any, page_size: 1000 }).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res?.results ?? [];
        this.notas = list as NotaApi[];
      },
      error: () => (this.notas = []),
    });
  }

  editar(n: NotaApi): void {
    this.editId = n.id;

    if (typeof n.estudiante === 'number') {
      this.estudianteId = n.estudiante;
    }
    if (typeof n.seccion === 'number') {
      if (this.seccionId !== n.seccion) {
        this.seccionId = n.seccion;
        this.onSeccionChange();
      }
    }

    this.av1 = (n.av1 ?? n.avance1 ?? null) as number | null;
    this.av2 = (n.av2 ?? n.avance2 ?? null) as number | null;
    this.av3 = (n.av3 ?? n.avance3 ?? null) as number | null;
    this.participacion = (n.part ?? n.participacion ?? null) as number | null;
    this.proyecto = ((n as any).proy ?? (n as any).proyecto ?? (n as any).proyecto_final ?? null) as number | null;
    this.final = (n.final ?? n.nota_final ?? null) as number | null;
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar la nota?')) return;
    this.api.eliminarNota(id).subscribe({
      next: () => {
        if (this.seccionId != null) this.cargarNotas(this.seccionId);
      },
    });
  }

  limpiar(): void {
    this.editId = null;
    this.estudianteId = null;
    this.resetFormValuesOnly();
  }

  private resetFormValuesOnly(): void {
    this.av1 = this.av2 = this.av3 = null;
    this.participacion = this.proyecto = this.final = null;
  }

  formTieneAlgunaNota(): boolean {
    const v = [this.av1, this.av2, this.av3, this.participacion, this.proyecto, this.final];
    return v.some((x) => x != null);
  }

  valProyecto(n: NotaApi): number | string {
    const a: any = n as any;
    return a.proy ?? a.proyecto ?? a.proyecto_final ?? '';
  }

  guardar(): void {
    if (this.loading) return;
    if (this.seccionId == null) return;

    if (this.editId && this.estudianteId == null) {
      const row = this.notas.find(x => x.id === this.editId);
      if (row && typeof row.estudiante === 'number') {
        this.estudianteId = row.estudiante;
      }
    }

    if (this.estudianteId == null) return;
    if (!this.formTieneAlgunaNota()) return;

    const dto = {
      seccion: this.seccionId,
      estudiante: this.estudianteId,
      avance1: this.av1,
      avance2: this.av2,
      avance3: this.av3,
      participacion: this.participacion,
      proyecto_final: this.proyecto,
      nota_final: this.final,
    };

    this.loading = true;
    const obs = this.editId
      ? this.api.actualizarNota(this.editId, dto)
      : this.api.crearNota(dto);

    obs.subscribe({
      next: () => {
        if (this.seccionId != null) this.cargarNotas(this.seccionId);
        this.resetFormValuesOnly();
        this.editId = null;
      },
      complete: () => (this.loading = false),
    });
  }

  validarNota(valor: number): number | null {
    if (valor == null) return null;
    if (valor < 0) return 0;
    if (valor > 20) return 20;
    return valor;
  }
}
