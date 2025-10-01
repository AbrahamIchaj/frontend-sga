import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../Dashboard/header/header.component';
import { SidebarComponent } from '../Dashboard/sidebar/sidebar.component';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  sidebarOpen = true;
  isDesktop = true;
  isSidebarHovering = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.evaluateViewport();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.evaluateViewport(true);
  }

  toggleSidebar(): void {
    this.isSidebarHovering = false;

    if (!this.isDesktop) {
      this.sidebarOpen = !this.sidebarOpen;
      return;
    }

    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (!this.isDesktop) {
      this.sidebarOpen = false;
    }
    this.isSidebarHovering = false;
  }

  handleSidebarNavigate(): void {
    if (!this.isDesktop) {
      this.sidebarOpen = false;
    }
    this.isSidebarHovering = false;
  }

  onSidebarMouseEnter(): void {
    if (this.isDesktop && !this.sidebarOpen) {
      this.isSidebarHovering = true;
    }
  }

  onSidebarMouseLeave(): void {
    if (this.isDesktop && !this.sidebarOpen) {
      this.isSidebarHovering = false;
    }
  }

  private evaluateViewport(fromResize = false): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isDesktop = true;
      this.sidebarOpen = true;
      this.isSidebarHovering = false;
      return;
    }

    const width = window.innerWidth;
    const wasDesktop = this.isDesktop;

    this.isDesktop = width >= 1024;

    if (this.isDesktop) {
      this.sidebarOpen = true;
      this.isSidebarHovering = false;
    } else if (wasDesktop && !this.isDesktop) {
      this.sidebarOpen = false;
      this.isSidebarHovering = false;
    }
  }
}
