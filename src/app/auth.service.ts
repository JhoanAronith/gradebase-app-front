import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { API_CONFIG } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'gb_token';

  constructor(private http: HttpClient) {}

  // Login → obtiene access/refresh token del backend
  login(username: string, password: string) {
    return this.http.post<{ access: string; refresh: string }>(
      `${API_CONFIG.baseUrl}/token/`,
      { username, password }
    ).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.access);
        localStorage.setItem('gb_refresh', res.refresh);
      })
    );
  }

  // Obtener el access token actual
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Logout → limpia storage
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('gb_refresh');
  }

  // Saber si hay token válido
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}