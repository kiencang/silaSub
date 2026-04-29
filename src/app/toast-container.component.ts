import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="pointer-events-auto flex items-center justify-between gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 text-white"
        [class.bg-red-600]="toast.type === 'error'"
        [class.bg-amber-500]="toast.type === 'warning'"
        [class.bg-emerald-500]="toast.type === 'success'"
      >
        <div class="flex items-center gap-3">
          @if (toast.type === 'success') {
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          } @else if (toast.type === 'error') {
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          } @else {
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          }
          <p class="text-sm font-medium leading-relaxed">{{ toast.message }}</p>
        </div>
        <button
          (click)="toastService.removeToast(toast.id)"
          class="text-white/70 hover:text-white transition-colors cursor-pointer p-1 shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
