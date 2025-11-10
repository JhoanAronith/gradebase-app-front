import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface CursoApi {
  id: number;
  codigo: string;
  nombre?: string;
}

export interface SeccionApi {
  id: number;
  nombre: string;
  curso: number | CursoApi;
  curso_codigo?: string;
}

export interface EstudianteApi {
  id: number;
  codigo: string;
  nombre?: string;
  apellido?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
}

export interface NotaApi {
  id: number;
  estudiante: number;
  seccion: number;
  avance1?: number | null;
  avance2?: number | null;
  avance3?: number | null;
  participacion?: number | null;
  proyecto_final?: number | null;
  nota_final?: number | null;

  estudiante_codigo?: string;
  estudiante_nombre?: string;
  seccion_nombre?: string;
  curso_codigo?: string;

  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  part?: number | null;
  proy?: number | null;
  final?: number | null;
}

export interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface NotasFilter {
  curso?: string;                 // mapea a seccion__curso__codigo (para listar)
  seccion?: string | number;      // acepta id (número) o nombre de sección (string)
  codigo?: string;                // estudiante__codigo (para listar)
  page?: number;
  page_size?: number;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  // ============== Helpers ==============
  private getToken(): string | null {
    return (
      localStorage.getItem('access') ||
      localStorage.getItem('token') ||
      null
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    let h = new HttpHeaders();
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  private toParams(obj: Record<string, any>): HttpParams {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return p;
  }

  private unwrapList<T>() {
    return map((r: any) => (Array.isArray(r) ? (r as T[]) : (r?.results ?? [])));
  }

  // ============== Catálogos ==============

  cursos(page_size = 1000): Observable<CursoApi[]> {
    const params = this.toParams({ page_size });
    return this.http
      .get<any>(`${this.baseUrl}/cursos/`, { params, headers: this.authHeaders() })
      .pipe(this.unwrapList<CursoApi>());
  }

  secciones(opts: { page_size?: number; page?: number } = {}): Observable<SeccionApi[]> {
    const params = this.toParams({ page_size: opts.page_size ?? 1000, page: opts.page });
    return this.http
      .get<any>(`${this.baseUrl}/secciones/`, { params, headers: this.authHeaders() })
      .pipe(this.unwrapList<SeccionApi>());
  }

  estudiantes(seccionId?: number, page_size = 1000): Observable<EstudianteApi[]> {
    const params = this.toParams({ seccion: seccionId, page_size });
    return this.http
      .get<any>(`${this.baseUrl}/estudiantes/`, { params, headers: this.authHeaders() })
      .pipe(this.unwrapList<EstudianteApi>());
  }

  // ============== Notas ==============

  notas(filter: NotasFilter = {}): Observable<Paged<NotaApi>> {
    const paramsObj: Record<string, any> = {
      page: filter.page,
      page_size: filter.page_size,
      'seccion__curso__codigo': filter.curso,
      'estudiante__codigo': filter.codigo,
    };

    if (filter.seccion !== undefined && filter.seccion !== null && filter.seccion !== '') {
      if (typeof filter.seccion === 'number') {
        paramsObj['seccion'] = filter.seccion; // filtra por id (válido para listar)
      } else {
        paramsObj['seccion__nombre'] = filter.seccion; // filtra por nombre
      }
    }

    const params = this.toParams(paramsObj);
    return this.http.get<Paged<NotaApi>>(`${this.baseUrl}/notas/`, {
      params,
      headers: this.authHeaders(),
    });
  }

  crearNota(dto: {
    seccion: number;
    estudiante: number;
    avance1?: number | null;
    avance2?: number | null;
    avance3?: number | null;
    participacion?: number | null;
    proyecto_final?: number | null;
    nota_final?: number | null;
  }): Observable<NotaApi> {
    return this.http.post<NotaApi>(`${this.baseUrl}/notas/`, dto, {
      headers: this.authHeaders(),
    });
  }

  actualizarNota(
    id: number,
    dto: {
      seccion: number;
      estudiante: number;
      avance1?: number | null;
      avance2?: number | null;
      avance3?: number | null;
      participacion?: number | null;
      proyecto_final?: number | null;
      nota_final?: number | null;
    }
  ): Observable<NotaApi> {
    return this.http.put<NotaApi>(`${this.baseUrl}/notas/${id}/`, dto, {
      headers: this.authHeaders(),
    });
  }

  eliminarNota(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notas/${id}/`, {
      headers: this.authHeaders(),
    });
  }

  // ============== Exportaciones ==============
  /**
   * IMPORTANTE:
   *  - Backend espera params: curso, seccion (NOMBRE), codigo
   *  - No enviar IDs ni nombres con claves de filtro DRF aquí.
   */
  exportNotas(format: ExportFormat, q: { curso?: string; seccion?: string; codigo?: string }): Observable<Blob> {
    const path = format === 'csv' ? 'export/csv' : format === 'xlsx' ? 'export/xlsx' : 'export/pdf';

    const params = this.toParams({
      curso: q.curso,    // seccion__curso__codigo en backend
      seccion: q.seccion, // nombre de la sección (p.ej. "22" o "A")
      codigo: q.codigo,  // estudiante__codigo
    });

    return this.http.get(`${this.baseUrl}/notas/${path}/`, {
      params,
      headers: this.authHeaders(),
      responseType: 'blob',
    });
  }

  // ============== ML ==============
  mlProyeccion(payload: { seccionId?: number; curso?: string; seccion?: string }) {
    const body =
      payload.seccionId != null
        ? { seccion_id: payload.seccionId }
        : { curso: payload.curso, seccion: payload.seccion };
    return this.http.post(`${this.baseUrl}/notas/ml/proyeccion/`, body, {
      headers: this.authHeaders(),
    });
  }

  mlRiesgo(payload: { seccionId?: number; curso?: string; seccion?: string }) {
    const body =
      payload.seccionId != null
        ? { seccion_id: payload.seccionId }
        : { curso: payload.curso, seccion: payload.seccion };
    return this.http.post(`${this.baseUrl}/notas/ml/riesgo/`, body, {
      headers: this.authHeaders(),
    });
  }

  registerDocente(data: {
    username: string;
    password: string;
    email: string;
    first_name?: string;
    last_name?: string;
    nombres?: string;
    apellidos?: string;
  }) {
    const payload = {
      username: data.username,
      password: data.password,
      email: data.email,
      first_name: data.first_name ?? data.nombres ?? '',
      last_name: data.last_name ?? data.apellidos ?? '',
    };
    return this.http.post(`${this.baseUrl}/auth/register/`, payload);
  }
}
