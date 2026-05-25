import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { TranslationService } from "./translation.service";
import { AppStateService } from "./app.state.service";
import { HistoryService } from "./history.service";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-slate-900 border-t border-slate-800 py-3 md:py-[10px] px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-2 md:gap-0">
      <!-- Left side -->
      <div class="flex flex-col md:flex-row md:items-center gap-3 order-2 md:order-1 mt-1 md:mt-0">
        <div class="flex flex-row items-center gap-3">
          <button
            (click)="appState.isShareModalOpen.set(true)"
            class="flex items-center justify-center gap-1 h-[20px] px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors border border-slate-700 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-slate-500"
            title="Chia sẻ ứng dụng"
          >
            <mat-icon class="text-[14px] w-[14px] h-[14px] transform scale-[0.7] origin-center flex items-center justify-center leading-none group-hover:text-blue-400 transition-colors">share</mat-icon>
            <span class="text-[9px] font-medium tracking-wide leading-none mt-[1px]">Share</span>
          </button>
          
          <p class="text-[10px] text-slate-500 font-medium">
            Chỉ dùng cho mục đích cá nhân • v1.0.71 •
            <a href="https://github.com/kiencang/silaSub" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-slate-400 underline-offset-2 transition-colors duration-200 ml-1">GitHub</a>
          </p>
        </div>

        <!-- Dev Mode Toggle -->
        <div class="group relative flex items-center gap-2 self-start md:self-auto ml-1 md:ml-0 md:pl-2 md:border-l md:border-slate-800">
          <button
            (click)="appState.isDevMode.set(!appState.isDevMode())"
            (keyup.enter)="appState.isDevMode.set(!appState.isDevMode())"
            tabindex="0"
            class="relative inline-block h-4 w-7 rounded-full transition-colors focus:outline-none shadow-none border border-slate-700 cursor-pointer"
            [class.bg-indigo-600]="appState.isDevMode()"
            [class.bg-slate-800]="!appState.isDevMode()"
          >
            <span
              class="absolute top-[1px] h-3 w-3 rounded-full bg-slate-200 transition-all duration-200 shadow-sm"
              [class.left-[13px]]="appState.isDevMode()"
              [class.left-[1px]]="!appState.isDevMode()"
              [class.bg-white]="appState.isDevMode()"
            ></span>
          </button>
          <span 
            class="text-[10px] font-medium cursor-pointer" 
            (click)="appState.isDevMode.set(!appState.isDevMode())"
            (keyup.enter)="appState.isDevMode.set(!appState.isDevMode())"
            tabindex="0"
            [class.text-slate-500]="!appState.isDevMode()" 
            [class.text-indigo-500]="appState.isDevMode()"
          >Dev</span>
          
          <!-- Tooltip -->
          <span class="absolute bottom-full left-0 md:left-auto md:left-1/2 md:-translate-x-1/2 mb-3 w-[260px] whitespace-normal px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left border border-slate-700">
            <span class="font-bold" [class.text-indigo-400]="appState.isDevMode()" [class.text-slate-400]="!appState.isDevMode()">[{{ appState.isDevMode() ? 'Đang bật' : 'Đang tắt' }}]</span> Chỉ dành cho lập trình viên, khi được bật công cụ sẽ thêm nút tải file trung gian về để lập trình viên có thể kiểm tra nội dung, đặc biệt hữu ích nếu bạn Remix công cụ về phát triển thêm.
            <!-- Arrow -->
            <span class="absolute -bottom-1 left-4 md:left-1/2 md:-translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></span>
          </span>
        </div>
      </div>

      <!-- Right side -->
      <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 order-1 md:order-2">
        <p class="text-[10px] text-slate-500 font-medium md:border-r md:border-slate-800 md:pr-6 leading-relaxed">
        Nguyễn Đức Anh • Dùng tốt nhất với Chrome, màn hình lớn
        </p>

        <!-- Grounding with Google Search Toggle -->
        <div class="group relative flex items-center gap-2 self-start md:self-auto" [class.opacity-50]="translationService.isTranslating()">
          <button
            [disabled]="translationService.isTranslating()"
            (click)="(!translationService.isTranslating()) && translationService.useGoogleSearch.set(!translationService.useGoogleSearch())"
            (keyup.enter)="(!translationService.isTranslating()) && translationService.useGoogleSearch.set(!translationService.useGoogleSearch())"
            tabindex="0"
            class="relative inline-block h-4 w-7 rounded-full transition-colors focus:outline-none shadow-none border border-slate-700"
            [class.cursor-pointer]="!translationService.isTranslating()"
            [class.cursor-not-allowed]="translationService.isTranslating()"
            [class.bg-blue-600]="translationService.useGoogleSearch()"
            [class.bg-slate-800]="!translationService.useGoogleSearch()"
          >
            <span
              class="absolute top-[1px] h-3 w-3 rounded-full bg-slate-200 transition-all duration-200 shadow-sm"
              [class.left-[13px]]="translationService.useGoogleSearch()"
              [class.left-[1px]]="!translationService.useGoogleSearch()"
              [class.bg-white]="translationService.useGoogleSearch()"
            ></span>
          </button>
          <span 
            class="text-[10px] font-medium" 
            [class.cursor-pointer]="!translationService.isTranslating()"
            [class.cursor-not-allowed]="translationService.isTranslating()"
            (click)="(!translationService.isTranslating()) && translationService.useGoogleSearch.set(!translationService.useGoogleSearch())"
            (keyup.enter)="(!translationService.isTranslating()) && translationService.useGoogleSearch.set(!translationService.useGoogleSearch())"
            tabindex="0"
            [class.text-slate-500]="!translationService.useGoogleSearch()" 
            [class.text-blue-500]="translationService.useGoogleSearch()"
          >+Search</span>
          
          <!-- Tooltip -->
          <span class="absolute bottom-full right-0 mb-3 w-[220px] whitespace-normal px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left border border-slate-700">
            <span class="font-bold" [class.text-blue-400]="translationService.useGoogleSearch()" [class.text-slate-400]="!translationService.useGoogleSearch()">[{{ translationService.useGoogleSearch() ? 'Đang bật' : 'Đang tắt' }}]</span> Đa số các video thông thường không cần bật tính năng này. Bật công cụ tìm kiếm cho AI sẽ hữu ích nhất cho nội dung có tính chuyên ngành cao hoặc nội dung có tính thời sự cao cần cập nhật thông tin mới nhất. Tính năng này đang bị hạn chế trên tài khoản miễn phí, bất kể model đang dùng là gì.
            <!-- Arrow -->
            <span class="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></span>
          </span>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  translationService = inject(TranslationService);
  appState = inject(AppStateService);
  historyService = inject(HistoryService);
}
