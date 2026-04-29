import { Injectable, signal } from "@angular/core";

export type ToastType = "success" | "error" | "warning";

export interface ToastInfo {
  id: string;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastInfo[]>([]);

  addToast(message: string, type: ToastType = "error") {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts.update((current) => [...current, { id, message, type }]);
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
