import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getItem<T = any>(key: string): T | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.warn(`StorageService.getItem(${key}) error:`, err);
      return null;
    }
  }

  getRawItem(key: string): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn(`StorageService.getRawItem(${key}) error:`, err);
      return null;
    }
  }

  setItem(key: string, value: any): void {
    if (!this.isBrowser()) return;
    try {
      const raw = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, raw);
    } catch (err) {
      console.warn(`StorageService.setItem(${key}) error:`, err);
    }
  }

  removeItem(key: string): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`StorageService.removeItem(${key}) error:`, err);
    }
  }

  clear(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.clear();
    } catch (err) {
      console.warn('StorageService.clear() error:', err);
    }
  }

  hasItem(key: string): boolean {
    if (!this.isBrowser()) return false;
    try {
      return localStorage.getItem(key) !== null;
    } catch (err) {
      console.warn(`StorageService.hasItem(${key}) error:`, err);
      return false;
    }
  }
}
