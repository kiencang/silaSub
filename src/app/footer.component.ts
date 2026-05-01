import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslationService } from "./translation.service";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-slate-900 border-t border-slate-800 py-3 md:py-[10px] px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-2 md:gap-0">
      <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
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
          <span class="absolute bottom-full left-0 mb-3 w-[220px] whitespace-normal px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left border border-slate-700">
            <span class="font-bold" [class.text-blue-400]="translationService.useGoogleSearch()" [class.text-slate-400]="!translationService.useGoogleSearch()">[{{ translationService.useGoogleSearch() ? 'Đang bật' : 'Đang tắt' }}]</span> Cho phép AI giải nghĩa thuật ngữ, tiếng lóng, tên riêng bằng thông tin mạng, giúp bản dịch chính xác và tự nhiên hơn. Rất khuyến nghị bật, dù sẽ tốn thêm chi phí/thời gian một chút so với khi tắt.
            <!-- Arrow -->
            <span class="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></span>
          </span>
        </div>

        <p class="text-[10px] text-slate-500 font-medium md:border-l md:border-slate-800 md:pl-6 leading-relaxed">
        Nguyễn Đức Anh • Dùng tốt nhất với Chrome, màn hình lớn
        </p>
      </div>
      <p class="text-[10px] text-slate-500 font-medium mt-1 md:mt-0">
        Chỉ dùng cho mục đích cá nhân • v1.0.50 •
        <a href="https://github.com/kiencang/silaSub" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-slate-400 underline-offset-2 transition-colors duration-200">GitHub</a>
      </p>
    </footer>
  `
})
export class FooterComponent {
  translationService = inject(TranslationService);
}
