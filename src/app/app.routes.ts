import { Routes } from '@angular/router';
import { Login } from './Componentes/login/login';
import { Register } from './Componentes/register/register';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'login', component: Login},
  {path: 'register', component: Register}
];
