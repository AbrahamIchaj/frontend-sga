import { Component } from '@angular/core';

import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isDark = false;

  toggleTheme() {
    this.isDark = !this.isDark;
  }
}
