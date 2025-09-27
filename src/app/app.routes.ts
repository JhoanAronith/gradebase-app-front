import { Routes } from '@angular/router';
import { Login } from './Componentes/login/login';
import { Register } from './Componentes/register/register';
import { RegisterGrades } from './Componentes/register-grades/register-grades';
import { GradeReport } from './Componentes/grade-report/grade-report';
import { Index } from './Componentes/index';
import { authGuard } from './auth.guard'; 

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Index },
  { path: 'login', component: Login },
  { path: 'register', component: Register }, 
  { path: 'register-grades', component: RegisterGrades, canActivate: [authGuard] },
  { path: 'grade-report', component: GradeReport, canActivate: [authGuard] },
  { path: '**', redirectTo: 'inicio' } 
];
