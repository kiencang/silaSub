import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StorageService } from './storage.service';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (storageService.showApiKeyDialog()) {
    <div class="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <div
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer transition-opacity"
        (click)="storageService.closeApiKeyDialog()" (keyup.enter)="storageService.closeApiKeyDialog()" tabindex="0"
      ></div>

      <div
        class="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg mx-4 relative flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-700/80 flex justify-between items-center bg-slate-800/40">
          <div class="flex items-center gap-2 text-white">
            <mat-icon class="text-xl w-5 h-5 flex items-center justify-center">key</mat-icon>
            <h3 class="text-base font-bold select-none tracking-tight">Cấu hình Gemini API Key</h3>
          </div>
          <button
            (click)="storageService.closeApiKeyDialog()"
            class="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 flex flex-col gap-5">
          <p class="text-slate-300 text-sm leading-relaxed">
            Thêm khóa API (Gemini API Key) của cá nhân bạn, để việc dịch được ổn định, không lo hết giới hạn lượt dịch từ hệ thống chung. Bạn có thể tạo khóa API miễn phí từ trang AI Studio (xem phần "Hướng dẫn nhanh").
          </p>

          <!-- Badges & Guide -->
          <div class="flex items-center flex-wrap gap-2 text-xs">
            @if (storageService.userApiKey()) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Đang dùng API Key của bạn
              </span>
            } @else {
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Chưa cấu hình API Key cá nhân
              </span>
            }

            <span class="text-slate-600 select-none mx-1">|</span>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
            >
              <mat-icon class="text-[14px] w-3.5 h-3.5 flex items-center justify-center">help_outline</mat-icon>
              Hướng dẫn nhanh
            </a>
          </div>

          <!-- Input Area -->
          <div class="flex flex-col gap-2">
            <span class="block text-[11px] font-bold text-slate-400 tracking-wider uppercase select-none">
              GEMINI API KEY CÁ NHÂN
            </span>
            <div class="relative w-full group">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [value]="apiKeyInput()"
                (input)="onApiKeyChange($event)"
                placeholder="Nhập API Key của bạn vào đây..."
                class="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono tracking-wider placeholder-slate-500"
              />
              <button
                (click)="togglePasswordVisibility()"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center"
              >
                <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <p class="text-[12px] text-slate-500 leading-relaxed mt-1 font-medium">
              Khóa API của bạn được lưu <span class="text-slate-400 font-semibold italic">cục bộ tuyệt đối</span> trong trình duyệt của bạn (LocalStorage), không lưu trữ trên bất kỳ máy chủ nào khác.
            </p>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-4 border-t border-slate-700/80 flex justify-between items-center bg-slate-800/40">
          <div>
            @if (storageService.userApiKey()) {
              <button
                (click)="removeKey()"
                class="px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/35 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
              >
                Xóa Key cá nhân
              </button>
            }
          </div>
          <div class="flex gap-3">
            <button
              (click)="storageService.closeApiKeyDialog()"
              class="px-4 py-2 rounded-lg font-medium bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-[13px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              (click)="saveKey()"
              class="px-5 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-sm text-[13px]"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `
})
export class ApiKeyModalComponent {
  public storageService = inject(StorageService);
  private toastService = inject(ToastService);

  apiKeyInput = signal<string>("");
  showPassword = signal<boolean>(false);

  constructor() {
    // Populate the input whenever the dialog opens
    effect(() => {
      if (this.storageService.showApiKeyDialog()) {
        this.apiKeyInput.set(this.storageService.userApiKey() || "");
        this.showPassword.set(false);
      }
    });
  }

  onApiKeyChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.apiKeyInput.set(input.value);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  saveKey() {
    const key = this.apiKeyInput().trim();
    if (!key) {
      this.toastService.addToast("Vui lòng nhập API Key hợp lệ!", "error");
      return;
    }
    
    if (this.storageService.saveUserApiKey(key)) {
      this.toastService.addToast("Lưu API Key cá nhân thành công!", "success");
      this.storageService.closeApiKeyDialog();
    } else {
      this.toastService.addToast("Lỗi khi lưu cấu hình!", "error");
    }
  }

  removeKey() {
    this.storageService.removeUserApiKey();
    this.apiKeyInput.set("");
    this.toastService.addToast("Đã xóa API Key cá nhân và đổi về Key hệ thống", "success");
    this.storageService.closeApiKeyDialog();
  }
}
