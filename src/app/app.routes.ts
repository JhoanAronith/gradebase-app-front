import { Routes } from '@angular/router';
import { Login } from './Componentes/login/login';
import { Register } from './Componentes/register/register';
import { RegisterGrades } from './Componentes/register-grades/register-grades';
import { GradeReport } from './Componentes/grade-report/grade-report';
import { Index } from './Componentes/index';

export const routes: Routes = [
  {path: '', redirectTo: 'inicio', pathMatch: 'full'},
  {path: 'inicio', component: Index},
  {path: 'login', component: Login},
  {path: 'register', component: Register},
  {path: 'register-grades', component: RegisterGrades},
  {path: 'grade-report', component: GradeReport}
];
