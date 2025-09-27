import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { API_CONFIG } from './api.config';

export interface NotaRow {
  id: number;
  estudiante: number;
  seccion: number;
  avance1: number | null;
  avance2: number | null;
  avance3: number | null;
  participacion: number | null;
  proyecto_final: number | null;
  nota_final: number | null;
  estudiante_codigo?: string;
  estudiante_nombre?: string;
  seccion_nombre?: string;
  curso_codigo?: string;
}

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
    return map((r: any) => (Array.isArray(r) ? (r as T[]) : (r?.results ?? [])));
  }

  // ----------------- auth / registro -----------------
  /** Registro público de DOCENTE */
  registerDocente(payload: {
    username: string;
    password: string;
    email?: string;
    nombre: string;
    apellido: string;
  }) {
    return this.http.post<{ message: string; username: string }>(
      `${this.base}/auth/register/`,
      payload
    );
  }

  // ----------------- catálogos -----------------
  secciones() {
    return this.http
      .get<any>(`${this.base}/secciones/`, { params: this.toParams({ page_size: 1000 }) })
      .pipe(this.unwrapArray());
  }

  estudiantes(seccionId: number) {
    return this.http
      .get<any>(`${this.base}/estudiantes/`, {
        params: this.toParams({ seccion: seccionId, page_size: 1000 }),
      })
      .pipe(this.unwrapArray());
  }

  // ----------------- notas -----------------
  notas(q: { curso?: string; seccionId?: number; codigo?: string; page?: number; page_size?: number } = {}) {
    const params = this.toParams({
      'seccion__curso__codigo': q.curso,
      'seccion': q.seccionId,
      'estudiante__codigo': q.codigo,
      page: q.page ?? 1,
      page_size: q.page_size ?? 1000,
    });
    return this.http.get<any>(`${this.base}/notas/`, { params });
  }

  crearNota(dto: {
    seccionId: number;
    estudianteId: number;
    av1?: number | string;
    av2?: number | string;
    av3?: number | string;
    participacion?: number | string;
    proyecto?: number | string;
    final?: number | string;
  }) {
    const payload: any = {
      seccion: dto.seccionId,
      estudiante: dto.estudianteId,
      avance1: dto.av1 === '' ? null : Number(dto.av1),
      avance2: dto.av2 === '' ? null : Number(dto.av2),
      avance3: dto.av3 === '' ? null : Number(dto.av3),
      participacion: dto.participacion === '' ? null : Number(dto.participacion),
      proyecto_final: dto.proyecto === '' ? null : Number(dto.proyecto),
      nota_final: dto.final === '' ? null : Number(dto.final),
    };
    Object.keys(payload).forEach(
      (k) => (payload[k] === null || payload[k] === undefined) && delete payload[k]
    );
    return this.http.post<NotaRow>(`${this.base}/notas/`, payload);
  }

  actualizarNota(
    id: number,
    dto: {
      av1?: number | string;
      av2?: number | string;
      av3?: number | string;
      participacion?: number | string;
      proyecto?: number | string;
      final?: number | string;
    }
  ) {
    const payload: any = {
      avance1: dto.av1 === '' ? null : dto.av1 !== undefined ? Number(dto.av1) : undefined,
      avance2: dto.av2 === '' ? null : dto.av2 !== undefined ? Number(dto.av2) : undefined,
      avance3: dto.av3 === '' ? null : dto.av3 !== undefined ? Number(dto.av3) : undefined,
      participacion:
        dto.participacion === '' ? null : dto.participacion !== undefined ? Number(dto.participacion) : undefined,
      proyecto_final:
        dto.proyecto === '' ? null : dto.proyecto !== undefined ? Number(dto.proyecto) : undefined,
      nota_final: dto.final === '' ? null : dto.final !== undefined ? Number(dto.final) : undefined,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return this.http.put<NotaRow>(`${this.base}/notas/${id}/`, payload);
  }

  eliminarNota(id: number) {
    return this.http.delete<void>(`${this.base}/notas/${id}/`);
  }

  // ----------------- export -----------------
  exportar(format: 'csv' | 'xlsx' | 'pdf', q: { curso?: string; seccion?: string; codigo?: string }) {
    const path = format === 'csv' ? 'export/csv' : format === 'xlsx' ? 'export/xlsx' : 'export/pdf';
    return this.http.get(`${this.base}/notas/${path}/`, {
      params: this.toParams({ curso: q.curso, seccion: q.seccion, codigo: q.codigo }),
      responseType: 'blob',
    });
  }

  // ----------------- ML -----------------
  mlProyeccion(payload: { curso?: string; seccion?: string; seccion_id?: number }) {
    return this.http.post(`${this.base}/notas/ml/proyeccion/`, payload);
  }
  mlRiesgo(payload: { curso?: string; seccion?: string; seccion_id?: number }) {
    return this.http.post(`${this.base}/notas/ml/riesgo/`, payload);
  }
}
