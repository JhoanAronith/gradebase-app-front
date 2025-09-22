import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-bar-grades',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar-grades.html',
  styleUrls: ['./nav-bar-grades.css']
})
export class NavBarGrades {

}
