import {ChangeDetectionStrategy, Component, signal, computed, OnDestroy, effect, OnInit, PLATFORM_ID, inject, ViewChild, ElementRef} from '@angular/core';
import {isPlatformBrowser, DecimalPipe} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const AI_MODEL_VERSION = 'gemini-pro-latest';
const SETTINGS_STORAGE_KEY = 'silaSub_v1_prefs_8f9a2b';

export interface TranscriptLine {
  text: string;
  viText?: string;
  duration: number;
  offset: number;
}

export type ToastType = 'success' | 'error' | 'warning';
export interface ToastInfo {
  id: string;
  message: string;
  type: ToastType;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, HttpClientModule, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy, OnInit {
  private platformId = inject(PLATFORM_ID);
  
  @ViewChild('fileUploader') fileUploader!: ElementRef<HTMLInputElement>;

  videoUrl = signal('');
  selectedFile = signal<File | null>(null);
  isVietnameseFile = signal(false); // Flag if the uploaded file is already Vietnamese
  
  aiTemperature = signal<number>(0.5); // AI Temperature parameter

  // Settings State
  isSettingsOpen = signal(false);
  subFontSize = signal<number>(30);
  subFontFamily = signal<string>('Inter');
  subBgOpacity = signal<number>(0.5);
  subVerticalOffset = signal<number>(2); // 2rem default
  private backupSettings = { size: 30, font: 'Inter', opacity: 0.5, offset: 2 };

  isAnalyzing = signal(false);
  analysisResult = signal<{lines: number, transcript: TranscriptLine[]} | null>(null);
  analyzeError = signal<string | null>(null);

  isTranslating = signal(false);
  translateError = signal<string | null>(null);

  toasts = signal<ToastInfo[]>([]);

  addToast(message: string, type: ToastType = 'error') {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts.update(current => [...current, { id, message, type }]);
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
  
  // Settings Logic
  openSettings() {
    this.backupSettings = {
      size: this.subFontSize(),
      font: this.subFontFamily(),
      opacity: this.subBgOpacity(),
      offset: this.subVerticalOffset()
    };
    this.isSettingsOpen.set(true);
  }

  closeSettings(action: 'save' | 'reset' | 'cancel') {
    this.isSettingsOpen.set(false);
    if (action === 'save') {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
          size: this.subFontSize(),
          font: this.subFontFamily(),
          opacity: this.subBgOpacity(),
          offset: this.subVerticalOffset()
        }));
      }
      this.addToast('Lưu cài đặt thành công!', 'success');
    } else if (action === 'reset') {
      // Khôi phục về thông số mặc định nguyên thuỷ
      this.subFontSize.set(30);
      this.subFontFamily.set('Inter');
      this.subBgOpacity.set(0.5);
      this.subVerticalOffset.set(2);
      // Xoá memory trong localStorage
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
      this.addToast('Đã khôi phục cài đặt gốc', 'success');
    } else if (action === 'cancel') {
      // Revert if canceled (click backdrop without saving)
      this.subFontSize.set(this.backupSettings.size);
      this.subFontFamily.set(this.backupSettings.font);
      this.subBgOpacity.set(this.backupSettings.opacity);
      this.subVerticalOffset.set(this.backupSettings.offset);
    }
  }

  getFontFamily(fontName: string): string {
    switch(fontName) {
      case 'Roboto': return '"Roboto", sans-serif';
      case 'Montserrat': return '"Montserrat", sans-serif';
      case 'Playfair Display': return '"Playfair Display", serif';
      case 'Be Vietnam Pro': return '"Be Vietnam Pro", sans-serif';
      default: return '"Inter", sans-serif';
    }
  }

  // Translation timer
  translationSeconds = signal<number>(0);
  formattedTranslationTime = computed(() => {
    const s = this.translationSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });
  translationProgressText = signal<string | null>(null);
  translationCompletedText = signal<string | null>(null);
  private translateTimerInterval: any;

  // Time syncing & video
  currentTime = signal(0);
  private timer: any;
  isYtReady = signal(false);
  player: any;
  isFullscreen = signal(false);
  
  // Auto-scroll state
  isTranscriptHovered = signal(false);
  isTranscriptExpanded = signal(false);

  currentLine = computed(() => {
    const res = this.analysisResult();
    if (!res || !res.transcript) return null;
    const t = this.currentTime();
    
    // Find the line that matches current time
    return res.transcript.find(line => t >= line.offset && t <= (line.offset + line.duration)) || null;
  });
  
  videoId = computed(() => {
    const url = this.videoUrl();
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  });

  constructor() {
    effect(() => {
      // Auto-scrolling logic
      if (!isPlatformBrowser(this.platformId)) return;
      const line = this.currentLine();
      const hovered = this.isTranscriptHovered();
      
      if (line && !hovered) {
        // Use a short timeout to ensure the DOM has completed any re-renders
        setTimeout(() => {
          const el = document.getElementById(`transcript-line-${line.offset}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
    });

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      
      const id = this.videoId();
      const ready = this.isYtReady();
      
      if (ready && id) {
        // Wait a small tick so DOM is present
        setTimeout(() => {
          if (this.player && this.player.loadVideoById) {
            this.player.loadVideoById(id);
          } else {
            const container = document.getElementById('yt-player-container');
            if (container) {
               this.player = new (window as any).YT.Player('yt-player-container', {
                 videoId: id,
                 playerVars: { 
                    'autoplay': 0, 
                    'rel': 0, 
                    'fs': 0 // Disable native iframe fullscreen as it covers our custom subtitles overlay
                 },
               });
            }
          }
        }, 0);
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Load Settings from LocalStorage
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.size) this.subFontSize.set(parsed.size);
          if (parsed.font) this.subFontFamily.set(parsed.font);
          if (parsed.opacity !== undefined) this.subBgOpacity.set(parsed.opacity);
          if (parsed.offset !== undefined) this.subVerticalOffset.set(parsed.offset);
        } catch (e) {
          console.error("Failed to parse saved settings", e);
        }
      }

      // Listen to fullscreen changes on the document
      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen.set(!!document.fullscreenElement);
      });

      // Load YouTube API
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        
        (window as any).onYouTubeIframeAPIReady = () => {
          this.isYtReady.set(true);
        };
      } else {
        this.isYtReady.set(true);
      }

      // Sync loop: strictly checks the player's real time instead of a disconnected interval
      this.timer = setInterval(() => {
        if (this.player && typeof this.player.getCurrentTime === 'function') {
          const state = this.player.getPlayerState();
          // state 1 = playing, 2 = paused
          if (state === 1 || state === 2) {
            this.currentTime.set(this.player.getCurrentTime());
          }
        }
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  toggleFullscreen() {
    if (!isPlatformBrowser(this.platformId)) return;
    const container = document.getElementById('video-wrapper');
    if (!container) return;
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  }

  seekToLine(offset: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(offset, true);
      const state = this.player.getPlayerState?.();
      if (state !== 1 && typeof this.player.playVideo === 'function') {
        this.player.playVideo();
      }
    }
  }

  forceScrollToCurrent() {
    const line = this.currentLine();
    if (line && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const el = document.getElementById(`transcript-line-${line.offset}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  clearAllData() {
    if (this.player && typeof this.player.stopVideo === 'function') {
      this.player.stopVideo();
    }
    
    this.videoUrl.set('');
    this.analysisResult.set(null);
    this.currentTime.set(0);
    this.selectedFile.set(null);
    this.analyzeError.set(null);
    this.translateError.set(null);
    this.translationProgressText.set(null);
    this.translationCompletedText.set(null);
    if (this.translateTimerInterval) clearInterval(this.translateTimerInterval);
    this.isTranslating.set(false);
    this.isVietnameseFile.set(false);
    
    // Clear DOM input file
    if (this.fileUploader && this.fileUploader.nativeElement) {
      this.fileUploader.nativeElement.value = '';
    }
  }

  onVietnameseFlagChange(checked: boolean) {
    this.isVietnameseFile.set(checked);
    // Re-trigger file parsing so subtitles render correctly 
    if (this.selectedFile()) {
      this.parseAndLoadFile(this.selectedFile()!);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // 500 KB limit limit
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        this.addToast(`File phụ đề quá lớn (${(file.size / 1024).toFixed(1)} KB). Giới hạn tối đa là 500 KB.`, 'error');
        this.selectedFile.set(null);
        this.analysisResult.set(null);
        input.value = ''; // Reset file input
        return;
      }
      this.selectedFile.set(file);

      // Auto-detect previously translated file and reconstruct YouTube URL
      const match = file.name.match(/silaSub_vi_([a-zA-Z0-9_-]{11})/);
      let autoDetected = false;
      if (match && match[1]) {
        const extractedId = match[1];
        this.isVietnameseFile.set(true);
        autoDetected = true;
        this.videoUrl.set(`https://www.youtube.com/watch?v=${extractedId}`);
        this.addToast('Đã phát hiện file dịch sẵn, nạp Video thành công', 'success');
      }

      this.parseAndLoadFile(file, autoDetected);

    } else {
      this.selectedFile.set(null);
      this.analysisResult.set(null);
    }
  }

  private parseAndLoadFile(file: File, autoDetected: boolean = false) {
    this.isAnalyzing.set(true);
    this.analyzeError.set(null);
    this.analysisResult.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const transcript = this.parseSRT(text);
        if (transcript.length === 0) {
          throw new Error('File không đúng định dạng SRT hoặc trống.');
        }

        // Handle case where user provided an already translated Vietnamese file
        if (this.isVietnameseFile() || autoDetected) {
           transcript.forEach(line => {
              line.viText = line.text;
              line.text = '[Phụ đề Tiếng Việt có sẵn]'; // Hide original English logic
           });
        }

        this.analysisResult.set({
          lines: transcript.length,
          transcript: transcript
        });
        
        // Auto reset video time to beginning if loaded and not auto-detecting a new video
        // since auto-detecting might load a fresh player
        if (!autoDetected) {
            this.currentTime.set(0);
            if (this.player && this.player.seekTo) {
                this.player.seekTo(0, true);
            }
        }
        
        this.isAnalyzing.set(false);
      } catch (err: any) {
        this.analyzeError.set(err.message || 'Lỗi khi đọc file SRT. Vui lòng kiểm tra lại định dạng.');
        this.addToast('File SRT không đúng định dạng. Vui lòng kiểm tra lại!', 'error');
        this.isAnalyzing.set(false);
      }
    };
    reader.onerror = () => {
      this.analyzeError.set('Không thể đọc được file này.');
      this.addToast('Xảy ra lỗi khi đọc file từ máy của bạn.', 'error');
      this.isAnalyzing.set(false);
    };
    reader.readAsText(file);
  }

  private parseSRT(srtData: string): TranscriptLine[] {
    const lines = srtData.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const transcript: TranscriptLine[] = [];
    let current: Partial<TranscriptLine> = {};
    let textBuffer: string[] = [];
    
    const timeToSeconds = (timeStr: string) => {
      const [hours, minutes, rest] = timeStr.split(':');
      const [seconds, ms] = rest.split(',');
      return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10) + (parseInt(ms, 10) || 0) / 1000;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (current.offset !== undefined && textBuffer.length > 0) {
          current.text = textBuffer.join(' ');
          transcript.push(current as TranscriptLine);
        }
        current = {};
        textBuffer = [];
        continue;
      }

      if (line.includes('-->')) {
        const [start, end] = line.split('-->').map(s => s.trim());
        current.offset = timeToSeconds(start);
        current.duration = timeToSeconds(end) - current.offset;
      } else if (!isNaN(parseInt(line, 10)) && textBuffer.length === 0 && current.offset === undefined) {
        // It's the block index, ignore
      } else {
        textBuffer.push(line);
      }
    }
    
    // push the last block if file doesn't end with empty line
    if (current.offset !== undefined && textBuffer.length > 0) {
      current.text = textBuffer.join(' ');
      transcript.push(current as TranscriptLine);
    }
    return transcript;
  }

  async startTranslating() {
    const res = this.analysisResult();
    if (!res || !res.transcript) return;

    this.isTranslating.set(true);
    this.translateError.set(null);
    this.translationCompletedText.set(null);
    this.translationSeconds.set(0);
    this.translationProgressText.set(null);
    
    this.translateTimerInterval = setInterval(() => {
      this.translationSeconds.update(s => s + 1);
    }, 1000);

    try {
      let systemInstruction = '';
      let promptTemplate = '';
      
      try {
        const [siRes, promptRes] = await Promise.all([
          fetch('/prompts/video_system_instructions.md'),
          fetch('/prompts/video_prompt.md')
        ]);
        
        if (!siRes.ok || !promptRes.ok) throw new Error('Network response bounds error.');
        systemInstruction = await siRes.text();
        promptTemplate = await promptRes.text();
      } catch (fetchErr) {
        throw new Error('SYSTEM_PROMPT_FETCH_ERROR');
      }

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const CHUNK_SIZE = 1200;
      const fullTranscript = res.transcript;
      const totalChunks = Math.ceil(fullTranscript.length / CHUNK_SIZE);
      let translatedTranscript = [...fullTranscript];

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (totalChunks > 1) {
          this.translationProgressText.set(`(Phần ${chunkIndex + 1}/${totalChunks})`);
        }

        const startIndex = chunkIndex * CHUNK_SIZE;
        const endIndex = Math.min(startIndex + CHUNK_SIZE, fullTranscript.length);
        const currentChunk = fullTranscript.slice(startIndex, endIndex);
        const textsToTranslate = currentChunk.map(line => line.text);

        let contextText = '';
        if (chunkIndex > 0) {
           const prevStart = Math.max(0, startIndex - 5);
           const prevLines = translatedTranscript.slice(prevStart, startIndex);
           contextText = `[THÔNG TIN NGỮ CẢNH - KHÔNG DỊCH PHẦN NÀY]
Người nói vừa kết thúc đoạn trước bằng các câu sau:
${prevLines.map((l, i) => `${i + 1}. Anh: "${l.text}" -> Việt: "${l.viText}"`).join('\n')}

(Dựa vào ngữ cảnh đang nói dở dang ở trên, hãy tiếp tục dịch mảng JSON dưới đây)

`;
        }

        const prompt = promptTemplate
           .replace('{{CONTEXT_TEXT}}', contextText)
           .replace('{{JSON_PAYLOAD}}', JSON.stringify(textsToTranslate));

        const response = await ai.models.generateContent({
          model: AI_MODEL_VERSION,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: this.aiTemperature(),
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          }
        });

        const output = response.text;
        if (!output) throw new Error("Empty response from AI");
        
        // Defensive programming: Lột bỏ markdown (nếu có) trước khi parse
        const cleanOutput = output.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        
        let translatedArray: string[] = [];
        try {
          translatedArray = JSON.parse(cleanOutput);
        } catch (parseError) {
          throw new Error("AI returned invalid JSON format.");
        }
        
        for (let i = 0; i < currentChunk.length; i++) {
           translatedTranscript[startIndex + i] = {
             ...translatedTranscript[startIndex + i],
             viText: translatedArray[i] || currentChunk[i].text
           };
        }

        // Update UI progressively
        this.analysisResult.set({
          lines: translatedTranscript.length,
          transcript: [...translatedTranscript]
        });
      }
      
      clearInterval(this.translateTimerInterval);
      this.translationProgressText.set(null);
      this.translationCompletedText.set(`Đã hoàn thành trong ${this.formattedTranslationTime()} phút`);
      this.addToast(`Tuyệt vời! Đã dịch thành công trong ${this.formattedTranslationTime()} phút!`, 'success');
      this.isTranslating.set(false);
    } catch(err: any) {
      console.error(err);
      clearInterval(this.translateTimerInterval);
      this.translationProgressText.set(null);
      
      const errMsg = err.message || '';
      let toastMsg = 'Lỗi kết nối khi dịch thuật.';
      let toastType: ToastType = 'error';
      
      if (errMsg === 'SYSTEM_PROMPT_FETCH_ERROR') {
         toastMsg = 'Không thể tải file Cấu hình AI. Vui lòng kiểm tra lại thư mục public/prompts/';
      } else if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
        toastMsg = 'Hệ thống AI đang quá tải hoặc hết lượt dịch miễn phí. Vui lòng thử lại sau ít phút!';
      } else if (errMsg.toLowerCase().includes('safet') || errMsg.toLowerCase().includes('block')) {
        toastMsg = 'Nội dung đoạn này có chứa từ khóa nhạy cảm, AI đã từ chối dịch.';
        toastType = 'warning';
      } else if (errMsg.includes('JSON format') || errMsg.includes('parse')) {
        toastMsg = 'AI phản hồi sai định dạng chuẩn. Vui lòng dịch lại đoạn này!';
        toastType = 'warning';
      }
      
      this.translateError.set(errMsg || toastMsg);
      this.addToast(toastMsg, toastType);
      
      this.isTranslating.set(false);
    }
  }

  exportSrt() {
    if (!isPlatformBrowser(this.platformId)) return;
    const res = this.analysisResult();
    if (!res || !res.transcript) return;

    const pad = (num: number, size: number) => ('000' + num).slice(-size);
    const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.floor(totalSeconds % 60);
      const ms = Math.floor((totalSeconds % 1) * 1000);
      return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
    };

    let srtContent = '';
    res.transcript.forEach((line, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(line.offset)} --> ${formatTime(line.offset + line.duration)}\n`;
      srtContent += `${line.viText || line.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silaSub_vi_${this.videoId() || 'subtitles'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.addToast('Đã tải thành công file Phụ đề Tiếng Việt về máy.', 'success');
  }
}
