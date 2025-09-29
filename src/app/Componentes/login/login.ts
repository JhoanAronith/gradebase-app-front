import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  username: string = '';
  password: string = '';
  loading = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.errorMsg = '';
    if (!this.username || !this.password) return;

    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/register-grades']); 
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Credenciales inválidas';
      }
    });
  }
}
