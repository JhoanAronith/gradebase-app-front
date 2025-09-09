import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  //Conexion con la API
  username = '';
  password = '';
  error = '';
  apiBase = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient, private router: Router) {}

  //Metodo para enviar el formulario
  onSubmit() {
    this.error = '';
    this.http
      .post<{ access: string; refresh: string }>(`${this.apiBase}/api/token/`, {
        username: this.username,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
          this.router.navigate(['/notas']);
        },
        error: () => (this.error = 'Usuario o clave incorrectos'),
      });
  }
}
