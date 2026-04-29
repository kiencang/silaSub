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
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer transition-opacity"
        (click)="storageService.closeFavoritesDialog()" (keyup.enter)="storageService.closeFavoritesDialog()" tabindex="0"
      ></div>

      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 relative flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div class="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
          <h3 class="text-sm font-semibold text-slate-800">Kênh YouTube Ưa Thích</h3>
          <button
            (click)="storageService.closeFavoritesDialog()" (keyup.enter)="storageService.closeFavoritesDialog()" tabindex="0"
            class="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
          </button>
        </div>

        <div class="p-5 flex-1 overflow-y-auto max-h-[70vh]">
          <div class="flex items-start gap-2 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div class="relative flex h-3.5 w-3.5 items-center justify-center bg-blue-200/70 rounded-full text-blue-600 mt-[1.5px] flex-shrink-0">
              <span class="text-[9px] font-bold font-serif italic">i</span>
            </div>
            <p class="text-[12px] text-blue-700 font-medium leading-relaxed">Thông tin này chỉ lưu cục bộ tại trình duyệt bạn đang dùng</p>
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
                  class="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-medium"
                />
                @if (videoService.isValidUrl(channel)) {
                  <a
                    [href]="videoService.getValidUrl(channel)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors flex items-center justify-center"
                    title="Mở liên kết"
                  >
                     <mat-icon class="text-[16px] w-[16px] h-[16px]">open_in_new</mat-icon>
                  </a>
                }
              </div>
              <button
                (click)="storageService.removeDialogChannel($index)"
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
            class="mt-4 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all text-[13px] font-medium"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon>
            Thêm kênh
          </button>
          }
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-3 bg-slate-50">
          <button
            (click)="storageService.closeFavoritesDialog()" (keyup.enter)="storageService.closeFavoritesDialog()" tabindex="0"
            class="px-4 py-2 rounded-lg font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px]"
          >
            Hủy
          </button>
          <button
            (click)="storageService.saveFavoritesList()"
            class="px-5 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-sm text-[13px]"
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
