import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { AppStateService } from "./app.state.service";
import { FileService } from "./file.service";
import { TranslationService } from "./translation.service";
import { PlayerService } from "./player.service";
import { SubtitleService } from "./subtitle.service";
import { ToastService } from "./toast.service";
import { TranscriptViewerComponent } from "./transcript-viewer.component";
import { VideoService } from "./video.service";
import { isPlatformBrowser } from "@angular/common";
import { PLATFORM_ID } from "@angular/core";

@Component({
  selector: "app-control-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, TranscriptViewerComponent],
  template: `
    <div
      class="flex-[1.2] flex flex-col gap-6 shrink-0 md:min-w-[300px] lg:min-w-[400px] h-full overflow-y-auto overflow-x-hidden pr-2 pb-4 pt-1 custom-scrollbar-lg"
    >
      <!-- YouTube Link Input -->
      <div
        class="relative w-full transition-all duration-700 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
      >
        <input
          type="text"
          [value]="videoUrl()"
          (input)="onVideoUrlChange($any($event.target).value)"
          [disabled]="isAnalyzing() || translationService.isTranslating()"
          placeholder="Dán link Video YouTube vào đây..."
          class="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-[16px] leading-[20px] truncate disabled:opacity-50 pr-12 placeholder-slate-500 shadow-sm font-medium"
        />
        @if (videoUrl()) {
        <button
          (click)="clearAllData()"
          [disabled]="translationService.isTranslating()"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          title="Thiết lập lại / Xóa Link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        }
      </div>

      <!-- Upload SRT Card (Moved from Left) -->
      <div
        class="bg-slate-900/80 p-5 rounded-2xl border transition-all duration-700 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
        [class.shadow-sm]="fileService.selectedEnFile() || fileService.selectedViFile() || !videoId()"
        [class.border-slate-700]="fileService.selectedEnFile() || fileService.selectedViFile() || !videoId()"
        [class.border-yellow-500]="videoId() && !fileService.selectedEnFile() && !fileService.selectedViFile()"
        [style.box-shadow]="(videoId() && !fileService.selectedEnFile() && !fileService.selectedViFile()) ? 'inset 0 0 40px rgba(234, 179, 8, 0.15), 0 0 15px rgba(234, 179, 8, 0.2)' : ''"
        [class.opacity-50]="translationService.isTranslating()"
        [class.pointer-events-none]="translationService.isTranslating()"
      >
        <div class="flex items-center gap-1.5 mb-3">
          <span class="block text-sm font-bold text-white"
            >Tải lên phụ đề tiếng Anh (.srt)</span
          >
          <div
            class="group relative flex items-center justify-center cursor-help ml-1"
          >
            <!-- Hộp cảnh báo sinh động thay cho Icon mờ nhạt -->
            <div
              class="relative flex items-center gap-1.5 bg-red-900/30 border border-red-500/30 px-2 py-0.5 rounded-full group-hover:bg-red-900/50 transition-colors shadow-sm"
            >
              <div class="relative flex h-3 w-3 items-center justify-center">
                <!-- Hiệu ứng tỏa sóng (Ping) liên tục -->
                @if (videoId() && !fileService.selectedEnFile() && !fileService.selectedViFile()) {
                <div
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"
                ></div>
                }
                <div
                  class="relative inline-flex items-center justify-center w-3.5 h-3.5 bg-red-600 rounded-full text-white"
                >
                  <span class="text-[9px] font-bold font-serif italic">i</span>
                </div>
              </div>
              <span
                class="text-[11px] font-medium text-red-400 leading-none mt-0.5 whitespace-nowrap"
                >Lấy ở đâu?</span
              >
            </div>

            <!-- Bảng Tooltip (mở xuống dưới) -->
            <div
              class="absolute top-full mt-2.5 right-0 w-max max-w-[250px] bg-slate-800 text-white text-xs font-medium p-3 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-[100] text-center leading-relaxed origin-top-right"
            >
              <!-- Mũi tên trỏ lên trên của Tooltip -->
              <div
                class="absolute bottom-full right-8 border-[6px] border-transparent border-b-slate-800"
              ></div>
              Tìm công cụ tải phụ đề trên mạng với từ khóa:<br /><span
                class="text-yellow-400 font-bold tracking-wide"
                >"download youtube subtitles"</span
              ><br />
              Hãy nhớ tải về định dạng .srt để phù hợp với công cụ này.
            </div>
          </div>
        </div>

        <div class="flex gap-3 relative max-w-full">
          <input
            type="file"
            accept=".srt"
            (change)="onEnFileSelected($event)"
            #enFileUploader
            [disabled]="translationService.isTranslating()"
            class="flex-1 w-full min-w-0 text-sm file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-all duration-300 font-medium cursor-pointer border rounded-xl overflow-hidden text-ellipsis whitespace-nowrap"
            [class.border-slate-200]="!fileService.selectedEnFile()"
            [class.bg-slate-50]="!fileService.selectedEnFile()"
            [class.text-slate-500]="!fileService.selectedEnFile()"
            [class.file:bg-slate-100]="!fileService.selectedEnFile()"
            [class.file:text-slate-700]="!fileService.selectedEnFile()"
            [class.hover:file:bg-slate-200]="!fileService.selectedEnFile()"
            [class.border-red-300]="fileService.selectedEnFile()"
            [class.bg-red-50/50]="fileService.selectedEnFile()"
            [class.text-red-800]="fileService.selectedEnFile()"
            [class.file:bg-red-100]="fileService.selectedEnFile()"
            [class.file:text-red-700]="fileService.selectedEnFile()"
            [class.hover:file:bg-red-200]="fileService.selectedEnFile()"
          />
          @if (fileService.selectedEnFile()) {
          <button
            (click)="clearEnSubtitleFile($event)"
            [disabled]="translationService.isTranslating()"
            class="absolute right-2.5 top-[7px] p-1.5 text-red-500 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            title="Hủy chọn File"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          }
        </div>

        <!-- Extra Context Section -->
        <div class="mt-4 border-t border-slate-700 pt-4 relative group/flashlock w-full">
          
          @if (translationService.aiModel() === 'gemini-flash-latest') {
            <div class="absolute inset-0 z-50 cursor-not-allowed"></div>
            <div class="absolute top-3 left-1/2 -translate-x-1/2 -translate-y-full w-max max-w-[200px] opacity-0 group-hover/flashlock:opacity-100 transition-opacity pointer-events-none z-[100]">
                <span class="block bg-slate-800 text-white text-[11px] font-medium p-2 rounded-lg shadow-xl relative text-center leading-relaxed">
                    Model Flash không đủ sức mạnh tính toán cho tác vụ Thêm bối cảnh. Nếu muốn dùng, bạn hãy chuyển sang model Pro (icon hình đầu người).
                    <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></span>
                </span>
            </div>
          }

          <div class="flex flex-col gap-3 w-full transition-opacity duration-300"
               [class.opacity-40]="translationService.aiModel() === 'gemini-flash-latest'"
               [class.pointer-events-none]="translationService.aiModel() === 'gemini-flash-latest'">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[13px] font-bold text-slate-300 block"
                >Thêm bối cảnh (không bắt buộc)</span
              >
            <div
              class="group relative flex items-center justify-center cursor-help ml-0.5"
            >
              <div
                class="relative flex h-3.5 w-3.5 items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors rounded-full text-slate-400"
              >
                <span class="text-[9px] font-bold font-serif italic">i</span>
              </div>
              <div
                class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-max max-w-[280px] bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-[100] text-center leading-relaxed origin-bottom"
              >
                Cung cấp thêm audio gốc của phụ đề giúp dịch phụ đề được tốt hơn đáng kể trong một số trường hợp nhất định (ví dụ như có nhiều người nói), nhưng tùy chọn này không phải là yêu cầu bắt buộc. Ngoài ra: Thêm bối cảnh chỉ bật được với model Pro (tư duy sâu), model Flash không đủ sức mạnh tính toán.
                <!-- Arrow -->
                <div
                  class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800"
                ></div>
              </div>
            </div>
          </div>

          <!-- Audio Toggle Box -->
          <div class="w-full border-b border-slate-700 pb-2 flex justify-center">
            <button
              (click)="toggleAudioUpload()"
              [disabled]="translationService.isTranslating()"
              class="text-[13px] text-left w-fit transition-colors cursor-pointer disabled:cursor-default underline underline-offset-4 hover:decoration-slate-400"
              [class.text-pink-400]="fileService.showAudioUpload()"
              [class.font-bold]="fileService.showAudioUpload()"
              [class.decoration-pink-500]="fileService.showAudioUpload()"
              [class.text-slate-400]="!fileService.showAudioUpload()"
              [class.font-medium]="!fileService.showAudioUpload()"
              [class.decoration-slate-600]="!fileService.showAudioUpload()"
              [class.hover:text-slate-200]="!fileService.showAudioUpload()"
            >
              Tải lên Audio bối cảnh (tùy chọn)
            </button>
          </div>

          <!-- Full Width Upload Boxes -->

          <!-- Audio Box -->
          @if (fileService.showAudioUpload()) {
            <div
              class="w-full flex flex-col gap-3 p-3 bg-pink-900/20 border border-pink-500/20 rounded-xl relative transition-opacity min-h-[90px]"
            >
              <div class="flex justify-between items-center px-1">
                <span class="text-xs font-semibold text-pink-400"
                  >Âm thanh (<span class="cursor-help border-b border-dotted border-pink-500/50" title="Tối đa 30 phút / 60MB">chi tiết</span>):</span
                >
                @if (!fileService.selectedAudioFile()) {
                <button
                  (click)="fileService.showAudioUpload.set(false)"
                  class="text-pink-400 hover:text-pink-600 focus:outline-none cursor-pointer"
                  title="Đóng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                }
              </div>
              <div class="flex gap-3 relative w-full h-[36px]">
                <input
                  type="file"
                  accept="audio/*"
                  (change)="onAudioFileSelected($event)"
                  #audioFileUploader
                  [disabled]="translationService.isTranslating()"
                  class="flex-1 w-full min-w-0 text-[13px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold transition-all duration-300 font-medium cursor-pointer border rounded-lg overflow-hidden text-ellipsis whitespace-nowrap"
                  [class.border-pink-500/30]="!fileService.selectedAudioFile()"
                  [class.text-pink-400]="!fileService.selectedAudioFile()"
                  [class.bg-slate-800]="!fileService.selectedAudioFile()"
                  [class.file:bg-pink-900/40]="!fileService.selectedAudioFile()"
                  [class.file:text-pink-300]="!fileService.selectedAudioFile()"
                  [class.hover:file:bg-pink-900/60]="!fileService.selectedAudioFile()"
                  [class.border-pink-500/60]="fileService.selectedAudioFile()"
                  [class.text-pink-300]="fileService.selectedAudioFile()"
                  [class.bg-pink-900/20]="fileService.selectedAudioFile()"
                  [class.file:bg-pink-700]="fileService.selectedAudioFile()"
                  [class.file:text-white]="fileService.selectedAudioFile()"
                  [class.hover:file:bg-pink-600]="fileService.selectedAudioFile()"
                />
                @if (fileService.selectedAudioFile()) {
                <button
                  (click)="clearAudioFile($event)"
                  [disabled]="translationService.isTranslating()"
                  class="absolute right-2.5 top-[3px] p-1.5 text-pink-400 hover:text-pink-300 hover:bg-pink-900/50 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  title="Hủy chọn File"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                }
              </div>
            </div>
          }

          @if (fileService.showAudioUpload()) {
            <div class="text-[12px] text-pink-300 bg-pink-900/30 border border-pink-500/30 px-3 py-2 rounded-lg flex items-start gap-2 shadow-sm mb-3 relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-pink-500"></div>
                <div class="w-[13px] h-[13px] rounded-full bg-pink-500 flex items-center justify-center shrink-0 mt-[3px]">
                <span class="text-white text-[10px] font-bold font-serif italic leading-none">i</span>
                </div>
                <span class="w-full text-pink-200 leading-snug">
                <b>Lưu ý:</b> 10 phút Audio tốn khoảng 7 - 15 ngàn token đầu vào. Việc thêm audio bối cảnh là tùy chọn để gia tăng chất lượng dịch. Không phải là yêu cầu bắt buộc khi dịch phụ đề. Tính năng này thường hữu ích nhất khi nội dung có nhiều người nói. Hầu hết các định dạng audio đều được chấp nhận, ví dụ: .mp3, .m4a, .wav, .ogg, .flac, .aac, v.v..
                </span>
            </div>
          }
        </div>

        @if (analyzeError()) {
        <p
          class="mt-3 text-sm text-red-400 bg-red-900/30 px-3 py-2 rounded-lg border border-red-500/30"
        >
          {{ analyzeError() }}
        </p>
        }
      </div>
    </div>

      <!-- Optional VN Subtitle Upload Card -->
      <div
        class="p-5 rounded-2xl border transition-all duration-700 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
        [class.bg-slate-800/50]="!fileService.selectedViFile()"
        [class.border-slate-700]="!fileService.selectedViFile()"
        [class.border-dashed]="!fileService.selectedViFile()"
        [class.shadow-sm]="fileService.selectedViFile()"
        [class.border-solid]="fileService.selectedViFile()"
        [class.border-cyan-500/50]="fileService.selectedViFile()"
        [class.bg-cyan-900/20]="fileService.selectedViFile()"
        [class.opacity-50]="translationService.isTranslating()"
        [class.pointer-events-none]="translationService.isTranslating()"
      >
        <div class="w-full">
          @if (!fileService.showViUpload()) {
          <div class="flex items-center gap-1.5">
            <button
              (click)="fileService.showViUpload.set(true)"
              [disabled]="translationService.isTranslating()"
              class="text-[14px] text-left w-fit text-slate-400 hover:text-slate-300 font-medium hover:underline underline-offset-4 hover:decoration-slate-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              Sử dụng phụ đề tiếng Việt có sẵn
            </button>
            <div class="group relative flex items-center justify-center cursor-help ml-0.5">
              <div class="relative flex h-3.5 w-3.5 items-center justify-center bg-slate-200 hover:bg-slate-300 transition-colors rounded-full text-slate-500">
                <span class="text-[9px] font-bold font-serif italic">i</span>
              </div>
              <div class="absolute bottom-full mb-1.5 right-0 w-max max-w-[220px] bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-[100] text-center leading-relaxed origin-bottom-right">
                Nếu bạn đã có sẵn bản dịch tiếng Việt cho phụ đề và muốn xem lại với video trên YouTube.
                <!-- Arrow -->
                <div class="absolute top-full right-[3px] border-[5px] border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
          }
          @if (fileService.showViUpload()) {
          <div
            class="w-full flex flex-col gap-3 relative"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[14px] font-medium text-slate-400"
                >Sử dụng phụ đề tiếng Việt có sẵn</span
              >
              <div class="group relative flex items-center justify-center cursor-help ml-0.5">
                <div class="relative flex h-3.5 w-3.5 items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors rounded-full text-slate-400">
                  <span class="text-[9px] font-bold font-serif italic">i</span>
                </div>
                <div class="absolute bottom-full mb-1.5 right-0 w-max max-w-[220px] bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-[100] text-center leading-relaxed origin-bottom-right">
                  Nếu bạn đã có sẵn bản dịch tiếng Việt cho phụ đề và muốn xem lại với video trên YouTube.
                  <!-- Arrow -->
                  <div class="absolute top-full right-[3px] border-[5px] border-transparent border-t-slate-800"></div>
                </div>
              </div>
              @if (!fileService.selectedViFile() && !fileService.selectedEnFile()) {
              <button
                (click)="fileService.showViUpload.set(false)"
                class="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer ml-auto bg-cyan-900/30 hover:bg-cyan-900/50 p-1 rounded-full transition-colors"
                title="Đóng tùy chọn này"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </button>
              }
            </div>
            <div class="flex gap-3 relative max-w-full">
              <input
                type="file"
                accept=".srt"
                (change)="onViFileSelected($event)"
                #viFileUploader
                [disabled]="translationService.isTranslating()"
                class="flex-1 w-full min-w-0 text-sm file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-all duration-300 font-medium cursor-pointer border rounded-xl overflow-hidden text-ellipsis whitespace-nowrap"
                [class.border-slate-700]="!fileService.selectedViFile()"
                [class.bg-slate-800]="!fileService.selectedViFile()"
                [class.text-slate-400]="!fileService.selectedViFile()"
                [class.file:bg-slate-700]="!fileService.selectedViFile()"
                [class.file:text-slate-300]="!fileService.selectedViFile()"
                [class.hover:file:bg-slate-600]="!fileService.selectedViFile()"
                [class.border-cyan-500/50]="fileService.selectedViFile()"
                [class.bg-cyan-900/20]="fileService.selectedViFile()"
                [class.text-cyan-300]="fileService.selectedViFile()"
                [class.file:bg-cyan-900/40]="fileService.selectedViFile()"
                [class.file:text-cyan-300]="fileService.selectedViFile()"
                [class.hover:file:bg-cyan-900/60]="fileService.selectedViFile()"
              />
              @if (fileService.selectedViFile()) {
              <button
                (click)="clearViSubtitleFile($event)"
                [disabled]="translationService.isTranslating()"
                class="absolute right-2.5 top-[7px] p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/50 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                title="Hủy chọn File"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </button>
              }
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Detection Status -->
      <div
        class="bg-slate-900/80 p-5 rounded-2xl shadow-sm border border-slate-700 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
      >
        <h3
          class="text-sm font-bold text-white mb-4 flex items-center gap-2"
        >
          <svg
            class="w-4 h-4"
            [class.text-green-500]="analysisResult()"
            [class.text-slate-400]="!analysisResult()"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
          Trạng thái
        </h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">Phụ đề SRT</span>
            @if (analysisResult()) {
            <span
              class="font-mono font-medium text-green-400 bg-green-900/30 px-2 py-0.5 rounded"
              >{{ (fileService.selectedViFile() && !fileService.selectedEnFile()) ? 'Đã tải bản tiếng
              Việt' : 'Đã tải lên' }}</span
            >
            } @else if (analyzeError()) {
            <span
              class="font-mono font-medium text-red-400 bg-red-900/30 px-2 py-0.5 rounded"
              >Lỗi</span
            >
            } @else {
            <span
              class="font-mono font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded"
              >Đang chờ</span
            >
            }
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">Số phân đoạn</span>
            <span class="font-medium text-white"
              >{{ analysisResult()?.lines || 0 }} dòng</span
            >
          </div>
        </div>
      </div>

      <!-- Transcript Card -->
      <app-transcript-viewer class="contents" [exportSrtAction]="exportSrtAction" [exportPhase1Action]="exportPhase1Action" [startTranslatingAction]="startTranslatingAction"></app-transcript-viewer>
    </div>
  `
})
export class ControlPanelComponent {
  private platformId = inject(PLATFORM_ID);
  public appState = inject(AppStateService);
  public fileService = inject(FileService);
  public translationService = inject(TranslationService);
  public playerService = inject(PlayerService);
  public subtitleService = inject(SubtitleService);
  public toastService = inject(ToastService);
  public videoService = inject(VideoService);

  @ViewChild("enFileUploader") enFileUploader!: ElementRef<HTMLInputElement>;
  @ViewChild("viFileUploader") viFileUploader!: ElementRef<HTMLInputElement>;
  @ViewChild("audioFileUploader") audioFileUploader!: ElementRef<HTMLInputElement>;

  get videoUrl() { return this.appState.videoUrl; }
  get isAnalyzing() { return this.appState.isAnalyzing; }
  get analysisResult() { return this.appState.analysisResult; }
  get analyzeError() { return this.appState.analyzeError; }
  get isTranscriptExpanded() { return this.appState.isTranscriptExpanded; }
  get videoId() { return this.appState.videoId; }

  clearAllData() {
    this.appState.videoUrl.set("");
    this.clearSubtitleFiles();
    this.playerService.stopVideo();
  }

  clearEnSubtitleFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.fileService.clearEnFile(this.enFileUploader?.nativeElement);
    this.parseAndLoadFiles();
  }

  clearViSubtitleFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.fileService.clearViFile(this.viFileUploader?.nativeElement);
    this.parseAndLoadFiles();
  }

  toggleAudioUpload() {
    this.fileService.showAudioUpload.set(!this.fileService.showAudioUpload());
  }

  clearSubtitleFiles(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.appState.analysisResult.set(null);
    this.playerService.seekToZero();
    this.fileService.selectedEnFile.set(null);
    this.fileService.selectedViFile.set(null);
    this.fileService.selectedAudioFile.set(null);
    this.fileService.audioDuration.set(null);
    this.fileService.showViUpload.set(false);
    this.fileService.showAudioUpload.set(false);
    this.appState.analyzeError.set(null);
    this.translationService.resetState();

    if (this.enFileUploader && this.enFileUploader.nativeElement) {
      this.enFileUploader.nativeElement.value = "";
    }
    if (this.viFileUploader && this.viFileUploader.nativeElement) {
      this.viFileUploader.nativeElement.value = "";
    }
    if (this.audioFileUploader && this.audioFileUploader.nativeElement) {
      this.audioFileUploader.nativeElement.value = "";
    }
  }

  onVideoUrlChange(url: string) {
    this.appState.videoUrl.set(url);
    if (!url || url.trim() === "") {
      this.clearAllData();
    }
  }

  onEnFileSelected(event: Event) {
    this.fileService.onEnFileSelected(
      event,
      (extractedId) => {
        this.appState.videoUrl.set(`https://www.youtube.com/watch?v=${extractedId}`);
      },
      () => {
        this.parseAndLoadFiles();
      }
    );
  }

  onViFileSelected(event: Event) {
    this.fileService.onViFileSelected(
      event,
      (extractedId) => {
        this.appState.videoUrl.set(`https://www.youtube.com/watch?v=${extractedId}`);
      },
      (autoDetected) => {
        this.parseAndLoadFiles(autoDetected);
      }
    );
  }

  clearAudioFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.fileService.clearAudioFile(this.audioFileUploader?.nativeElement);
  }

  onAudioFileSelected(event: Event) {
    this.fileService.onAudioFileSelected(event);
  }

  private parseAndLoadFiles(autoDetected = false) {
    this.appState.isAnalyzing.set(true);
    this.appState.analyzeError.set(null);
    this.appState.analysisResult.set(null);

    const enFile = this.fileService.selectedEnFile();
    const viFile = this.fileService.selectedViFile();

    if (!enFile && !viFile) {
      this.appState.isAnalyzing.set(false);
      return;
    }

    Promise.all([
      enFile ? this.fileService.readFileAsText(enFile) : Promise.resolve(null),
      viFile ? this.fileService.readFileAsText(viFile) : Promise.resolve(null),
    ])
      .then(([enText, viText]) => {
        try {
          const mergedTranscript = this.subtitleService.mergeTranscripts(enText, viText);

          this.appState.analysisResult.set({
            lines: mergedTranscript.length,
            transcript: mergedTranscript,
          });

          if (!autoDetected) {
            this.playerService.seekToZero();
          }

          this.appState.isAnalyzing.set(false);
        } catch (err) {
          const error = err as Error;
          this.appState.analyzeError.set(error.message || "Lỗi khi đọc file SRT.");
          this.toastService.addToast("Lỗi khi đọc file SRT!", "error");
          this.appState.isAnalyzing.set(false);
        }
      })
      .catch((err) => {
        this.appState.analyzeError.set(err.message || "Lỗi đọc file.");
        this.toastService.addToast("Lỗi đọc file!", "error");
        this.appState.isAnalyzing.set(false);
      });
  }

  exportSrtAction = async () => {
    if (!isPlatformBrowser(this.platformId)) return;
    const res = this.appState.analysisResult();
    if (!res || !res.transcript) return;

    const srtContent = this.subtitleService.generateSrtContent(res.transcript);
    
    const model = this.translationService.aiModel();
    const temp = this.translationService.aiTemperature();
    const mode = this.translationService.translationMode() === 'lyric' ? 'lyric' : 'multi-task';
    const search = this.translationService.useGoogleSearch() ? 'search' : 'no-search';
    
    let fileName = `silaSub_vi_${this.appState.videoId() || "subtitles"}_[${model}]_[${temp}]_[${mode}]_[${search}].srt`;
    const videoIdStr = this.appState.videoId();

    if (videoIdStr) {
      const videoTitle = await this.videoService.fetchVideoTitle(videoIdStr);
      fileName = `silaSub_vi_${videoIdStr}_[${videoTitle}]_[${model}]_[${temp}]_[${mode}]_[${search}].srt`;
    }

    this.fileService.downloadFile(srtContent, fileName, "text/srt");

    this.toastService.addToast(
      `Đã tải thành công file Phụ đề Tiếng Việt: ${fileName} về máy.`,
      "success",
    );
  };

  exportPhase1Action = () => {
    if (!isPlatformBrowser(this.platformId)) return;
    const json = this.translationService.analyzedBlocksJson();
    const fileName = this.translationService.analyzedBlocksFileName() || "silaSub_blocks.json";
    if (json) {
       this.fileService.downloadFile(json, fileName, "application/json");
       this.toastService.addToast(
         `Đã tải file data ngữ cảnh cho dev: ${fileName}`,
         "success"
       );
    }
  };

  startTranslatingAction = async () => {
    return this.translationService.startTranslating(this.appState.analysisResult);
  };
}
