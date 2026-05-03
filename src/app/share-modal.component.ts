import { Component, signal, inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from './app.state.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (appState.isShareModalOpen()) {
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        (click)="closeModal()"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative w-[90%] max-w-[420px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 fade-in duration-200"
      >
        <!-- Close Button -->
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
        >
          <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
        </button>

        <!-- Title -->
        <h2 class="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <mat-icon class="text-blue-400">share</mat-icon>
          <span>Chia sẻ sila<span class="text-red-400">Sub</span></span>
        </h2>

        <!-- Description -->
        <p class="text-[13px] text-slate-300 mb-6 leading-relaxed">
          silaSub là công cụ miễn phí, dựa trên gói miễn phí mà AI Studio cung cấp, đủ dịch khoảng 2 - 3 tiếng video / ngày bằng model AI Gemini mới nhất.
        </p>

        <!-- Link Container -->
        <div class="mb-5 bg-slate-800 rounded-xl p-1.5 flex items-center border border-slate-700 focus-within:border-slate-500 transition-colors">
          <input
            type="text"
            readonly
            [value]="displayLink"
            class="flex-1 bg-transparent text-sm text-slate-300 px-3 py-2 outline-none focus:outline-none cursor-text truncate font-mono"
            (click)="$event.target.select()"
          />
          <button
            (click)="copyLink()"
            class="ml-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shrink-0 min-w-[100px]"
            [class.bg-blue-600]="!isCopied()"
            [class.hover:bg-blue-500]="!isCopied()"
            [class.text-white]="!isCopied()"
            [class.bg-emerald-600]="isCopied()"
            [class.text-white]="isCopied()"
          >
            @if (isCopied()) {
              <mat-icon class="text-[16px] w-[16px] h-[16px]">check</mat-icon>
              <span>Đã copy!</span>
            } @else {
              <mat-icon class="text-[16px] w-[16px] h-[16px]">content_copy</mat-icon>
              <span>Copy link</span>
            }
          </button>
        </div>

        <!-- Footer Text -->
        <p class="text-[12px] text-slate-500 text-center font-medium">
          Bạn có thể copy đường dẫn chia sẻ cho người khác cùng dùng.
        </p>
      </div>
    </div>
    }
  `,
})
export class ShareModalComponent {
  appState = inject(AppStateService);

  readonly fullLink = 'https://aistudio.google.com/apps/b98324ac-cdef-4887-961c-dbcc2c50a6c7?showPreview=true&showAssistant=true&fullscreenApplet=true';
  readonly displayLink = 'https://aistudio.google.com/apps/b98324ac...';
  
  isCopied = signal(false);

  copyLink() {
    navigator.clipboard.writeText(this.fullLink).then(() => {
      this.isCopied.set(true);
      setTimeout(() => {
        this.isCopied.set(false);
      }, 2000);
    });
  }

  closeModal() {
    this.appState.isShareModalOpen.set(false);
    this.isCopied.set(false);
  }

  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.appState.isShareModalOpen()) {
      this.closeModal();
    }
  }
}
