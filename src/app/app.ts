import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavBar } from './Componentes/nav-bar/nav-bar';
import { NavBarGrades } from './Componentes/nav-bar-grades/nav-bar-grades';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, NavBarGrades],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('gradebase-app');

  showNavBar = false;
  showNavBarGrades = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        if (
          currentUrl.startsWith('/grade-report') ||
          currentUrl.startsWith('/register-grades')
        ) {
          this.showNavBarGrades = true;
          this.showNavBar = false;
        } else if (
          currentUrl.startsWith('/inicio') ||
          currentUrl.startsWith('/login') ||
          currentUrl === '/register'
        ) {
          this.showNavBar = true;
          this.showNavBarGrades = false;
        } else {
          this.showNavBar = false;
          this.showNavBarGrades = false;
        }
      });
  }
}
