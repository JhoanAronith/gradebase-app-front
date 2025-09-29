import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';

type Num = number | null;

interface SeccionOpt {
  id: number;
  nombre: string;
  curso_codigo?: string;
  curso?: { codigo: string };
}

interface StudentOpt {
  id: number;
  codigo: string;
  nombre?: string;
  nombres?: string;
  apellido?: string;
  apellidos?: string;
}

interface NotaRow {
  id: number;
  estudiante_id: number;
  estudiante_codigo: string;
  estudiante_nombre: string;
  av1: number;
  av2: number;
  av3: number;
  participacion: number;
  proyecto: number;
  final: number;
}

@Component({
  selector: 'app-register-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-grades.html',
})
export class RegisterGrades implements OnInit {
  // Selects
  secciones: SeccionOpt[] = [];
  estudiantes: StudentOpt[] = [];

  seccionId: number | null = null;
  estudianteId: number | null = null;

  // Form
  av1: Num = 0;
  av2: Num = 0;
  av3: Num = 0;
  participacion: Num = 0;
  proyecto: Num = 0;
  final: Num = 0;

  // Tabla
  filas: NotaRow[] = [];

  // Estado
  loading = false;
  editId: number | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarSecciones();
  }

  // ---------------------------
  // Cargas iniciales
  // ---------------------------
  cargarSecciones() {
    this.api.secciones().subscribe((arr: any[]) => {
      this.secciones = (arr || []).map((s: any) => ({
        id: s.id,
        nombre: s.nombre,
        curso_codigo: s.curso_codigo ?? s.curso?.codigo ?? '',
        curso: s.curso,
      }));
    });
  }

  onSeccionChange() {
    this.estudianteId = null;
    this.limpiar(false);
    this.estudiantes = [];
    this.filas = [];
    if (!this.seccionId) return;

    this.api.estudiantes(this.seccionId).subscribe((arr: any[]) => {
      this.estudiantes = (arr || []).map((e: any) => ({
        id: e.id,
        codigo: e.codigo,
        nombre: e.nombre,
        nombres: e.nombres,
        apellido: e.apellido,
        apellidos: e.apellidos,
      }));
    });

    this.refrescarTabla();
  }

  refrescarTabla() {
    if (!this.seccionId) {
      this.filas = [];
      return;
    }
    this.api.notas({ seccionId: this.seccionId, page_size: 1000 }).subscribe((resp: any) => {
      const resultados = Array.isArray(resp?.results) ? resp.results : Array.isArray(resp) ? resp : [];
      this.filas = resultados.map((n: any) => {
        const est = this.estudiantes.find(e => e.id === n.estudiante) as StudentOpt | undefined;
        const estNombre = `${est?.apellido ?? est?.apellidos ?? ''}${
          (est?.apellido || est?.apellidos) ? ', ' : ''
        }${est?.nombre ?? est?.nombres ?? ''}`.trim();

        return {
          id: n.id,
          estudiante_id: n.estudiante,
          estudiante_codigo: est?.codigo ?? '',
          estudiante_nombre: estNombre,
          av1: Number(n.av1 ?? n.avance1 ?? 0),
          av2: Number(n.av2 ?? n.avance2 ?? 0),
          av3: Number(n.av3 ?? n.avance3 ?? 0),
          participacion: Number(n.participacion ?? 0),
          proyecto: Number(n.proyecto ?? n.proyecto_final ?? 0),
          final: Number(n.final ?? n.nota_final ?? 0),
        } as NotaRow;
      });
    });
  }

  // ---------------------------
  // Acciones
  // ---------------------------
  tieneValores(): boolean {
    return true;
  }

  editar(n: NotaRow) {
    this.editId = n.id;
    this.estudianteId = n.estudiante_id; 
    this.av1 = n.av1;
    this.av2 = n.av2;
    this.av3 = n.av3;
    this.participacion = n.participacion;
    this.proyecto = n.proyecto;
    this.final = n.final;
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta nota?')) return;
    this.loading = true;
    this.api.eliminarNota(id).subscribe({
      next: () => {
        this.loading = false;
        this.refrescarTabla();
        if (this.editId === id) this.limpiar(false);
      },
      error: () => (this.loading = false),
    });
  }

  guardar() {
    if (!this.seccionId) return;

    // -------- DTOs según ApiService (front) --------
    const dtoUpdate = {
      av1: Number(this.av1 ?? 0),
      av2: Number(this.av2 ?? 0),
      av3: Number(this.av3 ?? 0),
      participacion: Number(this.participacion ?? 0),
      proyecto: Number(this.proyecto ?? 0),
      final: Number(this.final ?? 0),
    };

    const dtoCreate = {
      seccionId: this.seccionId as number,
      estudianteId: this.estudianteId as number,
      av1: dtoUpdate.av1,
      av2: dtoUpdate.av2,
      av3: dtoUpdate.av3,
      participacion: dtoUpdate.participacion,
      proyecto: dtoUpdate.proyecto,
      final: dtoUpdate.final,
    };

    // Si estamos creando y no hay estudiante, no enviamos
    if (!this.editId && !this.estudianteId) return;

    this.loading = true;
    const req$ = this.editId
      ? this.api.actualizarNota(this.editId, dtoUpdate) // PUT con nombres del front
      : this.api.crearNota(dtoCreate);                   // POST con seccionId/estudianteId

    req$.subscribe({
      next: () => {
        this.loading = false;
        this.refrescarTabla();
      },
      error: () => (this.loading = false),
    });
  }

  limpiar(resetEstudiante = true) {
    if (resetEstudiante) this.estudianteId = null;
    this.editId = null;
    this.av1 = 0;
    this.av2 = 0;
    this.av3 = 0;
    this.participacion = 0;
    this.proyecto = 0;
    this.final = 0;
  }
}
