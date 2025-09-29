import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  username = '';
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  password2 = '';
  loading = false;
  msg = '';

  constructor(private api: ApiService, private router: Router) {}

  submit() {
    this.msg = '';
    if (!this.username || !this.nombre || !this.apellido || !this.password || !this.password2) {
      this.msg = 'Completa los campos obligatorios.';
      return;
    }
    if (this.password !== this.password2) {
      this.msg = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.api.registerDocente({
      username: this.username.trim(),
      password: this.password,
      email: this.email.trim() || undefined,
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
    }).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Registro exitoso. Ya puedes iniciar sesión.';
        // Si quieres redirigir después de unos segundos:
        // setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (e: any) => {
        this.loading = false;
        this.msg =
          e?.error?.username?.[0] ||
          e?.error?.password?.[0] ||
          e?.error?.detail ||
          'No se pudo registrar.';
      }
    });
  }
}
