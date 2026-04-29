import { Injectable, PLATFORM_ID, inject, signal } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { ToastService } from "./toast.service";

export const SETTINGS_STORAGE_KEY = "silaSub_v1_prefs_8f9a2b";
export const FAVORITES_STORAGE_KEY = "silaSub_favorite_channels_v1";

export interface AppSettings {
  size: number;
  font: string;
  color: string;
  opacity: number;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private platformId = inject(PLATFORM_ID);
  private toastService = inject(ToastService);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Favorite Channels State
  favoriteChannels = signal<string[]>([]);
  dialogChannels = signal<string[]>([]);
  showFavoritesDialog = signal(false);

  constructor() {
    if (this.isBrowser) {
      this.loadFavorites();
    }
  }

  // Settings methods
  saveSettings(settings: AppSettings): boolean {
    if (!this.isBrowser) return false;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch {
      return false;
    }
  }

  loadSettings(): AppSettings | null {
    if (!this.isBrowser) return null;
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  }

  removeSettings(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  saveFavorites(favorites: string[]): boolean {
    if (!this.isBrowser) return false;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch {
      return false;
    }
  }

  loadFavorites(): string[] {
    if (!this.isBrowser) return [];
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.favoriteChannels.set(parsed);
          return parsed;
        }
      }
    } catch {
      return [];
    }
    return [];
  }

  openFavoritesDialog() {
    const current = this.favoriteChannels();
    if (current.length === 0) {
      this.dialogChannels.set(["", "", ""]);
    } else {
      this.dialogChannels.set([...current]);
    }
    this.showFavoritesDialog.set(true);
  }

  saveFavoritesList() {
    const toSave = this.dialogChannels().map(s => s.trim()).filter(s => s !== "");
    this.favoriteChannels.set(toSave);
    if (this.saveFavorites(toSave)) {
      this.toastService.addToast("Đã lưu kênh ưa thích", "success");
    } else {
      this.toastService.addToast("Lỗi khi lưu cài đặt", "error");
    }
    this.showFavoritesDialog.set(false);
  }

  closeFavoritesDialog() {
    this.showFavoritesDialog.set(false);
  }

  addDialogChannel() {
    if (this.dialogChannels().length < 10) {
      this.dialogChannels.update(c => [...c, ""]);
    }
  }

  removeDialogChannel(index: number) {
    if (this.dialogChannels().length === 1) {
       this.dialogChannels.update(c => {
         const newC = [...c];
         newC[0] = "";
         return newC;
       });
    } else {
       this.dialogChannels.update(c => c.filter((_, i) => i !== index));
    }
  }

  updateDialogChannel(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.dialogChannels.update(c => {
      const newC = [...c];
      newC[index] = input.value;
      return newC;
    });
  }
}

