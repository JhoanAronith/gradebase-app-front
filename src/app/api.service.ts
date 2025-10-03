import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

export interface NotasFilter {
  curso?: string; 
  seccion?: string | number; 
  codigo?: string;    
  page?: number;
  page_size?: number;
  seccionId?: number;      
}

export interface CrearNotaInput {
  seccionId: number;
  estudianteId: number;
  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  participacion?: number | null;
  proyecto?: number | null;
  final?: number | null;
}

export interface ActualizarNotaInput {
  seccionId?: number;
  estudianteId?: number;
  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  participacion?: number | null;
  proyecto?: number | null;
  final?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Ajusta esta base si tu API usa otra URL
  readonly baseUrl = 'http://localhost:8000/api';
  private readonly tokenKey = 'access_token';

  constructor(private http: HttpClient) {}

  // ========== Auth helpers ==========
  setToken(token: string) { localStorage.setItem(this.tokenKey, token); }
  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  private authHeaders(): { headers: HttpHeaders } {
    const t = this.getToken();
    const headers = t
      ? new HttpHeaders({ Authorization: `Bearer ${t}` })
      : new HttpHeaders();
    return { headers };
  }

  // ========== Catálogos ==========
  secciones(params?: { page_size?: number; page?: number }) {
    let httpParams = new HttpParams();
    if (params?.page_size) httpParams = httpParams.set('page_size', String(params.page_size));
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    return this.http.get(`${this.baseUrl}/secciones/`, {
      params: httpParams,
      ...this.authHeaders(),
    });
  }

  estudiantes(seccionId: number, page_size = 1000) {
    const params = new HttpParams()
      .set('seccion', String(seccionId))
      .set('page_size', String(page_size));
    return this.http.get(`${this.baseUrl}/estudiantes/`, {
      params,
      ...this.authHeaders(),
    });
  }

  estudiantesFiltro(params: any) {
    let p = new HttpParams();
    Object.keys(params || {}).forEach((k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get(`${this.baseUrl}/estudiantes/`, {
      params: p,
      ...this.authHeaders(),
    });
  }

  // ========== Reporte de notas ==========
  notas(filters: NotasFilter) {
    let params = new HttpParams();

    if (filters.curso) params = params.set('seccion__curso__codigo', filters.curso);

    const sec = filters.seccion ?? filters.seccionId;
    if (typeof sec === 'number') {
      params = params.set('seccion', String(sec));
    } else if (typeof sec === 'string' && sec.trim()) {
      params = params.set('seccion__nombre', sec.trim());
    }

    if (filters.codigo) params = params.set('estudiante__codigo', filters.codigo);
    if (filters.page) params = params.set('page', String(filters.page));
    params = params.set('page_size', String(filters.page_size ?? 1000));

    return this.http.get(`${this.baseUrl}/notas/`, {
      params,
      ...this.authHeaders(),
    });
  }

  // Exportación (DEVUELVE Blob)
  exportNotas(format: 'csv' | 'xlsx' | 'pdf', filters: NotasFilter) {
    let query = new HttpParams();
    if (filters.curso) query = query.set('seccion__curso__codigo', filters.curso);

    const sec = filters.seccion ?? filters.seccionId;
    if (typeof sec === 'number') {
      query = query.set('seccion', String(sec));
    } else if (typeof sec === 'string' && sec.trim()) {
      query = query.set('seccion__nombre', sec.trim());
    }

    if (filters.codigo) query = query.set('estudiante__codigo', filters.codigo);
    if (filters.page) query = query.set('page', String(filters.page));
    query = query.set('page_size', String(filters.page_size ?? 1000));

    return this.http.get(`${this.baseUrl}/notas/export/${format}/`, {
      params: query,
      responseType: 'blob',
      ...this.authHeaders(),
    });
  }

  // ========== CRUD de notas ==========
  private mapNotaPayload(input: Partial<CrearNotaInput | ActualizarNotaInput>) {
    const body: any = {};
    if (input.seccionId !== undefined) body.seccion = input.seccionId;
    if (input.estudianteId !== undefined) body.estudiante = input.estudianteId;
    if (input.av1 !== undefined) body.avance1 = input.av1;
    if (input.av2 !== undefined) body.avance2 = input.av2;
    if (input.av3 !== undefined) body.avance3 = input.av3;
    if (input.participacion !== undefined) body.participacion = input.participacion;
    if (input.proyecto !== undefined) body.proyecto_final = input.proyecto;
    if (input.final !== undefined) body.nota_final = input.final;
    return body;
  }

  crearNota(input: CrearNotaInput) {
    const body = this.mapNotaPayload(input);
    return this.http.post(`${this.baseUrl}/notas/`, body, this.authHeaders());
  }

  actualizarNota(id: number, input: ActualizarNotaInput) {
    const body = this.mapNotaPayload(input);
    return this.http.put(`${this.baseUrl}/notas/${id}/`, body, this.authHeaders());
  }

  eliminarNota(id: number) {
    return this.http.delete(`${this.baseUrl}/notas/${id}/`, this.authHeaders());
  }

  // ========== ML ==========
  mlProyeccion(payload: { curso?: string; seccion?: string }) {
    return this.http.post(`${this.baseUrl}/notas/ml/proyeccion/`, payload, this.authHeaders());
  }

  mlRiesgo(payload: { curso?: string; seccion?: string }) {
    return this.http.post(`${this.baseUrl}/notas/ml/riesgo/`, payload, this.authHeaders());
  }

  // ========== Registro de docente ==========
  registerDocente(body: {
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  }) {
    return this.http.post(`${this.baseUrl}/auth/register/`, body, this.authHeaders());
  }
}