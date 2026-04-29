import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    @if (settingsService.isOpen()) {
    <div class="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      <div
        class="absolute inset-0 bg-slate-900/10 cursor-pointer pointer-events-auto transition-opacity"
        (click)="close('cancel')" (keyup.enter)="close('cancel')" tabindex="0"
      ></div>

      <div
        class="w-full max-w-sm h-full relative z-10 pointer-events-auto flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-300 bg-gradient-to-r from-white/95 to-white shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.4)] border-l border-white/60"
      >
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 class="text-lg font-bold text-slate-800">Cài đặt Phụ đề</h3>
          <button
            (click)="close('cancel')" (keyup.enter)="close('cancel')" tabindex="0"
            class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar">
          <!-- Option: Font Family -->
          <div class="mb-6">
            <span class="block text-sm font-semibold text-slate-700 mb-2">Chọn font chữ</span>
            <select
              [value]="settingsService.subFontFamily()"
              (change)="settingsService.subFontFamily.set($any($event.target).value)"
              class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer font-medium appearance-none"
            >
              <option value="Lexend">Lexend (Giúp tăng tốc độ đọc)</option>
              <option value="Be Vietnam Pro">Be Vietnam Pro (Font tiếng Việt đẹp)</option>
              <option value="Inter">Inter (Gọn gàng, UI chuẩn)</option>
              <option value="Roboto">Roboto (Truyền thống của YouTube)</option>
              <option value="Merriweather">Merriweather (Có chân, rõ nét)</option>
            </select>
          </div>

          <!-- Option: Font Color -->
          <div class="mb-6">
            <span class="block text-sm font-semibold text-slate-700 mb-2">Màu chữ</span>
            <div class="grid grid-cols-3 gap-2">
              <button
                (click)="settingsService.subTextColor.set('#FFD700')"
                class="py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center justify-center gap-2"
                [class.border-red-500]="settingsService.subTextColor() === '#FFD700'"
                [class.bg-red-50]="settingsService.subTextColor() === '#FFD700'"
                [class.border-slate-200]="settingsService.subTextColor() !== '#FFD700'"
                [class.bg-slate-50]="settingsService.subTextColor() !== '#FFD700'"
              >
                <span class="w-3.5 h-3.5 rounded-full bg-[#FFD700] ring-1 ring-black/10"></span>
                Vàng
              </button>
              <button
                (click)="settingsService.subTextColor.set('#FFFFFF')"
                class="py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center justify-center gap-2"
                [class.border-red-500]="settingsService.subTextColor() === '#FFFFFF'"
                [class.bg-red-50]="settingsService.subTextColor() === '#FFFFFF'"
                [class.border-slate-200]="settingsService.subTextColor() !== '#FFFFFF'"
                [class.bg-slate-50]="settingsService.subTextColor() !== '#FFFFFF'"
              >
                <span class="w-3.5 h-3.5 rounded-full bg-white ring-1 ring-black/10 shadow-sm"></span>
                Trắng
              </button>
              <button
                (click)="settingsService.subTextColor.set('#38BDF8')"
                class="py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center justify-center gap-2"
                [class.border-red-500]="settingsService.subTextColor() === '#38BDF8'"
                [class.bg-red-50]="settingsService.subTextColor() === '#38BDF8'"
                [class.border-slate-200]="settingsService.subTextColor() !== '#38BDF8'"
                [class.bg-slate-50]="settingsService.subTextColor() !== '#38BDF8'"
              >
                <span class="w-3.5 h-3.5 rounded-full bg-[#38BDF8] ring-1 ring-black/10"></span>
                Xanh lơ
              </button>
            </div>
          </div>

          <!-- Option: Font Size -->
          <div class="mb-6">
            <span class="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
              <span>Kích cỡ chữ (Tương đối)</span>
              <span class="text-slate-500">{{ settingsService.subFontSize() }}</span>
            </span>
            <input
              type="range" min="15" max="60" step="1"
              [value]="settingsService.subFontSize()"
              (input)="settingsService.subFontSize.set(+$any($event.target).value)"
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div class="flex justify-between text-xs text-slate-400 mt-1">
              <span>Nhỏ</span>
              <span>Lớn</span>
            </div>
          </div>

          <!-- Option: Background Opacity -->
          <div class="mb-6">
            <span class="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
              <span>Độ đậm của nền</span>
              <span class="text-slate-500">{{ settingsService.subBgOpacity() * 100 | number:'1.0-0' }}%</span>
            </span>
            <input
              type="range" min="0.15" max="0.85" step="0.05"
              [value]="settingsService.subBgOpacity()"
              (input)="settingsService.subBgOpacity.set(+$any($event.target).value)"
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div class="flex justify-between text-xs text-slate-400 mt-1">
              <span>15%</span>
              <span>85%</span>
            </div>
          </div>

          <!-- Option: Vertical Offset -->
          <div class="mb-6">
            <span class="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
              <span>Khoảng cách từ đáy</span>
              <span class="text-slate-500">Mức {{ settingsService.subVerticalOffset() }}</span>
            </span>
            <input
              type="range" min="0" max="7" step="0.5"
              [value]="settingsService.subVerticalOffset()"
              (input)="settingsService.subVerticalOffset.set(+$any($event.target).value)"
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div class="flex justify-between text-xs text-slate-400 mt-1">
              <span>Sát khung</span>
              <span>Siêu cao</span>
            </div>
          </div>
        </div>

        <div class="px-6 py-5 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
          <button (click)="close('reset')" class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100/50 transition-colors cursor-pointer text-sm">
            Mặc định
          </button>
          <button (click)="close('save')" class="flex-[2] px-4 py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm text-sm">
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
    }
  `
})
export class SettingsModalComponent {
  public settingsService = inject(SettingsService);

  close(action: 'save' | 'reset' | 'cancel') {
    this.settingsService.isOpen.set(false);
    if (action === 'save') {
      this.settingsService.saveSettings();
    } else if (action === 'reset') {
      this.settingsService.resetSettings();
    } else if (action === 'cancel') {
      this.settingsService.cancelSettings();
    }
  }
}
