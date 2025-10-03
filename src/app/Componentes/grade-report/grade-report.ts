import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

type NotaRow = {
  codigo: string;
  alumno: string;
  curso: string;
  seccion: string;
  av1: number; av2: number; av3: number;
  part: number; proy: number; final: number;
  raw: any;
};

@Component({
  selector: 'app-grade-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-report.html',
})
export class GradeReport {
  // filtros
  curso = '';
  seccion = '';
  codigo = '';

  // tabla
  filas: NotaRow[] = [];
  loading = false;

  // salida ML
  mlMsg = '';

  constructor(private api: ApiService) {}

  // ===== helpers =====
  private fullNameFromAny(e: any): string {
    if (!e) return '';
    const last =
      e.apellido ?? e.apellidos ?? e.last_name ?? e.usuario?.last_name ?? '';
    const first =
      e.nombre ?? e.nombres ?? e.first_name ?? e.usuario?.first_name ?? '';
    const coma = last && first ? ', ' : '';
    return `${last}${coma}${first}`.trim();
  }

  private mapNota(n: any): NotaRow {
    const codigo =
      n.estudiante?.codigo ??
      n.estudiante_codigo ??
      n.codigo ??
      '';

    const alumno =
      this.fullNameFromAny(n.estudiante) ||
      n.estudiante_nombre ||
      '';

    const curso =
      n.seccion?.curso?.codigo ??
      n.curso_codigo ??
      this.curso ??
      '';

    const seccion =
      n.seccion?.nombre ??
      n.seccion ??
      this.seccion ??
      '';

    return {
      codigo,
      alumno,
      curso,
      seccion,
      av1: n.avance1 ?? n.av1 ?? 0,
      av2: n.avance2 ?? n.av2 ?? 0,
      av3: n.avance3 ?? n.av3 ?? 0,
      part: n.participacion ?? n.part ?? 0,
      proy: n.proyecto_final ?? n.proyecto ?? 0,
      final: n.nota_final ?? n.final ?? 0,
      raw: n,
    };
  }

  private patchRowsWithStudents(students: any[]) {
    if (!this.filas?.length || !students?.length) return;
    const byId = new Map<number, any>();
    const byCode = new Map<string, any>();
    for (const s of students) {
      byId.set(s.id, s);
      if (s.codigo) byCode.set(String(s.codigo), s);
    }

    for (const r of this.filas) {
      if (r.codigo && r.alumno) continue;

      const estId =
        r.raw?.estudiante?.id ??
        r.raw?.estudiante ??
        r.raw?.estudiante_id ??
        null;

      // completa por id primero
      let est = (estId != null) ? byId.get(Number(estId)) : undefined;

      // si no hay por id, intenta por código
      if (!est && r.codigo) est = byCode.get(String(r.codigo));

      if (est) {
        r.codigo = r.codigo || est.codigo || '';
        const last =
          est.apellido ?? est.apellidos ?? est.last_name ?? est.usuario?.last_name ?? '';
        const first =
          est.nombre ?? est.nombres ?? est.first_name ?? est.usuario?.first_name ?? '';
        const coma = last && first ? ', ' : '';
        r.alumno = r.alumno || `${last}${coma}${first}`.trim();
      }
    }
  }

  // ===== acciones =====
  buscar() {
    this.loading = true;
    this.filas = [];

    this.api
      .notas({
        curso: this.curso || undefined,
        seccion: this.seccion || undefined,
        codigo: this.codigo || undefined,
        page_size: 1000,
      })
      .subscribe({
        next: (res: any) => {
          const arr = res?.results ?? res ?? [];
          this.filas = arr.map((n: any) => this.mapNota(n));

          if (
            this.seccion &&
            this.filas.some(f => !f.codigo || !f.alumno)
          ) {
            this.api
              .estudiantesFiltro({ seccion_nombre: this.seccion, page_size: 1000 })
              .subscribe({
                next: (es: any) => {
                  const list = es?.results ?? es ?? [];
                  this.patchRowsWithStudents(list);
                  this.loading = false;
                },
                error: () => (this.loading = false),
              });
          } else {
            this.loading = false;
          }
        },
        error: () => (this.loading = false),
      });
  }

  get canRunML(): boolean {
    return (this.filas?.length ?? 0) >= 3;
  }

  runProyeccion() {
    this.mlMsg = '';
    this.api.mlProyeccion({
      curso: this.curso || undefined,
      seccion: this.seccion || undefined,
    }).subscribe({
      next: (r: any) => (this.mlMsg = this.fmtML(r)),
      error: (e) => (this.mlMsg = e?.error?.detail ?? 'No se pudo ejecutar Proyección'),
    });
  }

  runRiesgo() {
    this.mlMsg = '';
    this.api.mlRiesgo({
      curso: this.curso || undefined,
      seccion: this.seccion || undefined,
    }).subscribe({
      next: (r: any) => (this.mlMsg = this.fmtML(r)),
      error: (e) => (this.mlMsg = e?.error?.detail ?? 'No se pudo ejecutar Riesgo'),
    });
  }

  private fmtML(obj: any): string {
    try { return JSON.stringify(obj, null, 2); } catch { return String(obj ?? ''); }
  }
}
