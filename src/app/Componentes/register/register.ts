import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
})
export class Register {
  username = '';
  password = '';
  password2 = '';
  nombre = '';
  apellido = '';
  email = '';

  loading = false;
  msg = '';

  constructor(private api: ApiService) {}

  submit() {
    this.msg = '';
    if (this.password !== this.password2) {
      this.msg = 'Las contraseñas no coinciden';
      return;
    }
    this.loading = true;
    this.api.registerDocente({
      username: this.username,
      password: this.password,
      first_name: this.nombre,
      last_name: this.apellido,
      email: this.email,
    }).subscribe({
      next: () => {
        this.msg = 'Usuario registrado correctamente';
        this.loading = false;
      },
      error: (e: any) => {
        this.msg = e?.error?.detail || 'No se pudo registrar';
        this.loading = false;
      },
    });
  }
}
