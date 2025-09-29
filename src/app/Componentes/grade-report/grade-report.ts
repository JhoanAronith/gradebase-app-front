import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-grade-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-report.html',
  styleUrls: ['./grade-report.css']
})
export class GradeReport {
  // Filtros
  curso = '';     // código de curso 
  seccion = '';   // nombre/letra sección 
  codigo = '';    // código estudiante

  // Tabla normalizada para el template
  filas: Array<{
    id: number;
    codigo: string;
    alumno: string;
    curso: string;
    seccion: string;
    av1: number | string;
    av2: number | string;
    av3: number | string;
    part: number | string;
    proy: number | string;
    final: number | string;
    raw: any;
  }> = [];

  loading = false;
  mlMsg = '';

  constructor(private api: ApiService) {}

  filtrar() {
    this.loading = true;
    this.mlMsg = '';

    this.api.notas({
      curso: this.curso || undefined,

      codigo: this.codigo || undefined,
      page: 1
    }).subscribe({
      next: (res: any) => {
        const arr = Array.isArray(res) ? res : (res?.results ?? []);
        this.filas = arr.map((n: any) => ({
          id: n.id,
          codigo: n.estudiante?.codigo ?? n.estudiante_codigo ?? n['estudiante__codigo'] ?? '',
          alumno: n.estudiante_nombre ?? n['estudiante__nombre'] ?? n.estudiante?.full_name ?? '',
          curso: n.seccion?.curso?.codigo ?? n.curso_codigo ?? n['seccion__curso__codigo'] ?? this.curso ?? '',
          seccion: n.seccion?.nombre ?? n['seccion__nombre'] ?? this.seccion ?? '',
          av1: n.av1 ?? n.avance1 ?? '',
          av2: n.av2 ?? n.avance2 ?? '',
          av3: n.av3 ?? n.avance3 ?? '',
          part: n.participacion ?? '',
          proy: n.proyecto ?? n.proyecto_final ?? '',
          final: n.final ?? n.nota_final ?? '',
          raw: n
        }));
        this.loading = false;
      },
      error: () => {
        this.filas = [];
        this.loading = false;
      }
    });
  }

  exportar(format: 'csv' | 'xlsx' | 'pdf') {
    this.api.exportar(format, {
      curso: this.curso || undefined,
      seccion: this.seccion || undefined,
      codigo: this.codigo || undefined
    }).subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '');
      a.href = url;
      a.download = `notas_${ts}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  runProyeccion() {
    if (!this.curso || !this.seccion) {
      this.mlMsg = 'Completa Curso y Sección para ejecutar ML.';
      return;
    }
    if (!this.filas.length || this.filas.length < 5) {
      this.mlMsg = 'Aún no hay suficientes notas en la sección (mínimo sugerido: 5).';
      return;
    }

    this.loading = true; this.mlMsg = '';
    this.api.mlProyeccion({ curso: this.curso, seccion: this.seccion })
      .subscribe({
        next: () => { this.loading = false; this.mlMsg = 'Proyección calculada correctamente.'; },
        error: (e) => { this.loading = false; this.mlMsg = e?.error?.detail ?? 'No se pudo calcular la proyección.'; }
      });
  }

  runRiesgo() {
    if (!this.curso || !this.seccion) {
      this.mlMsg = 'Completa Curso y Sección para ejecutar ML.';
      return;
    }
    if (!this.filas.length || this.filas.length < 5) {
      this.mlMsg = 'Aún no hay suficientes notas en la sección (mínimo sugerido: 5).';
      return;
    }

    this.loading = true; this.mlMsg = '';
    this.api.mlRiesgo({ curso: this.curso, seccion: this.seccion })
      .subscribe({
        next: () => { this.loading = false; this.mlMsg = 'Riesgo calculado correctamente.'; },
        error: (e) => { this.loading = false; this.mlMsg = e?.error?.detail ?? 'No se pudo calcular el riesgo.'; }
      });
  }
}
