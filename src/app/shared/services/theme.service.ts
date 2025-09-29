import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'sga-theme-mode';
  private readonly renderer: Renderer2;
  private readonly isBrowser: boolean;
  private readonly themeSubject = new BehaviorSubject<ThemeMode>('dark');

  readonly themeChanges$: Observable<ThemeMode> = this.themeSubject.asObservable();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.isBrowser = isPlatformBrowser(this.platformId);

    const initialTheme = this.resolveInitialMode();
    this.applyTheme(initialTheme, false);
  }

  get currentTheme(): ThemeMode {
    return this.themeSubject.getValue();
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
  }

  toggleTheme(): ThemeMode {
    const nextMode: ThemeMode = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextMode);
    return nextMode;
  }

  private resolveInitialMode(): ThemeMode {
    if (!this.isBrowser) {
      return 'dark';
    }

    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark';
  }

  private applyTheme(mode: ThemeMode, persist = true): void {
    const body = this.document?.body;
    if (!body) {
      this.themeSubject.next(mode);
      return;
    }
    const targetClass = mode === 'dark' ? 'theme-dark' : 'theme-light';
    const oppositeClass = mode === 'dark' ? 'theme-light' : 'theme-dark';

    this.renderer.removeClass(body, oppositeClass);
    this.renderer.addClass(body, targetClass);

    this.themeSubject.next(mode);

    if (this.isBrowser && persist) {
      localStorage.setItem(this.storageKey, mode);
    }
  }
}
