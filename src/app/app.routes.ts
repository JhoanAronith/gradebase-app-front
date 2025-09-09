import { Routes } from '@angular/router';
import { Login } from './Componentes/login/login';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'login', component: Login}
];
