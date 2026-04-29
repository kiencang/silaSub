import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppStateService } from './app.state.service';
import { PlayerService } from './player.service';
import { SettingsService } from './settings.service';
import { StorageService } from './storage.service';
import { FileService } from './file.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex-[3] flex flex-col min-w-0 h-full max-h-full items-center justify-center p-2"
    >
      <!-- Video Mockup / Iframe -->
      <div
        id="video-wrapper"
        class="w-full h-auto aspect-video max-h-full bg-black rounded-2xl relative overflow-hidden shadow-2xl shrink-0"
        style="max-width: calc((100vh - 110px) * 16 / 9); container-type: inline-size;"
      >
        <div class="absolute inset-0 w-full h-full" [class.hidden]="!appState.videoId()">
          <!-- Target for YouTube IFrame API -->
          <div
            id="yt-player-container"
            class="w-full h-full border-0 pointer-events-auto"
          ></div>

          <!-- Custom Fullscreen Button Overlay -->
          <button
            (click)="playerService.toggleFullscreen()"
            class="absolute bottom-16 right-4 md:bottom-20 md:right-6 z-50 text-white/70 bg-black/60 hover:bg-red-600 hover:text-white p-3 rounded-xl transition-all backdrop-blur-md cursor-pointer border border-white/10 opacity-70 group-hover:opacity-100 focus:outline-none"
          >
            @if (playerService.isFullscreen()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              <!-- Exit pseudo icon -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20v-5H4M20 9h-5V4M20 15h-5v5M4 9h5V4" />
            </svg>
            } @else {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            }
          </button>
        </div>

        @if (!appState.videoId()) {
          @if (appState.showInstructions()) {
          <div class="absolute inset-0 bg-white rounded-2xl overflow-hidden z-20 flex flex-col">
            <div class="h-12 bg-white flex justify-between items-center px-4 border-b z-10 shadow-sm shrink-0">
               <span class="font-bold text-slate-800">Hướng dẫn sử dụng</span>
               <button (click)="appState.showInstructions.set(false)" class="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                  <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
               </button>
            </div>
            <iframe
              src="/instructions-for-use/how-to-use.html"
              class="w-full flex-1 border-0"
            ></iframe>
          </div>
          } @else {
          <div
            class="absolute inset-0 flex items-center justify-center"
          >
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1000"
              class="w-full h-full object-cover opacity-60 grayscale pointer-events-none"
              alt="Video Preview"
              referrerpolicy="no-referrer"
            />
            <div class="absolute inset-0 bg-black/40 pointer-events-none"></div>
            <div class="absolute flex flex-col items-center gap-3">
              <div
                class="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg pointer-events-none"
              >
                <div
                  class="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2"
                ></div>
              </div>
              <span
                class="text-white/90 text-sm font-medium tracking-wide drop-shadow-md pointer-events-none"
                >Chưa có link YouTube</span
              >
              <div class="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  (click)="appState.showInstructions.set(true)"
                  class="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg transition-all text-[13px] font-medium shadow-sm flex items-center justify-center gap-2 pointer-events-auto"
                >
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">menu_book</mat-icon>
                  Xem Hướng dẫn sử dụng
                </button>
                <button
                  (click)="storageService.openFavoritesDialog()"
                  class="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg transition-all text-[13px] font-medium shadow-sm flex items-center justify-center gap-2 pointer-events-auto"
                >
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ storageService.favoriteChannels().length > 0 ? 'featured_play_list' : 'playlist_add' }}</mat-icon>
                  {{ storageService.favoriteChannels().length > 0 ? 'Danh sách kênh ưa thích' : 'Thêm kênh ưa thích của bạn' }}
                </button>
              </div>
            </div>
          </div>
          }
        }

        <!-- Translated Subtitle Overlay -->
        @if (appState.currentLine()) {
        <div
          class="absolute left-0 right-0 px-4 md:px-12 bottom-0 w-full flex flex-col items-center justify-end pointer-events-none transition-all duration-300 z-10"
          [style.paddingBottom.rem]="settingsService.subVerticalOffset()"
        >
          <div
            class="flex flex-col items-center w-full max-w-[90%] md:max-w-[80%] lg:max-w-[900px]"
          >
            <!-- Optional Original Text (Hide if using pre-translated file) -->
            @if (appState.currentLine()?.viText && (!!fileService.selectedEnFile() || (appState.currentLine()?.text &&
            appState.currentLine()!.text !== '[Bản dịch không có phụ đề gốc]'))) {
            <p
              class="bg-black/50 text-white px-4 py-1 mb-1 rounded italic text-center whitespace-pre-wrap"
              style="text-wrap: balance"
              [style.fontSize]="'max(12px, calc(' + settingsService.subFontSize() + ' * 0.1cqw))'"
            >
              {{ appState.currentLine()?.text }}
            </p>
            }
            <p
              class="px-4 md:px-6 py-2 font-semibold rounded text-center whitespace-pre-wrap leading-snug shadow-md transition-all duration-100"
              style="text-wrap: balance"
              [style.color]="settingsService.subTextColor()"
              [style.backgroundColor]="'rgba(0, 0, 0, ' + settingsService.subBgOpacity() + ')'"
              [style.fontSize]="'max(16px, calc(' + settingsService.subFontSize() + ' * 0.15cqw))'"
              [style.fontFamily]="settingsService.getFontFamily(settingsService.subFontFamily())"
              [style.lineHeight]="1.4"
            >
              {{ appState.currentLine()?.viText || appState.currentLine()?.text }}
            </p>
          </div>
        </div>
        }

        <!-- Progress Bar -->
        @if (appState.analysisResult()?.transcript?.length) {
        <div
          class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 pointer-events-none z-20"
        >
          <div
            class="h-full bg-red-600 transition-all duration-100"
            [style.width.%]="(playerService.currentTime() / (appState.analysisResult()!.transcript[appState.analysisResult()!.transcript.length-1].offset || 1)) * 100"
          ></div>
        </div>
        }
      </div>
    </div>
  `
})
export class VideoPlayerComponent {
  public appState = inject(AppStateService);
  public playerService = inject(PlayerService);
  public settingsService = inject(SettingsService);
  public storageService = inject(StorageService);
  public fileService = inject(FileService);
}
