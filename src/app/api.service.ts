import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { API_CONFIG } from './api.config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  // ----------------- helpers -----------------
  private toParams(obj: Record<string, string | number | boolean | undefined | null>) {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  private unwrapArray<T = any>() {
    // DRF: puede venir {results: []} o []
    return map((r: any) => (Array.isArray(r) ? (r as T[]) : (r?.results ?? [])));
  }

  // ----------------- catálogos -----------------
  secciones(page_size = 1000) {
    const params = this.toParams({ page_size });
    return this.http.get<any[]>(`${this.base}/secciones/`, { params }).pipe(this.unwrapArray());
  }

  estudiantes(seccionId?: number, page_size = 1000) {
    const params = this.toParams({ seccion: seccionId, page_size });
    return this.http.get<any[]>(`${this.base}/estudiantes/`, { params }).pipe(this.unwrapArray());
  }

  // ----------------- notas (listado) -----------------
  notas(q: { curso?: string; seccionId?: number; codigo?: string; page?: number; page_size?: number } = {}) {
    const params = this.toParams({
      seccion: q.seccionId,
      'seccion__curso__codigo': q.curso,
      'estudiante__codigo': q.codigo,
      page: q.page,
      page_size: q.page_size ?? 1000
    });
    return this.http.get<{ count: number; next: string | null; previous: string | null; results: any[] }>(
      `${this.base}/notas/`, { params }
    );
  }

  // -------- mapeo DTO front -> payload backend --------
  private mapNotaPayload(d: {
    seccionId?: number;
    estudianteId?: number;
    av1?: number | null;
    av2?: number | null;
    av3?: number | null;
    participacion?: number | null;
    proyecto?: number | null;
    final?: number | null;
  }) {
    const p: any = {};
    const add = (k: string, v: any) => { if (v !== undefined && v !== null) p[k] = v; };

    if (d.seccionId !== undefined) p.seccion = d.seccionId;
    if (d.estudianteId !== undefined) p.estudiante = d.estudianteId;

    add('avance1', d.av1);
    add('avance2', d.av2);
    add('avance3', d.av3);
    add('participacion', d.participacion);
    add('proyecto_final', d.proyecto);
    add('nota_final', d.final);

    return p;
  }

  // ----------------- notas CRUD -----------------
  crearNota(d: {
    seccionId: number;
    estudianteId: number;
    av1?: number | null;
    av2?: number | null;
    av3?: number | null;
    participacion?: number | null;
    proyecto?: number | null;
    final?: number | null;
  }) {
    const payload = this.mapNotaPayload(d);
    return this.http.post<any>(`${this.base}/notas/`, payload);
  }

  // Usar PATCH para actualización parcial
  actualizarNota(id: number, d: {
    seccionId?: number;
    estudianteId?: number;
    av1?: number | null;
    av2?: number | null;
    av3?: number | null;
    participacion?: number | null;
    proyecto?: number | null;
    final?: number | null;
  }) {
    const payload = this.mapNotaPayload(d);
    return this.http.patch<any>(`${this.base}/notas/${id}/`, payload);
  }

  eliminarNota(id: number) {
    return this.http.delete<void>(`${this.base}/notas/${id}/`);
  }

  // ----------------- exportaciones -----------------
  exportNotas(format: 'csv' | 'xlsx' | 'pdf', q: { curso?: string; seccion?: string; codigo?: string }) {
    const path = format === 'csv' ? 'export/csv' : format === 'xlsx' ? 'export/xlsx' : 'export/pdf';
    const params = this.toParams({ curso: q.curso, seccion: q.seccion, codigo: q.codigo });
    return this.http.get(`${this.base}/notas/${path}/`, { params, responseType: 'blob' });
  }

  // Alias para compatibilidad con el componente
  exportar(format: 'csv' | 'xlsx' | 'pdf', q: { curso?: string; seccion?: string; codigo?: string }) {
    return this.exportNotas(format, q);
  }

  // ----------------- ML opcional -----------------
  mlProyeccion(payload: { curso?: string; seccion?: string; seccion_id?: number }) {
    return this.http.post<any>(`${this.base}/notas/ml/proyeccion/`, payload);
  }

  mlRiesgo(payload: { curso?: string; seccion?: string; seccion_id?: number }) {
    return this.http.post<any>(`${this.base}/notas/ml/riesgo/`, payload);
  }

  // ----------------- registro de docente -----------------
  registerDocente(payload: {
    username: string;
    password: string;
    email?: string;
    nombre: string;
    apellido: string;
  }) {
    // endpoint: /api/auth/register/
    return this.http.post<{ message: string; username: string }>(`${this.base}/auth/register/`, payload);
  }
}
