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
      class="flex-[1.2] flex flex-col gap-6 shrink-0 md:min-w-[300px] lg:min-w-[400px] h-full overflow-y-auto pr-2 pb-4 pt-1 custom-scrollbar-lg"
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
          class="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-[16px] leading-[20px] truncate disabled:opacity-50 pr-12 placeholder-slate-400 shadow-sm font-medium"
        />
        @if (videoUrl()) {
        <button
          (click)="clearAllData()"
          [disabled]="translationService.isTranslating()"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
        class="bg-white p-5 rounded-2xl border transition-all duration-700 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
        [class.shadow-sm]="fileService.selectedEnFile() || fileService.selectedViFile() || !videoId()"
        [class.border-slate-200]="fileService.selectedEnFile() || fileService.selectedViFile() || !videoId()"
        [class.border-yellow-400]="videoId() && !fileService.selectedEnFile() && !fileService.selectedViFile()"
        [style.box-shadow]="(videoId() && !fileService.selectedEnFile() && !fileService.selectedViFile()) ? 'inset 0 0 40px rgba(234, 179, 8, 0.25), 0 0 15px rgba(234, 179, 8, 0.3)' : ''"
        [class.opacity-50]="translationService.isTranslating()"
        [class.pointer-events-none]="translationService.isTranslating()"
      >
        <div class="flex items-center gap-1.5 mb-3">
          <span class="block text-sm font-bold text-slate-800"
            >Tải lên phụ đề tiếng Anh (.srt)</span
          >
          <div
            class="group relative flex items-center justify-center cursor-help ml-1"
          >
            <!-- Hộp cảnh báo sinh động thay cho Icon mờ nhạt -->
            <div
              class="relative flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full group-hover:bg-red-100 transition-colors shadow-sm"
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
                class="text-[11px] font-medium text-red-600 leading-none mt-0.5 whitespace-nowrap"
                >Lấy ở đâu?</span
              >
            </div>

            <!-- Bảng Tooltip (mở xuống dưới) -->
            <div
              class="absolute top-full mt-2.5 right-0 w-max max-w-[250px] bg-slate-800 text-white text-xs font-medium p-3 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 text-center leading-relaxed origin-top-right"
            >
              <!-- Mũi tên trỏ lên trên của Tooltip -->
              <div
                class="absolute bottom-full right-8 border-[6px] border-transparent border-b-slate-800"
              ></div>
              Tìm công cụ tải phụ đề trên mạng với từ khóa:<br /><span
                class="text-yellow-400 font-bold tracking-wide"
                >"download youtube subtitles"</span
              >
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
            class="absolute right-2.5 top-[7px] p-1.5 text-red-400 hover:text-red-600 hover:bg-white/50 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
        <div class="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-3 w-full">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[13px] font-bold text-slate-700 block"
              >Thêm bối cảnh (không bắt buộc)</span
            >
            <div
              class="group relative flex items-center justify-center cursor-help ml-0.5"
            >
              <div
                class="relative flex h-3.5 w-3.5 items-center justify-center bg-slate-200 hover:bg-slate-300 transition-colors rounded-full text-slate-500"
              >
                <span class="text-[9px] font-bold font-serif italic">i</span>
              </div>
              <div
                class="absolute bottom-full mb-1.5 right-[-20px] w-max max-w-[280px] bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 text-center leading-relaxed origin-bottom-right"
              >
                Cung cấp thêm audio hoặc video gốc của phụ đề giúp dịch phụ đề được tốt hơn đáng kể trong một số trường hợp nhất định, nhưng điều này không phải là yêu cầu bắt buộc.
                <!-- Arrow -->
                <div
                  class="absolute top-full right-[23px] border-[5px] border-transparent border-t-slate-800"
                ></div>
              </div>
            </div>
          </div>

          <!-- Audio & Video Box Toggles -->
          <div class="grid grid-cols-2 gap-4 w-full border-b border-slate-100 pb-2">
            <!-- Audio Toggle -->
            <div>
              <div class="relative group/abtn">
                <button
                  (click)="toggleAudioUpload()"
                  [disabled]="translationService.isTranslating() || !!fileService.selectedVideoFile()"
                  [class.opacity-40]="!!fileService.selectedVideoFile()"
                  [class.pointer-events-none]="!!fileService.selectedVideoFile()"
                  class="text-[13px] text-left w-fit transition-colors cursor-pointer disabled:cursor-default underline underline-offset-4 hover:decoration-slate-400"
                  [class.text-pink-600]="fileService.showAudioUpload()"
                  [class.font-bold]="fileService.showAudioUpload()"
                  [class.decoration-pink-300]="fileService.showAudioUpload()"
                  [class.text-slate-600]="!fileService.showAudioUpload()"
                  [class.font-medium]="!fileService.showAudioUpload()"
                  [class.decoration-slate-300]="!fileService.showAudioUpload()"
                  [class.hover:text-slate-900]="!fileService.showAudioUpload()"
                >
                  Tải lên Audio (tùy chọn)
                </button>
                @if (fileService.selectedVideoFile()) {
                  <div class="absolute inset-x-0 bg-transparent flex opacity-0 group-hover/abtn:opacity-100 transition-opacity z-10 -translate-y-7 left-0 top-0">
                    <span class="bg-black/80 text-white text-[11px] px-2 py-1 rounded shadow pointer-events-none relative z-20 whitespace-nowrap">Đã đăng tải Video</span>
                  </div>
                }
              </div>
            </div>

            <!-- Video Toggle -->
            <div>
              @if (translationService.translationMode() !== 'lyric') {
                <div class="relative group/vbtn">
                  <button
                    (click)="toggleVideoUpload()"
                    [disabled]="translationService.isTranslating() || !!fileService.selectedAudioFile()"
                    [class.opacity-40]="!!fileService.selectedAudioFile()"
                    [class.pointer-events-none]="!!fileService.selectedAudioFile()"
                    class="text-[13px] text-left w-fit transition-colors cursor-pointer disabled:cursor-default underline underline-offset-4 hover:decoration-slate-400"
                    [class.text-amber-600]="fileService.showVideoUpload()"
                    [class.font-bold]="fileService.showVideoUpload()"
                    [class.decoration-amber-300]="fileService.showVideoUpload()"
                    [class.text-slate-600]="!fileService.showVideoUpload()"
                    [class.font-medium]="!fileService.showVideoUpload()"
                    [class.decoration-slate-300]="!fileService.showVideoUpload()"
                    [class.hover:text-slate-900]="!fileService.showVideoUpload()"
                  >
                    Tải lên Video (tùy chọn)
                  </button>
                  @if (fileService.selectedAudioFile()) {
                    <div class="absolute inset-x-0 bg-transparent flex opacity-0 group-hover/vbtn:opacity-100 transition-opacity z-10 -translate-y-7 left-0 top-0">
                      <span class="bg-black/80 text-white text-[11px] px-2 py-1 rounded shadow pointer-events-none relative z-20 whitespace-nowrap">Đã đăng tải Âm thanh</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex items-center text-[13px] text-slate-400 pointer-events-none opacity-50 w-fit" title="Chế độ Tải lên Video bị vô hiệu hóa trong Dịch lời bài hát">
                    <button class="underline pr-2 underline-offset-4 decoration-slate-300">Tải lên Video (tùy chọn)</button>
                    <mat-icon class="text-[15px] w-[15px] h-[15px] mb-[2px]">lock</mat-icon>
                </div>
              }
            </div>
          </div>

          <!-- Full Width Upload Boxes -->

          <!-- Audio Box -->
          @if (fileService.showAudioUpload()) {
            <div
              class="w-full flex flex-col gap-3 p-3 bg-pink-50/50 border border-pink-100 rounded-xl relative transition-opacity min-h-[90px]"
            >
              <div class="flex justify-between items-center px-1">
                <span class="text-xs font-semibold text-pink-800"
                  >Âm thanh (<span class="cursor-help border-b border-dotted border-pink-800" title="Tối đa 30 phút / 40MB">chi tiết</span>):</span
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
                  [disabled]="translationService.isTranslating() || !!fileService.selectedVideoFile()"
                  class="flex-1 w-full min-w-0 text-[13px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold transition-all duration-300 font-medium cursor-pointer border rounded-lg overflow-hidden text-ellipsis whitespace-nowrap bg-white"
                  [class.border-pink-200]="!fileService.selectedAudioFile()"
                  [class.text-pink-500]="!fileService.selectedAudioFile()"
                  [class.file:bg-pink-100]="!fileService.selectedAudioFile()"
                  [class.file:text-pink-700]="!fileService.selectedAudioFile()"
                  [class.hover:file:bg-pink-200]="!fileService.selectedAudioFile()"
                  [class.border-pink-400]="fileService.selectedAudioFile()"
                  [class.text-pink-900]="fileService.selectedAudioFile()"
                  [class.file:bg-pink-600]="fileService.selectedAudioFile()"
                  [class.file:text-white]="fileService.selectedAudioFile()"
                  [class.hover:file:bg-pink-700]="fileService.selectedAudioFile()"
                />
                @if (fileService.selectedAudioFile()) {
                <button
                  (click)="clearAudioFile($event)"
                  [disabled]="translationService.isTranslating()"
                  class="absolute right-2.5 top-[3px] p-1.5 text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  title="Hủy chọn File"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                }
              </div>
            </div>
          }

          <!-- Video Box -->
          @if (fileService.showVideoUpload() && translationService.translationMode() !== 'lyric') {
            <div
              class="w-full flex flex-col gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl relative transition-opacity min-h-[90px]"
            >
              <div class="flex justify-between items-center px-1">
                <span class="text-xs font-semibold text-amber-800"
                  >Video (<span title="Tối đa 30 phút / 70MB" class="cursor-help border-b border-dotted border-amber-800">chi tiết</span>):</span
                >
                @if (!fileService.selectedVideoFile()) {
                <button
                  (click)="fileService.showVideoUpload.set(false)"
                  class="text-amber-400 hover:text-amber-600 focus:outline-none cursor-pointer"
                  title="Đóng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                }
              </div>
              <div class="flex gap-3 relative w-full h-[36px]">
                <input
                  type="file"
                  accept="video/*"
                  (change)="onVideoFileSelected($event)"
                  #videoFileUploader
                  [disabled]="translationService.isTranslating() || !!fileService.selectedAudioFile()"
                  class="flex-1 w-full min-w-0 text-[13px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold transition-all duration-300 font-medium cursor-pointer border rounded-lg overflow-hidden text-ellipsis whitespace-nowrap bg-white"
                  [class.border-amber-200]="!fileService.selectedVideoFile()"
                  [class.text-amber-500]="!fileService.selectedVideoFile()"
                  [class.file:bg-amber-100]="!fileService.selectedVideoFile()"
                  [class.file:text-amber-700]="!fileService.selectedVideoFile()"
                  [class.hover:file:bg-amber-200]="!fileService.selectedVideoFile()"
                  [class.border-amber-400]="fileService.selectedVideoFile()"
                  [class.text-amber-900]="fileService.selectedVideoFile()"
                  [class.file:bg-amber-600]="fileService.selectedVideoFile()"
                  [class.file:text-white]="fileService.selectedVideoFile()"
                  [class.hover:file:bg-amber-700]="fileService.selectedVideoFile()"
                />
                @if (fileService.selectedVideoFile()) {
                <button
                  (click)="removeVideoFile($event)"
                  [disabled]="translationService.isTranslating()"
                  class="absolute right-2.5 top-[3px] p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  title="Hủy chọn File"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                }
              </div>
            </div>
          }

          <div class="w-full mt-2">
            @if (fileService.showVideoUpload() && translationService.translationMode() !== 'lyric') {
               <div class="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-start gap-2 shadow-sm mb-3 relative overflow-hidden">
                 <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-300"></div>
                 <div class="w-[13px] h-[13px] rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-[3px]">
                   <span class="text-white text-[10px] font-bold font-serif italic leading-none">i</span>
                 </div>
                 <span class="w-full text-amber-900 leading-snug">
                   <b>Lưu ý:</b> Video tiêu tốn rất nhiều token đầu vào, một video 10 phút tốn khoảng 180 ngàn token đầu vào.
                 </span>
               </div>
            }
        </div>
        </div>

        @if (analyzeError()) {
        <p
          class="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100"
        >
          {{ analyzeError() }}
        </p>
        }
      </div>

      <!-- Optional VN Subtitle Upload Card -->
      <div
        class="p-5 rounded-2xl border transition-all duration-700 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
        [class.bg-slate-50/50]="!fileService.selectedViFile()"
        [class.border-slate-200]="!fileService.selectedViFile()"
        [class.border-dashed]="!fileService.selectedViFile()"
        [class.shadow-sm]="fileService.selectedViFile()"
        [class.border-solid]="fileService.selectedViFile()"
        [class.border-indigo-300]="fileService.selectedViFile()"
        [class.bg-indigo-50]="fileService.selectedViFile()"
        [class.opacity-50]="translationService.isTranslating()"
        [class.pointer-events-none]="translationService.isTranslating()"
      >
        <div class="w-full">
          @if (!fileService.showViUpload()) {
          <div class="flex items-center gap-1.5">
            <button
              (click)="fileService.showViUpload.set(true)"
              [disabled]="translationService.isTranslating()"
              class="text-[14px] text-left w-fit text-slate-700 hover:text-slate-950 font-bold underline underline-offset-4 decoration-slate-300 hover:decoration-slate-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              Tải lên phụ đề tiếng Việt (tùy chọn)
            </button>
            <div class="group relative flex items-center justify-center cursor-help ml-0.5">
              <div class="relative flex h-3.5 w-3.5 items-center justify-center bg-slate-200 hover:bg-slate-300 transition-colors rounded-full text-slate-500">
                <span class="text-[9px] font-bold font-serif italic">i</span>
              </div>
              <div class="absolute bottom-full mb-1.5 right-[-20px] w-max max-w-[280px] bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 text-center leading-relaxed origin-bottom-right">
                Nếu bạn đã có sẵn bản dịch tiếng Việt cho phụ đề và muốn xem lại với video trên YouTube.
                <!-- Arrow -->
                <div class="absolute top-full right-[23px] border-[5px] border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
          }
          @if (fileService.showViUpload()) {
          <div
            class="w-full flex flex-col gap-3 relative"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[14px] font-bold text-slate-800"
                >Tải lên phụ đề tiếng Việt (tùy chọn)</span
              >
              <div class="group relative flex items-center justify-center cursor-help ml-0.5">
                <div class="relative flex h-3.5 w-3.5 items-center justify-center bg-slate-200 hover:bg-slate-300 transition-colors rounded-full text-slate-500">
                  <span class="text-[9px] font-bold font-serif italic">i</span>
                </div>
                <div class="absolute bottom-full mb-1.5 right-[-20px] w-max max-w-[280px] bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 text-center leading-relaxed origin-bottom-right">
                  Nếu bạn đã có sẵn bản dịch tiếng Việt cho phụ đề và muốn xem lại với video trên YouTube.
                  <!-- Arrow -->
                  <div class="absolute top-full right-[23px] border-[5px] border-transparent border-t-slate-800"></div>
                </div>
              </div>
              @if (!fileService.selectedViFile() && !fileService.selectedEnFile()) {
              <button
                (click)="fileService.showViUpload.set(false)"
                class="text-indigo-400 hover:text-indigo-600 focus:outline-none cursor-pointer ml-auto bg-indigo-50 hover:bg-indigo-100 p-1 rounded-full transition-colors"
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
                [class.border-slate-200]="!fileService.selectedViFile()"
                [class.bg-slate-50]="!fileService.selectedViFile()"
                [class.text-slate-500]="!fileService.selectedViFile()"
                [class.file:bg-slate-100]="!fileService.selectedViFile()"
                [class.file:text-slate-700]="!fileService.selectedViFile()"
                [class.hover:file:bg-slate-200]="!fileService.selectedViFile()"
                [class.border-indigo-300]="fileService.selectedViFile()"
                [class.bg-white]="fileService.selectedViFile()"
                [class.text-indigo-800]="fileService.selectedViFile()"
                [class.file:bg-indigo-100]="fileService.selectedViFile()"
                [class.file:text-indigo-700]="fileService.selectedViFile()"
                [class.hover:file:bg-indigo-200]="fileService.selectedViFile()"
              />
              @if (fileService.selectedViFile()) {
              <button
                (click)="clearViSubtitleFile($event)"
                [disabled]="translationService.isTranslating()"
                class="absolute right-2.5 top-[7px] p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
        class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0"
        [class.hidden]="isTranscriptExpanded()"
      >
        <h3
          class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"
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
            <span class="text-slate-500">Phụ đề SRT</span>
            @if (analysisResult()) {
            <span
              class="font-mono font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded"
              >{{ (fileService.selectedViFile() && !fileService.selectedEnFile()) ? 'Đã tải bản tiếng
              Việt' : 'Đã tải lên' }}</span
            >
            } @else if (analyzeError()) {
            <span
              class="font-mono font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded"
              >Lỗi</span
            >
            } @else {
            <span
              class="font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded"
              >Đang chờ</span
            >
            }
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">Số phân đoạn</span>
            <span class="font-medium text-slate-900"
              >{{ analysisResult()?.lines || 0 }} dòng</span
            >
          </div>
        </div>
      </div>

      <!-- Transcript Card -->
      <app-transcript-viewer class="contents" [exportSrtAction]="exportSrtAction" [startTranslatingAction]="startTranslatingAction"></app-transcript-viewer>
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
  @ViewChild("videoFileUploader") videoFileUploader!: ElementRef<HTMLInputElement>;

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
    if (this.fileService.showAudioUpload()) {
      this.fileService.showAudioUpload.set(false);
    } else {
      this.fileService.showAudioUpload.set(true);
      this.fileService.showVideoUpload.set(false);
    }
  }

  toggleVideoUpload() {
    if (this.fileService.showVideoUpload()) {
      this.fileService.showVideoUpload.set(false);
    } else {
      this.fileService.showVideoUpload.set(true);
      this.fileService.showAudioUpload.set(false);
    }
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
    this.fileService.selectedVideoFile.set(null);
    this.fileService.videoDuration.set(null);
    this.fileService.showViUpload.set(false);
    this.fileService.showAudioUpload.set(false);
    this.fileService.showVideoUpload.set(false);
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

  triggerVideoUpload() {
    this.videoFileUploader?.nativeElement.click();
  }

  removeVideoFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.fileService.clearVideoFile(this.videoFileUploader?.nativeElement);
  }

  onVideoFileSelected(event: Event) {
    this.fileService.onVideoFileSelected(event);
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

  startTranslatingAction = async () => {
    return this.translationService.startTranslating(this.appState.analysisResult);
  };
}
