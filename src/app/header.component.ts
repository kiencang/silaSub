import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { TranslationService } from "./translation.service";
import { SettingsService } from "./settings.service";
import { AppStateService } from "./app.state.service";
import { SearchService } from "./search.service";
import { FileService } from "./file.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-slate-200 bg-white px-4 md:px-8 py-3 flex flex-col md:flex-row md:justify-between items-center shrink-0 relative z-50 gap-3 md:gap-4">
      <div class="flex items-center justify-between w-full md:w-auto gap-4 xl:gap-8 shrink-0">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold tracking-tight text-slate-800 leading-none select-none">
            sila<span class="text-red-600">Sub</span>
          </h1>

          <!-- Controls Container -->
          <div
            class="flex items-center gap-3 transition-opacity"
            [class.pointer-events-none]="translationService.isTranslating()"
            [class.opacity-50]="translationService.isTranslating()"
          >
            <!-- Temperature Controls -->
            <div class="flex items-center gap-2.5">
              <button
                (click)="translationService.aiTemperature.set(0.3)"
                class="group relative w-3.5 h-3.5 rounded-full bg-slate-900 transition-all focus:outline-none cursor-pointer hover:scale-110"
                [class.ring-2]="translationService.aiTemperature() === 0.3"
                [class.ring-offset-2]="translationService.aiTemperature() === 0.3"
                [class.ring-slate-900]="translationService.aiTemperature() === 0.3"
              >
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Sát nghĩa (0.3)</span>
              </button>
              <button
                (click)="translationService.aiTemperature.set(0.5)"
                class="group relative w-3.5 h-3.5 rounded-full bg-blue-500 transition-all focus:outline-none cursor-pointer hover:scale-110"
                [class.ring-2]="translationService.aiTemperature() === 0.5"
                [class.ring-offset-2]="translationService.aiTemperature() === 0.5"
                [class.ring-blue-500]="translationService.aiTemperature() === 0.5"
              >
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Cân bằng (0.5)</span>
              </button>
              <button
                (click)="translationService.aiTemperature.set(0.7)"
                class="group relative w-3.5 h-3.5 rounded-full bg-red-600 transition-all focus:outline-none cursor-pointer hover:scale-110"
                [class.ring-2]="translationService.aiTemperature() === 0.7"
                [class.ring-offset-2]="translationService.aiTemperature() === 0.7"
                [class.ring-red-600]="translationService.aiTemperature() === 0.7"
              >
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Uyển chuyển (0.7)</span>
              </button>
            </div>

            <div class="w-[1px] h-4 bg-slate-300 mx-0.5"></div>

            <!-- AI Model Controls -->
            <div class="flex items-center gap-2">
              <button
                (click)="translationService.aiModel.set('gemini-pro-latest')"
                class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
                [class.bg-blue-500]="translationService.aiModel() === 'gemini-pro-latest'"
                [class.text-white]="translationService.aiModel() === 'gemini-pro-latest'"
                [class.bg-slate-100]="translationService.aiModel() !== 'gemini-pro-latest'"
                [class.text-slate-400]="translationService.aiModel() !== 'gemini-pro-latest'"
                [class.hover:bg-slate-200]="translationService.aiModel() !== 'gemini-pro-latest'"
              >
                <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">psychology</mat-icon>
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Tư duy sâu (Pro)</span>
              </button>

              <button
                (click)="translationService.aiModel.set('gemini-flash-latest')"
                class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
                [class.bg-amber-500]="translationService.aiModel() === 'gemini-flash-latest'"
                [class.text-white]="translationService.aiModel() === 'gemini-flash-latest'"
                [class.bg-slate-100]="translationService.aiModel() !== 'gemini-flash-latest'"
                [class.text-slate-400]="translationService.aiModel() !== 'gemini-flash-latest'"
                [class.hover:bg-slate-200]="translationService.aiModel() !== 'gemini-flash-latest'"
              >
                <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">bolt</mat-icon>
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Tốc độ & Tiết kiệm (Flash)</span>
              </button>
            </div>

            <div class="w-[1px] h-4 bg-slate-300 mx-0.5"></div>

            <!-- Translation Mode Controls -->
            <div class="flex items-center gap-2">
              <button
                (click)="changeTranslationMode('multi-task')"
                class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
                [class.bg-blue-500]="translationService.translationMode() === 'multi-task'"
                [class.text-white]="translationService.translationMode() === 'multi-task'"
                [class.bg-slate-100]="translationService.translationMode() !== 'multi-task'"
                [class.text-slate-400]="translationService.translationMode() !== 'multi-task'"
                [class.hover:bg-slate-200]="translationService.translationMode() !== 'multi-task'"
              >
                <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">language</mat-icon>
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">Dịch đa nhiệm</span>
              </button>

              <button
                (click)="changeTranslationMode('lyric')"
                class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
                [class.bg-pink-500]="translationService.translationMode() === 'lyric'"
                [class.text-white]="translationService.translationMode() === 'lyric'"
                [class.bg-slate-100]="translationService.translationMode() !== 'lyric'"
                [class.text-slate-400]="translationService.translationMode() !== 'lyric'"
                [class.hover:bg-slate-200]="translationService.translationMode() !== 'lyric'"
              >
                <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">music_note</mat-icon>
                <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">Dịch lời bài hát</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Button on Mobile -->
        <button
          (click)="settingsService.openSettings(); settingsService.isOpen.set(true)"
          class="md:hidden px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          <mat-icon class="text-[20px] w-[20px] h-[20px] leading-none">settings</mat-icon>
        </button>
      </div>

      <!-- YouTube Video Search Container -->
      <div class="w-full md:flex-1 max-w-3xl relative">
        <input
          type="text"
          [value]="searchService.searchQuery()"
          (input)="searchService.searchQuery.set($any($event.target).value)"
          (keydown.enter)="searchService.searchYoutube()"
          [disabled]="searchService.isSearchingQuery() || appState.isAnalyzing() || translationService.isTranslating()"
          placeholder="Gõ tiếng Việt, tìm video tiếng Anh trên YouTube..."
          class="w-full px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-[16px] leading-[20px] truncate disabled:opacity-70 pr-20 placeholder-slate-400 font-medium shadow-sm"
        />

        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          @if (searchService.searchQuery()) {
          <button
            (click)="searchService.searchQuery.set('')"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            title="Xóa tìm kiếm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div class="h-4 w-px bg-slate-300 mx-0.5"></div>
          }

          <button
            (click)="searchService.searchYoutube()"
            [disabled]="searchService.isSearchingQuery() || !searchService.searchQuery().trim() || translationService.isTranslating()"
            class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-600 focus:outline-none transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            @if (searchService.isSearchingQuery()) {
            <div class="w-4.5 h-4.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            }
          </button>
        </div>
      </div>

      <!-- Settings Button on Desktop -->
      <div class="hidden md:flex items-center shrink-0">
        <button
          (click)="settingsService.openSettings(); settingsService.isOpen.set(true)"
          class="px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <mat-icon class="text-[18px] w-[18px] h-[18px] leading-none">settings</mat-icon>
          Cài đặt
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  translationService = inject(TranslationService);
  settingsService = inject(SettingsService);
  appState = inject(AppStateService);
  searchService = inject(SearchService);
  fileService = inject(FileService);

  changeTranslationMode(mode: "multi-task" | "lyric") {
    this.translationService.translationMode.set(mode);
    if (mode === "lyric") {
      this.fileService.clearVideoFile();
    }
  }
}
