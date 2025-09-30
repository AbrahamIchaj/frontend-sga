import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../shared/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDark = true;
  @Input() sidebarOpen = true;
  @Output() sidebarToggle = new EventEmitter<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.isDark = this.themeService.currentTheme === 'dark';

    this.themeService.themeChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.isDark = mode === 'dark';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    const mode = this.themeService.toggleTheme();
    this.isDark = mode === 'dark';
  }

  onToggleSidebar() {
    this.sidebarToggle.emit();
  }

  logout() {
    console.log('Cerrando sesión...');
    this.authService.logout();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }
}
