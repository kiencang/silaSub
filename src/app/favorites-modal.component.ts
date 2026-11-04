import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StorageService } from './storage.service';
import { VideoService } from './video.service';

@Component({
  selector: 'app-favorites-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (storageService.showFavoritesDialog()) {
    <div class="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <div
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer transition-opacity"
        (click)="storageService.closeFavoritesDialog()" (keyup.enter)="storageService.closeFavoritesDialog()" tabindex="0"
      ></div>

      <div
        class="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md mx-4 relative flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div class="px-5 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 class="text-sm font-semibold text-white">Kênh YouTube Ưa Thích</h3>
          <button
            (click)="storageService.closeFavoritesDialog()" (keyup.enter)="storageService.closeFavoritesDialog()" tabindex="0"
            class="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px] block">close</mat-icon>
          </button>
        </div>

        <div class="p-5 flex-1 overflow-y-auto max-h-[70vh]">
          <div class="flex items-start gap-2 mb-4 p-3 bg-blue-900/20 rounded-xl border border-blue-500/20">
            <div class="relative flex h-3.5 w-3.5 items-center justify-center bg-blue-500/30 rounded-full text-blue-400 mt-[1.5px] flex-shrink-0">
              <span class="text-[9px] font-bold font-serif italic">i</span>
            </div>
            <p class="text-[12px] text-blue-300 font-medium leading-relaxed">Thông tin này chỉ lưu cục bộ tại trình duyệt bạn đang dùng</p>
          </div>

          <div class="flex flex-col gap-3">
            @for (channel of storageService.dialogChannels(); track $index) {
            <div class="flex items-center gap-2">
              <div class="relative flex-1 group">
                <input
                  type="text"
                  [value]="channel"
                  (input)="storageService.updateDialogChannel($index, $event)"
                  placeholder="Nhập link kênh YouTube..."
                  class="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[13px] text-white outline-none focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder-slate-500"
                />
                @if (videoService.isValidUrl(channel)) {
                  <a
                    [href]="videoService.getValidUrl(channel)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-blue-400 rounded-md hover:bg-slate-700 transition-colors flex items-center justify-center"
                    title="Mở liên kết"
                  >
                     <mat-icon class="text-[16px] w-[16px] h-[16px]">open_in_new</mat-icon>
                  </a>
                }
              </div>
              <button
                (click)="storageService.removeDialogChannel($index)"
                class="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
                title="Xóa"
              >
                <mat-icon class="text-[18px] w-[18px] h-[18px]">delete_outline</mat-icon>
              </button>
            </div>
            }
          </div>

          @if (storageService.dialogChannels().length < 10) {
          <button
            (click)="storageService.addDialogChannel()"
            class="mt-4 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800 transition-all text-[13px] font-medium"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon>
            Thêm kênh
          </button>
          }
        </div>

        <div class="px-5 py-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-800">
          <button
            (click)="storageService.closeFavoritesDialog()" (keyup.enter)="storageService.closeFavoritesDialog()" tabindex="0"
            class="px-4 py-2 rounded-lg font-medium bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-[13px]"
          >
            Hủy
          </button>
          <button
            (click)="storageService.saveFavoritesList()"
            class="px-5 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-sm text-[13px]"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
    }
  `
})
export class FavoritesModalComponent {
  public storageService = inject(StorageService);
  public videoService = inject(VideoService);
}
