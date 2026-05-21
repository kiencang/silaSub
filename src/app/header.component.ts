import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { TranslationService } from "./translation.service";
import { SettingsService } from "./settings.service";
import { AppStateService } from "./app.state.service";
import { SearchService } from "./search.service";
import { FileService } from "./file.service";
import { StorageService } from "./storage.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #controlsTemplate>
      <!-- AI Model Controls -->
      <div class="flex items-center gap-2">
        <button
          (click)="changeAiModel('gemini-pro-latest')"
          class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
          [class.bg-blue-500]="translationService.aiModel() === 'gemini-pro-latest'"
          [class.text-white]="translationService.aiModel() === 'gemini-pro-latest'"
          [class.bg-slate-800]="translationService.aiModel() !== 'gemini-pro-latest'"
          [class.text-slate-400]="translationService.aiModel() !== 'gemini-pro-latest'"
          [class.hover:bg-slate-700]="translationService.aiModel() !== 'gemini-pro-latest'"
        >
          <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">psychology</mat-icon>
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Tư duy sâu (Pro) - cho chất lượng dịch tốt hơn, nhưng thường bị hạn chế với API miễn phí.</span>
        </button>

        <button
          (click)="changeAiModel('gemini-flash-latest')"
          class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
          [class.bg-amber-500]="translationService.aiModel() === 'gemini-flash-latest'"
          [class.text-white]="translationService.aiModel() === 'gemini-flash-latest'"
          [class.bg-slate-800]="translationService.aiModel() !== 'gemini-flash-latest'"
          [class.text-slate-400]="translationService.aiModel() !== 'gemini-flash-latest'"
          [class.hover:bg-slate-700]="translationService.aiModel() !== 'gemini-flash-latest'"
        >
          <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">bolt</mat-icon>
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Tốc độ & Tiết kiệm (Flash) - rất phù hợp với nhu cầu dịch miễn phí.</span>
        </button>
      </div>

      <div class="w-[1px] h-4 bg-slate-700 mx-0.5"></div>

      <!-- Translation Mode Controls -->
      <div class="flex items-center gap-2">
        <button
          (click)="changeTranslationMode('multi-task')"
          class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
          [class.bg-blue-500]="translationService.translationMode() === 'multi-task'"
          [class.text-white]="translationService.translationMode() === 'multi-task'"
          [class.bg-slate-800]="translationService.translationMode() !== 'multi-task'"
          [class.text-slate-400]="translationService.translationMode() !== 'multi-task'"
          [class.hover:bg-slate-700]="translationService.translationMode() !== 'multi-task'"
        >
          <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">language</mat-icon>
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">Dịch đa nhiệm</span>
        </button>

        <button
          (click)="changeTranslationMode('lyric')"
          class="group relative flex items-center justify-center w-5 h-5 rounded border border-transparent transition-all focus:outline-none cursor-pointer hover:scale-105"
          [class.bg-pink-500]="translationService.translationMode() === 'lyric'"
          [class.text-white]="translationService.translationMode() === 'lyric'"
          [class.bg-slate-800]="translationService.translationMode() !== 'lyric'"
          [class.text-slate-400]="translationService.translationMode() !== 'lyric'"
          [class.hover:bg-slate-700]="translationService.translationMode() !== 'lyric'"
        >
          <mat-icon class="text-[12px] w-[12px] h-[12px] leading-none">music_note</mat-icon>
          <span class="absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-3 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">Dịch lời bài hát</span>
        </button>
      </div>
    </ng-template>

    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 md:px-8 py-3 flex flex-col md:flex-row md:justify-between items-center shrink-0 relative z-50 gap-3 md:gap-4">
      
      <!-- Top Row Mobile / Left Desktop -->
      <div class="flex items-center justify-between w-full md:w-auto shrink-0 gap-4 xl:gap-8">
        <h1 class="text-xl font-bold tracking-tight text-white leading-none select-none">
          sila<span class="text-red-400">Sub</span>
        </h1>

        <!-- Mobile Controls & Settings Button -->
        <div class="flex md:hidden items-center justify-end flex-wrap gap-2 shrink-0 max-w-[240px]">
          <div
            class="flex items-center gap-2.5 transition-opacity scale-90 origin-right justify-end"
            [class.pointer-events-none]="translationService.isTranslating()"
            [class.opacity-50]="translationService.isTranslating()"
          >
            <ng-container *ngTemplateOutlet="controlsTemplate"></ng-container>
          </div>

          <button
            (click)="storageService.openApiKeyDialog()"
            class="w-9 h-9 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center justify-center border shrink-0"
            [class.bg-blue-500/10]="storageService.userApiKey()"
            [class.border-blue-500/30]="storageService.userApiKey()"
            [class.text-blue-400]="storageService.userApiKey()"
            [class.hover:bg-blue-500/20]="storageService.userApiKey()"
            [class.bg-slate-800]="!storageService.userApiKey()"
            [class.border-transparent]="!storageService.userApiKey()"
            [class.text-slate-300]="!storageService.userApiKey()"
            [class.hover:bg-slate-700]="!storageService.userApiKey()"
            [title]="storageService.userApiKey() ? 'Đang sử dụng Key của bạn' : 'Key hệ thống'"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px] leading-none">key</mat-icon>
          </button>

          <button
            (click)="settingsService.openSettings(); settingsService.isOpen.set(true)"
            class="w-9 h-9 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px] leading-none">settings</mat-icon>
          </button>
        </div>
      </div>

      <!-- YouTube Video Search Container -->
      <div class="w-full md:flex-1 max-w-2xl lg:max-w-3xl relative order-last md:order-none">
        <input
          type="text"
          [value]="searchService.searchQuery()"
          (input)="searchService.searchQuery.set($any($event.target).value)"
          (keydown.enter)="searchService.searchYoutube()"
          [disabled]="searchService.isSearchingQuery() || appState.isAnalyzing() || translationService.isTranslating()"
          placeholder="Gõ tiếng Việt, tìm video tiếng Anh trên YouTube..."
          class="w-full px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-full text-white focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-[16px] leading-[20px] truncate disabled:opacity-70 pr-20 placeholder-slate-500 font-medium shadow-sm"
        />

        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          @if (searchService.searchQuery()) {
          <button
            (click)="searchService.searchQuery.set('')"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400 hover:text-white focus:outline-none transition-colors"
            title="Xóa tìm kiếm"
          >
            <mat-icon class="text-[16px] w-[16px] h-[16px] leading-none text-slate-400 hover:text-white transition-colors cursor-pointer" title="Xóa tìm kiếm">close</mat-icon>
          </button>
          <div class="h-4 w-px bg-slate-700 mx-0.5"></div>
          }

          <button
            (click)="searchService.searchYoutube()"
            [disabled]="searchService.isSearchingQuery() || !searchService.searchQuery().trim() || translationService.isTranslating()"
            class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-300 hover:text-white focus:outline-none transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            @if (searchService.isSearchingQuery()) {
            <div class="w-4.5 h-4.5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"></div>
            } @else {
            <mat-icon class="text-[18px] w-[18px] h-[18px] leading-none text-inherit">search</mat-icon>
            }
          </button>
        </div>
      </div>

      <!-- Right Desktop: Controls + Settings -->
      <div class="hidden md:flex items-center shrink-0 gap-4 lg:gap-6">
        <div
          class="flex items-center gap-3 transition-opacity"
          [class.pointer-events-none]="translationService.isTranslating()"
          [class.opacity-50]="translationService.isTranslating()"
        >
          <ng-container *ngTemplateOutlet="controlsTemplate"></ng-container>
        </div>

        <button
          (click)="storageService.openApiKeyDialog()"
          class="px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border shrink-0 select-none"
          [class.bg-blue-500/10]="storageService.userApiKey()"
          [class.border-blue-500/30]="storageService.userApiKey()"
          [class.text-blue-400]="storageService.userApiKey()"
          [class.hover:bg-blue-500/20]="storageService.userApiKey()"
          [class.bg-slate-800]="!storageService.userApiKey()"
          [class.border-transparent]="!storageService.userApiKey()"
          [class.text-slate-300]="!storageService.userApiKey()"
          [class.hover:bg-slate-700]="!storageService.userApiKey()"
          [class.hover:text-white]="!storageService.userApiKey()"
        >
          <mat-icon class="text-[18px] w-[18px] h-[18px] leading-none">key</mat-icon>
          {{ storageService.userApiKey() ? 'Đang sử dụng Key của bạn' : 'Key hệ thống' }}
        </button>
        
        <button
          (click)="settingsService.openSettings(); settingsService.isOpen.set(true)"
          class="px-4 py-2 bg-slate-800 text-slate-300 rounded-full text-sm font-semibold hover:bg-slate-700 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
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
  storageService = inject(StorageService);

  changeTranslationMode(mode: "multi-task" | "lyric") {
    this.translationService.translationMode.set(mode);
  }

  changeAiModel(model: "gemini-pro-latest" | "gemini-flash-latest") {
    this.translationService.aiModel.set(model);
    if (model === "gemini-flash-latest") {
      this.fileService.clearAudioFile();
      this.fileService.showAudioUpload.set(false);
    }
  }
}
