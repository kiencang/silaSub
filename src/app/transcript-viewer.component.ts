import { Component, inject, ChangeDetectionStrategy, PLATFORM_ID, Input, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AppStateService } from './app.state.service';
import { PlayerService } from './player.service';
import { FileService } from './file.service';
import { VideoService } from './video.service';
import { TranslationService } from './translation.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-transcript-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      @if (appState.subtitleSpeedInfo() && translationService.translationMode() !== 'lyric' && !appState.isTranscriptExpanded()) {
      <div class="mb-4 bg-orange-950/40 border border-orange-500/30 rounded-xl p-4 flex flex-col gap-2">
        <div>
          <mat-icon class="text-orange-400 block">speed</mat-icon>
        </div>
        
        <div class="text-sm text-orange-200/90 leading-relaxed">
          <span class="font-semibold text-orange-300">Tốc độ phụ đề đang cao hơn mức trung bình {{ appState.subtitleSpeedInfo()!.excessPercent }}%,</span> hãy điều chỉnh tốc độ phát video nếu bạn muốn.
        </div>
        
        <div class="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-orange-500/20 shadow-inner w-full mt-2 box-border">
          <div class="flex flex-col shrink-0 min-w-[70px]">
            <span class="text-[11px] font-bold text-orange-400/80 tracking-wide">Tốc độ phát</span>
            <span class="text-sm font-mono font-bold text-orange-300">{{ playerService.playbackRate() }}x</span>
          </div>
          <div class="w-[1px] h-6 bg-orange-500/20 shrink-0 mx-1"></div>
          <input 
            type="range" 
            min="0.5" 
            max="1.0" 
            step="0.05" 
            [value]="playerService.playbackRate()" 
            (input)="onPlaybackRateChange(rateInput.value)"
            #rateInput
            class="accent-orange-500 flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer min-w-0"
          />
        </div>
      </div>
      }

      <!-- Transcript Card -->
      <div
        class="flex-1 bg-slate-900 rounded-2xl text-white overflow-hidden relative flex flex-col border border-slate-800 min-h-[400px]"
        [class.opacity-50]="!appState.analysisResult()"
      >
        <div
          class="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-3xl pointer-events-none"
        ></div>

        <div
          class="border-b border-slate-800 shrink-0 relative z-10 flex justify-between items-center bg-slate-900/50 w-full"
          [class.p-4]="!appState.isTranscriptExpanded()"
          [class.md:p-5]="!appState.isTranscriptExpanded()"
          [class.px-4]="appState.isTranscriptExpanded()"
          [class.py-2]="appState.isTranscriptExpanded()"
        >
          <h3 class="text-sm font-bold text-slate-300 tracking-tight">
            Cuộn phụ đề trực tiếp
          </h3>

          <div class="flex items-center gap-3">
            @if (translationService.translateError()) {
            <p class="text-[10px] text-red-400 font-medium">
              {{ translationService.translateError() }}
            </p>
            }
            @if (hasEnglishSubtitle()) {
            <button
              (click)="appState.showEnglishSubtitle.set(!appState.showEnglishSubtitle())"
              class="relative group w-7 h-6 flex items-center justify-center rounded-md font-bold text-[11px] transition-all cursor-pointer outline-none focus:outline-none"
              [class.bg-slate-700]="appState.showEnglishSubtitle()"
              [class.text-white]="appState.showEnglishSubtitle()"
              [class.bg-slate-800]="!appState.showEnglishSubtitle()"
              [class.text-slate-500]="!appState.showEnglishSubtitle()"
              [class.hover:bg-slate-600]="appState.showEnglishSubtitle()"
              [class.hover:text-slate-300]="!appState.showEnglishSubtitle()"
            >
              En
              <span class="absolute top-full -right-4 mt-2 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap origin-top-right">
                {{ appState.showEnglishSubtitle() ? 'Ẩn phụ đề tiếng Anh' : 'Hiện phụ đề tiếng Anh' }}
              </span>
            </button>
            }
            <button
              (click)="appState.isTranscriptExpanded.set(!appState.isTranscriptExpanded())"
              class="relative group p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-all cursor-pointer outline-none focus:outline-none shadow-sm flex items-center justify-center"
            >
              @if (appState.isTranscriptExpanded()) {
              <!-- Collapse Vertical Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m8 11 4 4 4-4" />
                <path d="m8 13 4-4 4 4" />
                <path d="M12 3v18" />
              </svg>
              } @else {
              <!-- Expand Vertical Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m8 7 4-4 4 4" />
                <path d="m8 17 4 4 4-4" />
                <path d="M12 3v18" />
              </svg>
              }
              <span class="absolute top-full -right-2 mt-2 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap origin-top-right">
                {{ appState.isTranscriptExpanded() ? 'Thu gọn' : 'Mở rộng' }}
              </span>
            </button>
          </div>
        </div>

        <div
          id="transcript-container"
          class="flex-1 overflow-y-auto relative z-10 p-3 md:p-4 space-y-3 scroll-smooth custom-scrollbar-md"
          (mouseenter)="appState.isTranscriptHovered.set(true)"
          (mouseleave)="appState.isTranscriptHovered.set(false); forceScrollToCurrent()"
        >
          @if (appState.analysisResult()) { @for (line of appState.analysisResult()!.transcript; track line.offset) {
          <div
            id="transcript-line-{{line.offset}}"
            (click)="playerService.seekToLine(line.offset)" (keyup.enter)="playerService.seekToLine(line.offset)" tabindex="0"
             class="rounded-xl transition-all border border-transparent cursor-pointer group hover:bg-slate-800/80 hover:shadow-sm"
            [class.p-3]="!appState.isTranscriptExpanded()"
            [class.py-2]="appState.isTranscriptExpanded()"
            [class.px-3]="appState.isTranscriptExpanded()"
            [class.bg-slate-800]="appState.currentLine() === line"
            [class.border-y-slate-700]="appState.currentLine() === line"
            [class.border-r-slate-700]="appState.currentLine() === line"
            [class.border-l-red-500]="appState.currentLine() === line"
            [class.border-l-2]="appState.currentLine() === line"
            [class.shadow-md]="appState.currentLine() === line"
          >
            <div class="flex justify-between items-center mb-1">
              <span
                class="block text-[10px] text-slate-500 font-mono font-bold tracking-tighter group-hover:text-red-400 transition-colors"
                >{{ videoService.formatTime(line.offset) }}</span
              >
              <svg
                class="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            @if (appState.showEnglishSubtitle() && (!!fileService.selectedEnFile() || line.text !== '[Bản dịch không có phụ đề gốc]')) {
            <p
              class="text-xs text-slate-400 leading-relaxed italic group-hover:text-slate-300 transition-colors"
              [class.mb-2]="!appState.isTranscriptExpanded()"
              [class.mb-1]="appState.isTranscriptExpanded()"
            >
              {{ line.text }}
            </p>
            }
            <p
              class="text-sm text-white font-medium leading-relaxed group-hover:text-white transition-colors"
              [class.text-red-400]="fileService.selectedViFile()"
            >
              @if (line.viText) { {{ line.viText }} } @else {
              <span class="opacity-30">(Đang chờ hệ thống...)</span>
              }
            </p>
          </div>
          } } @else {
          <div
            class="flex flex-col items-center justify-center h-full text-slate-500 gap-4 opacity-60"
          >
            <mat-icon class="!text-[48px] !w-[48px] !h-[48px] mb-2 opacity-20">subtitles</mat-icon>
            <p class="text-sm italic font-medium">Chưa có dữ liệu phân tích...</p>
          </div>
          }
        </div>

        <div
          class="bg-slate-950 border-t border-slate-800 shrink-0 relative z-10 transition-all"
          [class.hidden]="appState.isTranscriptExpanded() && !fileService.selectedEnFile()"
          [class.p-4]="!(appState.isTranscriptExpanded() && !fileService.selectedEnFile())"
        >
          @if (appState.analysisResult()?.transcript?.[0]?.viText && !translationService.isTranslating()) {
          <div class="flex flex-col gap-2">
            <button
              (click)="onExportSrt()"
              [disabled]="!!fileService.selectedViFile() && !fileService.selectedEnFile()"
              class="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center"
              [class.bg-slate-800]="!(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
              [class.text-white]="!(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
              [class.hover:bg-slate-700]="!(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
              [class.cursor-pointer]="!(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
              [class.bg-slate-900/50]="(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
              [class.text-slate-600]="(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
              [class.cursor-not-allowed]="(!!fileService.selectedViFile() && !fileService.selectedEnFile())"
            >
              @if (!!fileService.selectedViFile() && !fileService.selectedEnFile()) {
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Đã nạp Phụ đề Việt từ máy } @else {
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Tải về Phụ đề Tiếng Việt (.srt) }
            </button>
            @if (translationService.analyzedBlocksJson() && appState.isDevMode()) {
              <button
                (click)="onExportPhase1()"
                class="w-full py-2 rounded-xl font-medium text-[11px] bg-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                Tải file dev data (ngữ cảnh / input JSON)
              </button>
            }
          </div>
          } @else {
          <button
            (click)="onStartTranslating()"
            class="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
            [disabled]="!appState.analysisResult() || translationService.isTranslating()"
          >
            <!-- Background Icon -->
            @if (translationService.translationMode() === 'lyric') {
            <mat-icon class="absolute -right-2 -bottom-3 !text-[65px] !w-[65px] !h-[65px] !leading-[65px] text-white/20 -rotate-45 pointer-events-none group-hover:scale-110 transition-transform duration-300">
              music_note
            </mat-icon>
            }
            <div class="relative z-10 flex items-center justify-center w-full">
              @if (translationService.isTranslating()) {
              <div
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
              ></div>
              @if (translationService.translationTotalChunks() > 1) { Đang dịch phần {{
              translationService.translationCurrentChunk() }}/{{ translationService.translationTotalChunks() }} ({{
              translationService.formattedTranslationTime() }}) } @else { @if (translationService.translationMode() ===
              'lyric') { Đang dịch lời bài hát... ({{ translationService.formattedTranslationTime()
              }}) } @else { 
                @if (translationService.translationPhaseInfo()) {
                   {{ translationService.translationPhaseInfo() }} ({{ translationService.formattedTranslationTime() }})
                } @else {
                   AI đang suy luận & Dịch... ({{ translationService.formattedTranslationTime() }}) 
                }
              } } } @else { 
              <mat-icon class="text-[18px] w-[18px] h-[18px] mb-[2px] mr-1.5 flex items-center justify-center">{{ translationService.aiModel() === 'gemini-pro-latest' ? 'psychology' : 'bolt' }}</mat-icon>
              {{ translationService.translationMode() === 'lyric' ? 'Dịch lời bài hát' : 'Dịch đa nhiệm' }} 
              @if (translationService.useGoogleSearch()) {
                <mat-icon class="text-[18px] w-[18px] h-[18px] mb-[2px] ml-1.5 flex items-center justify-center -scale-x-100">travel_explore</mat-icon>
              }
              }
            </div>
          </button>

          @if (translationService.isTranslating() && translationService.translationCurrentChunk() > 1) {
          <div
            class="mt-3 p-3 bg-slate-800 border border-slate-700/50 rounded-xl flex items-start gap-2.5 shadow-inner"
          >
            <div
              class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 animate-pulse shrink-0"
            ></div>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              Đã xong phần {{ translationService.translationCurrentChunk() - 1 }}. Đang tiếp tục
              ghép nối & dịch phần {{ translationService.translationCurrentChunk() }}/{{
              translationService.translationTotalChunks() }}...
            </p>
          </div>
          } }
        </div>
      </div>
  `
})
export class TranscriptViewerComponent {
  public appState = inject(AppStateService);
  public playerService = inject(PlayerService);
  public fileService = inject(FileService);
  public videoService = inject(VideoService);
  public translationService = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);

  @Input() exportSrtAction!: () => void;
  @Input() exportPhase1Action!: () => void;
  @Input() startTranslatingAction!: () => Promise<void>;

  hasEnglishSubtitle(): boolean {
    const res = this.appState.analysisResult();
    const firstLine = res?.transcript?.[0];
    if (!firstLine) return false;
    
    return !!firstLine.text && firstLine.text !== '[Bản dịch không có phụ đề gốc]';
  }

  onPlaybackRateChange(value: string) {
    const rate = parseFloat(value);
    if (!isNaN(rate)) {
      this.playerService.setPlaybackRate(rate);
    }
  }

  constructor() {
    effect(() => {
      // Auto-scrolling logic
      if (!isPlatformBrowser(this.platformId)) return;
      const line = this.appState.currentLine();
      const hovered = this.appState.isTranscriptHovered();

      if (line && !hovered) {
        this.scrollContainerToElement(line.offset);
      }
    });
  }

  private scrollContainerToElement(offset: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const container = document.getElementById("transcript-container");
      const el = document.getElementById(`transcript-line-${offset}`);
      if (container && el) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollTop =
          container.scrollTop +
          (elRect.top - containerRect.top) -
          containerRect.height / 2 +
          elRect.height / 2;
        container.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    }, 50);
  }

  forceScrollToCurrent() {
    const line = this.appState.currentLine();
    if (line) {
      this.scrollContainerToElement(line.offset);
    }
  }

  onExportSrt() {
    if (this.exportSrtAction) {
      this.exportSrtAction();
    }
  }

  onExportPhase1() {
    if (this.exportPhase1Action) {
      this.exportPhase1Action();
    }
  }

  onStartTranslating() {
    if (this.startTranslatingAction) {
      this.startTranslatingAction();
    }
  }
}
