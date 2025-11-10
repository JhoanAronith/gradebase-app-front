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

type MlProjItem = { codigo: string; estudiante: number; pred_final: number };
type MlRiskItem = { codigo: string; estudiante: number; risk_prob: number; clase: 'BAJO' | 'MEDIO' | 'ALTO'; umbral: number };

@Component({
  selector: 'app-grade-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-report.html',
})
export class GradeReport {
  curso = '';
  seccionId: number | null = null;
  seccionNombre = '';
  codigo = '';
  page = 1;

  loading = false;
  filas: NotaRow[] = [];
  mlMsg = '';

  mlProj: { predictions: MlProjItem[] } | null = null;
  mlRisk: { predictions: MlRiskItem[] } | null = null;
  predMap = new Map<string, number>();
  riskMap = new Map<string, { p: number; clase: string; umbral: number }>();

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

  private resetMl(): void {
    this.mlMsg = '';
    this.mlProj = null;
    this.mlRisk = null;
    this.predMap.clear();
    this.riskMap.clear();
  }

  buscar(): void {
    this.loading = true;
    this.filas = [];
    this.resetMl();

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
          const list = Array.isArray(res) ? res : (res?.results ?? []);
          this.filas = list.map((n: NotaApi) => this.mapNota(n));
          if (this.filas.length) {
            const first = this.filas[0].raw;
            this.seccionId = typeof first?.seccion === 'number' ? first.seccion : this.seccionId;
            this.seccionNombre = this.seccionNombre || (this.filas[0].seccion ?? '');
          } else {
            this.seccionId = null;
          }
        },
        error: (e) => {
          console.error(e);
          this.filas = [];
          this.seccionId = null;
        },
        complete: () => (this.loading = false),
      });
  }

  exportar(format: ExportFormat): void {
    if (this.loading) return;
    this.loading = true;

    const seccionNombre =
      this.seccionNombre ||
      (this.filas.length ? this.filas[0].seccion : undefined);

    this.api
      .exportNotas(format, {
        curso: this.curso || undefined,
        seccion: seccionNombre,          // nombre, no ID
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
        error: (e) => {
          console.error('Error exportando:', e);
          alert('No se pudo exportar. Revisa los filtros o tus permisos.');
        },
        complete: () => (this.loading = false),
      });
  }

  get canRunML(): boolean {
    return Boolean(
      (this.seccionId != null && !Number.isNaN(this.seccionId)) ||
      (this.curso && this.seccionNombre)
    );
  }

  runProyeccion(): void {
    if (!this.canRunML) {
      this.mlMsg = `Falta 'seccion_id' o ('curso' y 'seccion'). Usa Filtrar primero.`;
      return;
    }
    this.loading = true;
    this.mlMsg = '';
    this.api
      .mlProyeccion({
        seccionId: this.seccionId ?? undefined,
        curso: this.curso || undefined,
        seccion: this.seccionNombre || undefined,
      })
      .subscribe({
        next: (res: any) => {
          this.mlMsg = this.fmtML(res);
          this.mlProj = res;
          this.predMap.clear();
          if (Array.isArray(res?.predictions)) {
            for (const r of res.predictions as MlProjItem[]) {
              this.predMap.set(r.codigo, r.pred_final);
            }
          }
        },
        error: (e) => (this.mlMsg = e?.error?.detail ?? 'No se pudo ejecutar la proyección'),
        complete: () => (this.loading = false),
      });
  }

  runRiesgo(): void {
    if (!this.canRunML) {
      this.mlMsg = `Falta 'seccion_id' o ('curso' y 'seccion'). Usa Filtrar primero.`;
      return;
    }
    this.loading = true;
    this.mlMsg = '';
    this.api
      .mlRiesgo({
        seccionId: this.seccionId ?? undefined,
        curso: this.curso || undefined,
        seccion: this.seccionNombre || undefined,
      })
      .subscribe({
        next: (res: any) => {
          this.mlMsg = this.fmtML(res);
          this.mlRisk = res;
          this.riskMap.clear();
          if (Array.isArray(res?.predictions)) {
            for (const x of res.predictions as MlRiskItem[]) {
              this.riskMap.set(x.codigo, { p: x.risk_prob, clase: x.clase, umbral: x.umbral });
            }
          }
        },
        error: (e) => (this.mlMsg = e?.error?.detail ?? 'No se pudo ejecutar el riesgo'),
        complete: () => (this.loading = false),
      });
  }

  getPred(codigo: string): number | null {
    return this.predMap.has(codigo) ? (this.predMap.get(codigo) as number) : null;
  }
  getRisk(codigo: string): { p: number; clase: string; umbral: number } | null {
    return this.riskMap.has(codigo) ? (this.riskMap.get(codigo) as any) : null;
  }
  badgeClass(clase?: string): string {
    if (clase === 'ALTO') return 'badge bg-danger';
    if (clase === 'MEDIO') return 'badge bg-warning text-dark';
    if (clase === 'BAJO') return 'badge bg-success';
    return 'badge bg-secondary';
  }
  toPct(x: number) { return (x * 100).toFixed(1) + '%'; }

  private fmtML(res: any): string {
    try {
      if (!res) return 'Sin respuesta del modelo';
      const m = res.model || {};
      const type = m.type || 'modelo';
      const count = Array.isArray(res.predictions) ? res.predictions.length : 0;
      const parts: string[] = [`${type}`, `preds=${count}`];
      if (m.r2 != null) parts.push(`R2=${Number(m.r2).toFixed(3)}`);
      if (m.mae != null) parts.push(`MAE=${Number(m.mae).toFixed(3)}`);
      if (m.rmse != null) parts.push(`RMSE=${Number(m.rmse).toFixed(3)}`);
      if (m.accuracy != null) parts.push(`ACC=${Number(m.accuracy).toFixed(3)}`);
      if (m.n_train != null) parts.push(`n=${m.n_train}`);
      if (m.version) parts.push(`v=${m.version}`);
      return `OK ${parts.join(' | ')}`;
    } catch {
      return 'Resultado ML recibido';
    }
  }
}
