import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  // formulario
  username = '';
  email = '';
  nombre = '';
  apellido = '';
  password = '';
  password2 = '';

  loading = false;
  msg = '';

  constructor(private api: ApiService, private router: Router) {}

  submit() {
    this.msg = '';
    if (this.password !== this.password2) {
      this.msg = 'Las contraseñas no coinciden.';
      return;
    }
    this.loading = true;
    this.api
      .registerDocente({
        username: this.username.trim(),
        password: this.password,
        email: this.email?.trim() || undefined,
        nombre: this.nombre.trim(),
        apellido: this.apellido.trim(),
      })
      .subscribe({
        next: () => {
          this.loading = false;
          // redirige a login después de registrar
          this.router.navigateByUrl('/login');
        },
        error: (e: any) => {
          this.loading = false;
          this.msg =
            e?.error?.username?.[0] ||
            e?.error?.detail ||
            e?.error?.message ||
            'No se pudo registrar.';
        },
      });
  }
}
