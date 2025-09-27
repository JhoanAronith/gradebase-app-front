import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

type SeccionOpt = { id: number; nombre: string; curso?: { codigo: string } };
type EstudianteOpt = { id: number; codigo: string; nombre?: string; apellido?: string; full_name?: string };

@Component({
  selector: 'app-register-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-grades.html',
  styleUrls: ['./register-grades.css']
})
export class RegisterGrades {
  // selects
  secciones: SeccionOpt[] = [];
  estudiantes: EstudianteOpt[] = [];
  seccionId: number | null = null;
  estudianteId: number | null = null;

  // formulario
  av1: string | number = '';
  av2: string | number = '';
  av3: string | number = '';
  participacion: string | number = '';
  proyecto: string | number = '';
  final: string | number = '';

  // tabla
  notas: any[] = [];
  editId: number | null = null;
  loading = false;

  constructor(private api: ApiService) {
    this.cargarSecciones();
  }

  cargarSecciones() {
    this.api.secciones().subscribe(list => {
     
      this.secciones = list.sort((a: any, b: any) =>
        String(a?.curso?.codigo ?? '').localeCompare(String(b?.curso?.codigo ?? '')) ||
        String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''))
      );
    });
  }

  onSeccionChange() {
    this.estudianteId = null;
    this.notas = [];
    this.estudiantes = [];
    if (!this.seccionId) return;

    // carga estudiantes de la sección
    this.api.estudiantes(this.seccionId).subscribe(es => {
      this.estudiantes = es;
    });

    // carga notas de la sección
    this.refrescarTabla();
  }

  refrescarTabla() {
    if (!this.seccionId) { this.notas = []; return; }
    this.api.notas({ seccionId: this.seccionId, page_size: 1000 }).subscribe((r: any) => {
      const arr = Array.isArray(r) ? r : (r?.results ?? []);
      this.notas = arr.map((n: any) => ({
        id: n.id,
        estudiante_codigo: n.estudiante?.codigo ?? n.estudiante_codigo ?? '',
        estudiante_nombre: n.estudiante_nombre ?? n.estudiante?.full_name ?? `${n.estudiante?.nombre ?? ''} ${n.estudiante?.apellido ?? ''}`.trim(),
        av1: n.avance1 ?? n.av1 ?? '',
        av2: n.avance2 ?? n.av2 ?? '',
        av3: n.avance3 ?? n.av3 ?? '',
        participacion: n.participacion ?? '',
        proyecto: n.proyecto_final ?? n.proyecto ?? '',
        final: n.nota_final ?? n.final ?? ''
      }));
    });
  }

  limpiar() {
    this.editId = null;
    this.av1 = this.av2 = this.av3 = this.participacion = this.proyecto = this.final = '';
  }

  guardar() {
    if (!this.seccionId || !this.estudianteId) return;
    this.loading = true;

    const dto = {
      av1: this.av1,
      av2: this.av2,
      av3: this.av3,
      participacion: this.participacion,
      proyecto: this.proyecto,
      final: this.final
    };

    const obs = this.editId
      ? this.api.actualizarNota(this.editId, dto)
      : this.api.crearNota({ seccionId: this.seccionId, estudianteId: this.estudianteId, ...dto });

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.limpiar();
        this.refrescarTabla();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editar(n: any) {
    this.editId = n.id;
    this.av1 = n.av1 ?? '';
    this.av2 = n.av2 ?? '';
    this.av3 = n.av3 ?? '';
    this.participacion = n.participacion ?? '';
    this.proyecto = n.proyecto ?? '';
    this.final = n.final ?? '';
  }

  eliminar(id: number) {
    this.api.eliminarNota(id).subscribe(() => this.refrescarTabla());
  }
}
