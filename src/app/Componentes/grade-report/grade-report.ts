import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, NotaApi, ExportFormat } from '../../api.service';

type NotaRow = {
  id: number;
  codigo: string;
  alumno: string;
  curso: string;
  seccion: string;
  av1: number;
  av2: number;
  av3: number;
  part: number;
  proy: number;
  final: number;
  raw: NotaApi;
};

@Component({
  selector: 'app-grade-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-report.html',
})
export class GradeReport {
  // Filtros
  curso = '';
  seccionId: number | null = null;
  seccionNombre = '';
  codigo = '';
  page = 1;

  // Estado
  loading = false;
  filas: NotaRow[] = [];
  mlMsg = '';

  constructor(private api: ApiService) {}

  private mapNota(n: NotaApi): NotaRow {
    const codigo = n.estudiante_codigo ?? '';
    const alumno = n.estudiante_nombre ?? '';
    const curso = (n as any).curso || n.curso_codigo || '';
    const seccion = (n as any).seccion || n.seccion_nombre || '';

    return {
      id: n.id,
      codigo,
      alumno,
      curso,
      seccion,
      av1: (n.av1 ?? n.avance1 ?? 0) as number,
      av2: (n.av2 ?? n.avance2 ?? 0) as number,
      av3: (n.av3 ?? n.avance3 ?? 0) as number,
      part: (n.part ?? n.participacion ?? 0) as number,
      proy: (n.proy ?? (n as any).proyecto ?? (n as any).proyecto_final ?? 0) as number,
      final: (n.final ?? n.nota_final ?? 0) as number,
      raw: n,
    };
  }

  buscar(): void {
    this.loading = true;
    this.filas = [];
    this.api
      .notas({
        curso: this.curso || undefined,
        seccion: this.seccionId != null ? this.seccionId : (this.seccionNombre || undefined),
        codigo: this.codigo || undefined,
        page: this.page,
        page_size: 1000,
      })
      .subscribe({
        next: (res: any) => {
          const list = Array.isArray(res) ? res : res?.results ?? [];
          this.filas = list.map((n: NotaApi) => this.mapNota(n));
        },
        error: () => (this.filas = []),
        complete: () => (this.loading = false),
      });
  }

  exportar(format: ExportFormat): void {
    if (this.loading) return;
    this.loading = true;
    this.api
      .exportNotas(format, {
        curso: this.curso || undefined,
        seccion: this.seccionId != null ? this.seccionId : (this.seccionNombre || undefined),
        codigo: this.codigo || undefined,
      })
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `notas.${format}`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        complete: () => (this.loading = false),
      });
  }

  get canRunML(): boolean {
    return true;
  }

  runProyeccion(): void {
    this.loading = true;
    this.mlMsg = '';
    this.api
      .mlProyeccion({
        seccionId: this.seccionId ?? undefined,
        curso: this.curso || undefined,
        seccion: this.seccionNombre || undefined,
      })
      .subscribe({
        next: (res: any) => (this.mlMsg = this.fmtML(res)),
        error: (e) => (this.mlMsg = e?.error?.detail ?? 'No se pudo ejecutar la proyección'),
        complete: () => (this.loading = false),
      });
  }

  runRiesgo(): void {
    this.loading = true;
    this.mlMsg = '';
    this.api
      .mlRiesgo({
        seccionId: this.seccionId ?? undefined,
        curso: this.curso || undefined,
        seccion: this.seccionNombre || undefined,
      })
      .subscribe({
        next: (res: any) => (this.mlMsg = this.fmtML(res)),
        error: (e) => (this.mlMsg = e?.error?.detail ?? 'No se pudo ejecutar el riesgo'),
        complete: () => (this.loading = false),
      });
  }

  private fmtML(res: any): string {
    try {
      if (!res) return 'Sin respuesta del modelo';
      const m = res.model ? `modelo=${res.model.type}` : '';
      const count = Array.isArray(res.predictions) ? res.predictions.length : 0;
      return `OK ${m} | predicciones=${count}`;
    } catch {
      return 'Resultado ML recibido';
    }
  }
}
