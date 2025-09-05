import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SIDEBAR_ROUTES } from './sidebar-routes.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  routes = SIDEBAR_ROUTES;
}
