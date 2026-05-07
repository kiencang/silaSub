import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="pointer-events-auto flex items-center justify-between gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl transition-all duration-300 text-white animate-in slide-in-from-right-5 fade-in"
        [class.bg-red-600]="toast.type === 'error'"
        [class.bg-amber-500]="toast.type === 'warning'"
        [class.bg-emerald-500]="toast.type === 'success'"
      >
        <div class="flex items-center gap-3">
          @if (toast.type === 'success') {
          <mat-icon class="text-[20px] w-[20px] h-[20px] shrink-0">check_circle</mat-icon>
          } @else if (toast.type === 'error') {
          <mat-icon class="text-[20px] w-[20px] h-[20px] shrink-0">error_outline</mat-icon>
          } @else {
          <mat-icon class="text-[20px] w-[20px] h-[20px] shrink-0">warning_amber</mat-icon>
          }
          <p class="text-sm font-medium leading-relaxed">{{ toast.message }}</p>
        </div>
        <button
          (click)="toastService.removeToast(toast.id)"
          class="text-white/70 hover:text-white transition-colors cursor-pointer p-1 shrink-0"
        >
          <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
        </button>
      </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
