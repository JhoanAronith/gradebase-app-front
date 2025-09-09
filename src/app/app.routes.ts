import { Routes } from '@angular/router';
import { Login } from './Componentes/login/login';
import { Register } from './Componentes/register/register';
import { RegisterGrades } from './Componentes/register-grades/register-grades';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'login', component: Login},
  {path: 'register', component: Register},
  {path: 'registerGrades', component: RegisterGrades}
];
