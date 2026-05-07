import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HistoryService, TranslationHistoryItem } from './history.service';
import { AppStateService } from './app.state.service';
import { FileService } from './file.service';
import { SubtitleService } from './subtitle.service';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (historyService.isHistoryModalOpen()) {
      <div 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        (click)="closeModal()"
      >
        <div 
          class="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto relative"
          (click)="$event.stopPropagation()"
        >
          <!-- Cảnh báo trên đầu -->
          <div class="bg-yellow-500/10 border-b border-yellow-500/20 p-4 shrink-0 flex items-start gap-3">
            <mat-icon class="text-[20px] w-[20px] h-[20px] text-yellow-500 shrink-0">warning_amber</mat-icon>
            <p class="text-xs text-yellow-200/80 leading-relaxed font-medium">
              Danh sách tối đa 10 bản dịch gần nhất của bạn. Dữ liệu chỉ được <strong class="text-yellow-400">lưu trữ cục bộ</strong> tại <strong class="text-yellow-400">trình duyệt bạn đang dùng</strong>, để tiện xem lại khi cần và có thể bị xóa nếu bạn xóa lịch sử duyệt web. Luôn chủ động tải file (.srt) về máy tính để lưu trữ vĩnh viễn và an toàn.
            </p>
          </div>

          <div class="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0 sticky top-0 z-10">
            <div class="flex items-center gap-4">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <mat-icon class="text-[20px] w-[20px] h-[20px] text-indigo-400">history</mat-icon>
                Lịch sử & Các bản dịch đang lưu
              </h2>
              @if (historyService.historyItems().length > 0) {
                @if (!isConfirmingClearAll) {
                  <button 
                    (click)="isConfirmingClearAll = true"
                    class="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors border border-red-500/20 cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                } @else {
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-red-400 font-medium tracking-tight">Chắc chắn xóa?</span>
                    <button 
                      (click)="clearAll()"
                      class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors border border-red-500 shadow-sm cursor-pointer"
                    >
                      Xóa
                    </button>
                    <button 
                      (click)="isConfirmingClearAll = false"
                      class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                }
              }
            </div>
            <div class="flex items-center gap-2">
              <button 
                (click)="closeModal()"
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
              </button>
            </div>
          </div>

          <div class="overflow-y-auto p-3 overflow-x-hidden flex-1">
            @if (historyService.historyItems().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <mat-icon class="text-[48px] w-[48px] h-[48px] text-slate-700">inventory_2</mat-icon>
                <p class="text-sm font-medium">Bạn chưa lưu bản dịch nào.</p>
              </div>
            } @else {
              <div class="flex flex-col gap-2">
                @for (item of historyService.historyItems(); track item.id) {
                  <div class="group relative flex items-center bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-3 transition-all">
                    
                    <!-- Main content layout -->
                    <div class="flex-1 min-w-0 pr-4">
                      
                      <!-- Video title with truncation -->
                      <h3 
                        class="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate w-[calc(100%-100px)] cursor-pointer"
                        title="{{ item.videoName }}"
                        (click)="loadItem(item)"
                      >
                        {{ item.videoName }}
                      </h3>
                      
                      <!-- Below title context info -->
                      <div class="flex items-center gap-3 mt-1.5 whitespace-nowrap overflow-hidden pr-2">
                        <span class="text-[10px] bg-slate-900 py-0.5 px-2 rounded-md text-slate-400 font-mono tracking-tight shadow-sm min-w-max border border-slate-700">
                          {{ item.dateStr }}
                        </span>
                        
                        @if (item.youtubeUrl) {
                          <a 
                            [href]="item.youtubeUrl" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            class="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 hover:underline min-w-0 truncate"
                            (click)="$event.stopPropagation()"
                          >
                            <mat-icon class="text-[14px] w-[14px] h-[14px] flex-none text-red-500">smart_display</mat-icon>
                            <span class="truncate">Xem YouTube</span>
                          </a>
                        } @else {
                          <span class="flex items-center gap-1.5 text-[11px] text-slate-500 italic block mt-0.5">
                            <mat-icon class="text-[14px] w-[14px] h-[14px] text-slate-600 block mt-[-1px]">link_off</mat-icon>
                            Không có link gốc
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Right side Actions (Load and Delete) -->
                    <div class="flex flex-col items-end gap-2 shrink-0 self-start mt-0.5">
                      @if (deletingItemId !== item.id) {
                        <button 
                          (click)="confirmDelete(item.id, $event)"
                          class="p-1 rounded bg-slate-800 text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors border border-transparent shadow-none cursor-pointer"
                          title="Xóa lịch sử này"
                        >
                          <mat-icon class="text-[16px] w-[16px] h-[16px]">delete_outline</mat-icon>
                        </button>
                      } @else {
                        <div class="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded p-0.5" (click)="$event.stopPropagation()">
                          <button (click)="deleteItem(item.id, $event)" class="text-[10px] text-white bg-red-600/90 hover:bg-red-500 px-2 py-0.5 rounded transition cursor-pointer">Xóa</button>
                          <button (click)="cancelDelete($event)" class="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded transition cursor-pointer">Hủy</button>
                        </div>
                      }
                      <button 
                        (click)="loadItem(item)"
                        class="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-sm border border-indigo-500 transition-all cursor-pointer"
                      >
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">refresh</mat-icon>
                        Nạp lại
                      </button>
                    </div>

                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class HistoryModalComponent {
  historyService = inject(HistoryService);
  appState = inject(AppStateService);
  fileService = inject(FileService);
  subtitleService = inject(SubtitleService);

  isConfirmingClearAll = false;
  deletingItemId: number | null = null;

  closeModal() {
    this.historyService.isHistoryModalOpen.set(false);
    this.isConfirmingClearAll = false;
    this.deletingItemId = null;
  }

  confirmDelete(id: number, event: Event) {
    event.stopPropagation();
    this.deletingItemId = id;
  }

  cancelDelete(event: Event) {
    event.stopPropagation();
    this.deletingItemId = null;
  }

  deleteItem(id: number, event: Event) {
    event.stopPropagation();
    this.historyService.deleteItem(id);
    this.deletingItemId = null;
  }

  clearAll() {
    this.historyService.clearHistory();
    this.isConfirmingClearAll = false;
  }

  async loadItem(item: TranslationHistoryItem) {
    // Convert text contents to File objects (so the logic is preserved)
    const enFile = new File([item.enSrtContent], item.videoName + ".srt", { type: "text/plain" });
    const viFile = new File([item.viSrtContent], "silaSub_vi_" + (item.youtubeUrl ? this.extractIdSafe(item.youtubeUrl) : "local") + ".srt", { type: "text/plain" });

    this.fileService.selectedEnFile.set(enFile);
    this.fileService.selectedViFile.set(viFile);

    if (item.youtubeUrl) {
      this.appState.videoUrl.set(item.youtubeUrl);
    } else {
      this.appState.videoUrl.set("");
    }

    // Force analysis
    const enTrans = this.subtitleService.parseSRT(item.enSrtContent, false);
    const viTrans = this.subtitleService.parseSRT(item.viSrtContent, true);

    // Merge logic
    if (enTrans && viTrans) {
       for (let i = 0; i < enTrans.length; i++) {
        const matchingVi = viTrans.find((vt: any) => vt.offset === enTrans[i].offset);
        if (matchingVi) {
          enTrans[i].viText = matchingVi.text;
        }
      }
      this.appState.analysisResult.set({
        lines: enTrans.length,
        transcript: enTrans
      });
      // Ensure we clear out old translations/modes since we are loading an explicitly completed one
      this.appState.isAnalyzing.set(false);
      this.historyService.isHistoryModalOpen.set(false);
    }
  }

  private extractIdSafe(url: string) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : "abcdefghijk";
  }
}
