import { Injectable, signal, inject } from "@angular/core";
import { StorageService } from "./storage.service";
import { ToastService } from "./toast.service";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  isOpen = signal<boolean>(false);
  subFontSize = signal<number>(20);
  subFontFamily = signal<string>("Lexend");
  subTextColor = signal<string>("#FFD700");
  subBgOpacity = signal<number>(0.5);
  subVerticalOffset = signal<number>(2); // 2rem default

  private backupSettings = {
    size: 20,
    font: "Lexend",
    color: "#FFD700",
    opacity: 0.5,
    offset: 2,
  };

  loadSettings() {
    const parsed = this.storageService.loadSettings();
    if (parsed) {
      if (parsed.size) this.subFontSize.set(parsed.size);
      if (parsed.font) this.subFontFamily.set(parsed.font);
      if (parsed.color) this.subTextColor.set(parsed.color);
      if (parsed.opacity !== undefined) this.subBgOpacity.set(parsed.opacity);
      if (parsed.offset !== undefined) this.subVerticalOffset.set(parsed.offset);
    }
  }

  openSettings() {
    this.backupSettings = {
      size: this.subFontSize(),
      font: this.subFontFamily(),
      color: this.subTextColor(),
      opacity: this.subBgOpacity(),
      offset: this.subVerticalOffset(),
    };
  }

  saveSettings() {
    this.storageService.saveSettings({
      size: this.subFontSize(),
      font: this.subFontFamily(),
      color: this.subTextColor(),
      opacity: this.subBgOpacity(),
      offset: this.subVerticalOffset(),
    });
    this.toastService.addToast("Lưu cài đặt thành công!", "success");
  }

  resetSettings() {
    this.subFontSize.set(20);
    this.subFontFamily.set("Lexend");
    this.subTextColor.set("#FFD700");
    this.subBgOpacity.set(0.5);
    this.subVerticalOffset.set(2);
    
    this.storageService.removeSettings();
    this.toastService.addToast("Đã khôi phục cài đặt gốc", "success");
  }

  cancelSettings() {
    this.subFontSize.set(this.backupSettings.size);
    this.subFontFamily.set(this.backupSettings.font);
    this.subTextColor.set(this.backupSettings.color);
    this.subBgOpacity.set(this.backupSettings.opacity);
    this.subVerticalOffset.set(this.backupSettings.offset);
  }

  getFontFamily(fontName: string): string {
    switch (fontName) {
      case "Roboto":
        return '"Roboto", sans-serif';
      case "Montserrat":
        return '"Montserrat", sans-serif';
      case "Playfair Display":
        return '"Playfair Display", serif';
      case "Be Vietnam Pro":
        return '"Be Vietnam Pro", sans-serif';
      case "Inter":
        return '"Inter", sans-serif';
      case "Lexend":
        return '"Lexend", sans-serif';
      default:
        return '"Lexend", sans-serif';
    }
  }
}
