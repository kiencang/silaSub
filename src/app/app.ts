import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  OnDestroy,
  effect,
  OnInit,
  PLATFORM_ID,
  inject,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { isPlatformBrowser, DecimalPipe } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MatIconModule } from "@angular/material/icon";

const SETTINGS_STORAGE_KEY = "silaSub_v1_prefs_8f9a2b";

export interface TranscriptLine {
  text: string;
  viText?: string;
  duration: number;
  offset: number;
}

export type ToastType = "success" | "error" | "warning";
export interface ToastInfo {
  id: string;
  message: string;
  type: ToastType;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-root",
  imports: [
    RouterOutlet,
    FormsModule,
    HttpClientModule,
    DecimalPipe,
    MatIconModule,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnDestroy, OnInit {
  private platformId = inject(PLATFORM_ID);

  @ViewChild("enFileUploader") enFileUploader!: ElementRef<HTMLInputElement>;
  @ViewChild("viFileUploader") viFileUploader!: ElementRef<HTMLInputElement>;
  @ViewChild("audioFileUploader") audioFileUploader!: ElementRef<HTMLInputElement>;
  @ViewChild("videoFileUploader") videoFileUploader!: ElementRef<HTMLInputElement>;

  videoUrl = signal("");
  selectedEnFile = signal<File | null>(null);
  selectedViFile = signal<File | null>(null);
  selectedAudioFile = signal<File | null>(null);
  audioDuration = signal<number | null>(null);
  selectedVideoFile = signal<File | null>(null);
  videoDuration = signal<number | null>(null);
  showViUpload = signal(false); // Controls visibility of Vi file upload box
  showAudioUpload = signal(false); // Controls visibility of Audio file upload box
  showVideoUpload = signal(false); // Controls visibility of Video file upload box

  aiTemperature = signal<number>(0.5); // AI Temperature parameter
  aiModel = signal<string>("gemini-pro-latest"); // AI Model selection
  translationMode = signal<"video" | "music">("video"); // Mode selection
  useGoogleSearch = signal<boolean>(false); // Toggle for Grounding with Google Search

  // Settings State
  isSettingsOpen = signal(false);
  subFontSize = signal<number>(30);
  subFontFamily = signal<string>("Lexend");
  subTextColor = signal<string>("#FFD700");
  subBgOpacity = signal<number>(0.5);
  subVerticalOffset = signal<number>(2); // 2rem default
  private backupSettings = {
    size: 30,
    font: "Lexend",
    color: "#FFD700",
    opacity: 0.5,
    offset: 2,
  };

  isAnalyzing = signal(false);
  analysisResult = signal<{
    lines: number;
    transcript: TranscriptLine[];
  } | null>(null);
  analyzeError = signal<string | null>(null);

  isTranslating = signal(false);
  translateError = signal<string | null>(null);

  toasts = signal<ToastInfo[]>([]);

  addToast(message: string, type: ToastType = "error") {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts.update((current) => [...current, { id, message, type }]);
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  // Settings Logic
  openSettings() {
    this.backupSettings = {
      size: this.subFontSize(),
      font: this.subFontFamily(),
      color: this.subTextColor(),
      opacity: this.subBgOpacity(),
      offset: this.subVerticalOffset(),
    };
    this.isSettingsOpen.set(true);
  }

  closeSettings(action: "save" | "reset" | "cancel") {
    this.isSettingsOpen.set(false);
    if (action === "save") {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({
            size: this.subFontSize(),
            font: this.subFontFamily(),
            color: this.subTextColor(),
            opacity: this.subBgOpacity(),
            offset: this.subVerticalOffset(),
          }),
        );
      }
      this.addToast("Lưu cài đặt thành công!", "success");
    } else if (action === "reset") {
      // Khôi phục về thông số mặc định nguyên thuỷ
      this.subFontSize.set(30);
      this.subFontFamily.set("Lexend");
      this.subTextColor.set("#FFD700");
      this.subBgOpacity.set(0.5);
      this.subVerticalOffset.set(2);
      // Xoá memory trong localStorage
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
      this.addToast("Đã khôi phục cài đặt gốc", "success");
    } else if (action === "cancel") {
      // Revert if canceled (click backdrop without saving)
      this.subFontSize.set(this.backupSettings.size);
      this.subFontFamily.set(this.backupSettings.font);
      this.subTextColor.set(this.backupSettings.color);
      this.subBgOpacity.set(this.backupSettings.opacity);
      this.subVerticalOffset.set(this.backupSettings.offset);
    }
  }

  getFontFamily(fontName: string): string {
    switch (fontName) {
      case "Roboto":
        return '"Roboto", sans-serif';
      case "Montserrat":
        return '"Montserrat", sans-serif';
      case "Playfair Display":
        return '"Playfair Display", serif';
      case "Be Vietnam Pro":
        return '"Be Vietnam Pro", sans-serif';
      case "Inter":
        return '"Inter", sans-serif';
      case "Lexend":
        return '"Lexend", sans-serif';
      default:
        return '"Lexend", sans-serif';
    }
  }

  // Translation timer
  translationSeconds = signal<number>(0);
  formattedTranslationTime = computed(() => {
    const s = this.translationSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  });
  translationCurrentChunk = signal<number>(0);
  translationTotalChunks = signal<number>(0);
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

  // Instructions
  showInstructions = signal(false);

  // Search video feature
  searchQuery = signal("");
  isSearchingQuery = signal(false);

  currentLine = computed(() => {
    const res = this.analysisResult();
    if (!res || !res.transcript) return null;
    const t = this.currentTime();

    // Find the line that matches current time
    return (
      res.transcript.find(
        (line) => t >= line.offset && t <= line.offset + line.duration,
      ) || null
    );
  });

  videoId = computed(() => {
    const url = this.videoUrl();
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : null;
  });

  constructor() {
    effect(() => {
      // Auto-scrolling logic
      if (!isPlatformBrowser(this.platformId)) return;
      const line = this.currentLine();
      const hovered = this.isTranscriptHovered();

      if (line && !hovered) {
        this.scrollContainerToElement(line.offset);
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
            const container = document.getElementById("yt-player-container");
            if (container) {
              this.player = new (window as any).YT.Player(
                "yt-player-container",
                {
                  videoId: id,
                  playerVars: {
                    autoplay: 0,
                    rel: 0,
                    fs: 0, // Disable native iframe fullscreen as it covers our custom subtitles overlay
                  },
                },
              );
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
          if (parsed.color) this.subTextColor.set(parsed.color);
          if (parsed.opacity !== undefined)
            this.subBgOpacity.set(parsed.opacity);
          if (parsed.offset !== undefined)
            this.subVerticalOffset.set(parsed.offset);
        } catch (e) {
          console.error("Failed to parse saved settings", e);
        }
      }

      // Listen to fullscreen changes on the document
      document.addEventListener("fullscreenchange", () => {
        this.isFullscreen.set(!!document.fullscreenElement);
      });

      // Load YouTube API
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
          this.isYtReady.set(true);
        };
      } else {
        this.isYtReady.set(true);
      }

      // Sync loop: strictly checks the player's real time instead of a disconnected interval
      this.timer = setInterval(() => {
        if (this.player && typeof this.player.getCurrentTime === "function") {
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
    const container = document.getElementById("video-wrapper");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  seekToLine(offset: number) {
    if (this.player && typeof this.player.seekTo === "function") {
      this.player.seekTo(offset, true);
      const state = this.player.getPlayerState?.();
      if (state !== 1 && typeof this.player.playVideo === "function") {
        this.player.playVideo();
      }
    }
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
    const line = this.currentLine();
    if (line) {
      this.scrollContainerToElement(line.offset);
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  clearAllData() {
    if (this.player && typeof this.player.stopVideo === "function") {
      this.player.stopVideo();
    }

    this.videoUrl.set("");
    this.clearSubtitleFiles();
  }

  clearEnSubtitleFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedEnFile.set(null);
    if (this.enFileUploader && this.enFileUploader.nativeElement) {
      this.enFileUploader.nativeElement.value = "";
    }
    this.parseAndLoadFiles();
  }

  clearViSubtitleFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedViFile.set(null);
    if (this.viFileUploader && this.viFileUploader.nativeElement) {
      this.viFileUploader.nativeElement.value = "";
    }
    this.parseAndLoadFiles();
  }

  changeTranslationMode(mode: "video" | "music") {
    this.translationMode.set(mode);
    if (mode === "music") {
      this.selectedVideoFile.set(null);
      this.videoDuration.set(null);
      if (this.videoFileUploader && this.videoFileUploader.nativeElement) {
        this.videoFileUploader.nativeElement.value = "";
      }
    }
  }

  toggleAudioUpload() {
    if (this.showAudioUpload()) {
      this.showAudioUpload.set(false);
    } else {
      this.showAudioUpload.set(true);
      this.showVideoUpload.set(false);
    }
  }

  toggleVideoUpload() {
    if (this.showVideoUpload()) {
      this.showVideoUpload.set(false);
    } else {
      this.showVideoUpload.set(true);
      this.showAudioUpload.set(false);
    }
  }

  clearSubtitleFiles(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.analysisResult.set(null);
    this.currentTime.set(0);
    this.selectedEnFile.set(null);
    this.selectedViFile.set(null);
    this.selectedAudioFile.set(null);
    this.audioDuration.set(null);
    this.selectedVideoFile.set(null);
    this.videoDuration.set(null);
    this.showViUpload.set(false);
    this.showAudioUpload.set(false);
    this.showVideoUpload.set(false);
    this.analyzeError.set(null);
    this.translateError.set(null);
    this.translationCurrentChunk.set(0);
    this.translationTotalChunks.set(0);
    this.translationCompletedText.set(null);
    if (this.translateTimerInterval) clearInterval(this.translateTimerInterval);
    this.isTranslating.set(false);

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
    this.videoUrl.set(url);
    if (!url || url.trim() === "") {
      this.clearAllData();
    }
  }

  onEnFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        this.addToast(
          `File quá lớn (${(file.size / 1024).toFixed(1)} KB). Giới hạn tối đa là 500 KB.`,
          "error",
        );
        input.value = "";
        return;
      }

      const match = file.name.match(/silaSub_vi_([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        // If they drop a translated file here, kindly move it to the VI slot and show the vi box
        this.selectedViFile.set(file);
        this.showViUpload.set(true);
        this.videoUrl.set(`https://www.youtube.com/watch?v=${match[1]}`);
        this.addToast("Đã chuyển file dịch sẵn sang mục Tiếng Việt", "success");
        input.value = "";
        this.parseAndLoadFiles();
        return;
      }

      this.selectedEnFile.set(file);
      this.parseAndLoadFiles();
    } else {
      this.selectedEnFile.set(null);
      this.parseAndLoadFiles();
    }
  }

  onViFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        this.addToast(`File quá lớn.`, "error");
        input.value = "";
        return;
      }

      const match = file.name.match(/silaSub_vi_([a-zA-Z0-9_-]{11})/);
      let autoDetected = false;
      if (match && match[1]) {
        const extractedId = match[1];
        autoDetected = true;
        this.videoUrl.set(`https://www.youtube.com/watch?v=${extractedId}`);
        this.addToast("Đã nạp Video thành công", "success");
      }

      this.selectedViFile.set(file);
      this.parseAndLoadFiles(autoDetected);
    } else {
      this.selectedViFile.set(null);
      this.parseAndLoadFiles();
    }
  }

  clearAudioFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedAudioFile.set(null);
    this.audioDuration.set(null);
    if (this.audioFileUploader && this.audioFileUploader.nativeElement) {
      this.audioFileUploader.nativeElement.value = "";
    }
  }

  onAudioFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const MAX_SIZE = 40 * 1024 * 1024; // 40 MB
      if (file.size > MAX_SIZE) {
        this.addToast(`File âm thanh quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Giới hạn tối đa là 40 MB.`, "error");
        input.value = "";
        return;
      }

      // Read audio duration
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        const MAX_DURATION = 30 * 60; // 30 minutes
        if (duration > MAX_DURATION) {
            this.addToast(`File âm thanh quá dài (${Math.round(duration / 60)} phút). Giới hạn tối đa là 30 phút.`, "error");
            input.value = "";
            this.selectedAudioFile.set(null);
            this.audioDuration.set(null);
        } else {
            this.selectedAudioFile.set(file);
            this.audioDuration.set(duration);
            this.addToast(`Đã chọn file âm thanh (${Math.round(duration)}s)`, "success");
        }
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
          this.addToast("Không thể đọc thời lượng file âm thanh.", "error");
          input.value = "";
          this.selectedAudioFile.set(null);
          this.audioDuration.set(null);
          URL.revokeObjectURL(audioUrl);
      }
    } else {
      this.selectedAudioFile.set(null);
      this.audioDuration.set(null);
    }
  }

  triggerVideoUpload() {
    this.videoFileUploader.nativeElement.click();
  }

  removeVideoFile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedVideoFile.set(null);
    this.videoDuration.set(null);
    if (this.videoFileUploader && this.videoFileUploader.nativeElement) {
      this.videoFileUploader.nativeElement.value = "";
    }
  }

  onVideoFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const type = file.type;
      if (!type.startsWith("video/")) {
        this.addToast("Vui lòng chọn file video hợp lệ.", "error");
        event.target.value = "";
        return;
      }

      const MAX_SIZE = 70 * 1024 * 1024; // 70MB
      if (file.size > MAX_SIZE) {
        this.addToast("Dung lượng video vượt quá 70MB. Vui lòng chọn file nhỏ hơn.", "error");
        event.target.value = "";
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = videoUrl;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const MAX_DURATION = 30 * 60; // 30 minutes
        if (duration > MAX_DURATION) {
            this.addToast(`File video quá dài (${Math.round(duration / 60)} phút). Giới hạn tối đa là 30 phút.`, "error");
            event.target.value = "";
            this.selectedVideoFile.set(null);
            this.videoDuration.set(null);
        } else {
            this.selectedVideoFile.set(file);
            this.videoDuration.set(duration);
            this.addToast(`Đã chọn file video (${Math.round(duration)}s)`, "success");
        }
        URL.revokeObjectURL(videoUrl);
      };
      video.onerror = () => {
          this.addToast("Không thể đọc thời lượng file video.", "error");
          event.target.value = "";
          this.selectedVideoFile.set(null);
          this.videoDuration.set(null);
          URL.revokeObjectURL(videoUrl);
      }
    } else {
      this.selectedVideoFile.set(null);
      this.videoDuration.set(null);
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Không thể đọc file"));
      reader.readAsText(file);
    });
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Lỗi đọc file âm thanh"));
      reader.readAsDataURL(file);
    });
  }

  private parseAndLoadFiles(autoDetected = false) {
    this.isAnalyzing.set(true);
    this.analyzeError.set(null);
    this.analysisResult.set(null);

    const enFile = this.selectedEnFile();
    const viFile = this.selectedViFile();

    if (!enFile && !viFile) {
      this.isAnalyzing.set(false);
      return;
    }

    Promise.all([
      enFile ? this.readFileAsText(enFile) : Promise.resolve(null),
      viFile ? this.readFileAsText(viFile) : Promise.resolve(null),
    ])
      .then(([enText, viText]) => {
        try {
          let mergedTranscript: TranscriptLine[] = [];
          let enTranscript = enText ? this.parseSRT(enText, false) : [];
          let viTranscript = viText ? this.parseSRT(viText, true) : [];

          if (enText && viText) {
            const maxLen = Math.max(enTranscript.length, viTranscript.length);
            for (let i = 0; i < maxLen; i++) {
              const enLine = enTranscript[i];
              const viLine = viTranscript[i];
              if (enLine && viLine) {
                mergedTranscript.push({
                  ...enLine,
                  text: enLine.text,
                  viText: viLine.text,
                });
              } else if (enLine) {
                mergedTranscript.push({ ...enLine });
              } else if (viLine) {
                mergedTranscript.push({
                  ...viLine,
                  text: "[Bản dịch không có phụ đề gốc]",
                  viText: viLine.text,
                });
              }
            }
          } else if (enText) {
            mergedTranscript = enTranscript;
          } else if (viText) {
            mergedTranscript = viTranscript.map((line) => ({
              ...line,
              viText: line.text,
              text: "[Bản dịch không có phụ đề gốc]",
            }));
          }

          if (mergedTranscript.length === 0) {
            throw new Error("File không đúng định dạng SRT hoặc trống.");
          }

          this.analysisResult.set({
            lines: mergedTranscript.length,
            transcript: mergedTranscript,
          });

          if (!autoDetected) {
            this.currentTime.set(0);
            if (this.player && this.player.seekTo) {
              this.player.seekTo(0, true);
            }
          }

          this.isAnalyzing.set(false);
        } catch (err: any) {
          this.analyzeError.set(err.message || "Lỗi khi đọc file SRT.");
          this.addToast("Lỗi khi đọc file SRT!", "error");
          this.isAnalyzing.set(false);
        }
      })
      .catch((err) => {
        this.analyzeError.set(err.message || "Lỗi đọc file.");
        this.addToast("Lỗi đọc file!", "error");
        this.isAnalyzing.set(false);
      });
  }

  private cleanAudioTags(text: string): string {
    // Only target tags that contain common sound effect keywords (case insensitive)
    const audioTagRegex = /\[.*?(music|upbeat).*?\]/gi;

    const textWithoutTags = text.replace(audioTagRegex, "").trim();

    // If there's no real text outside the tags, keep it (so we don't end up with empty lines)
    if (!/[a-zA-Z0-9\u00C0-\u017F]/.test(textWithoutTags)) {
      return text;
    }

    const cleaned = text.replace(audioTagRegex, (match, _, offset) => {
      const beforeStr = text.substring(0, offset);
      const afterStr = text.substring(offset + match.length);

      // Remove other tags temporarily just to check text presence
      const cleanBefore = beforeStr.replace(/\[.*?\]/g, "");
      const hasTextBefore = /[a-zA-Z0-9\u00C0-\u017F]/.test(cleanBefore);

      const cleanAfter = afterStr.replace(/\[.*?\]/g, "");
      const hasTextAfter = /[a-zA-Z0-9\u00C0-\u017F]/.test(cleanAfter);

      // Remove the tag only if there's real text both before AND after it
      if (hasTextBefore && hasTextAfter) {
        return " ";
      }

      return match;
    });

    return cleaned.replace(/\s{2,}/g, " ").trim();
  }

  private parseSRT(
    srtData: string,
    preserveNewlines = false,
  ): TranscriptLine[] {
    const lines = srtData
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n");
    const transcript: TranscriptLine[] = [];
    let current: Partial<TranscriptLine> = {};
    let textBuffer: string[] = [];

    const timeToSeconds = (timeStr: string) => {
      const [hours, minutes, rest] = timeStr.split(":");
      const [seconds, ms] = rest.split(",");
      return (
        parseInt(hours, 10) * 3600 +
        parseInt(minutes, 10) * 60 +
        parseInt(seconds, 10) +
        (parseInt(ms, 10) || 0) / 1000
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (current.offset !== undefined && textBuffer.length > 0) {
          const joinedText = textBuffer.join(preserveNewlines ? "\n" : " ");
          current.text = this.cleanAudioTags(joinedText);
          transcript.push(current as TranscriptLine);
        }
        current = {};
        textBuffer = [];
        continue;
      }

      if (line.includes("-->")) {
        const [start, end] = line.split("-->").map((s) => s.trim());
        current.offset = timeToSeconds(start);
        current.duration = timeToSeconds(end) - current.offset;
      } else if (
        !isNaN(parseInt(line, 10)) &&
        textBuffer.length === 0 &&
        current.offset === undefined
      ) {
        // It's the block index, ignore
      } else {
        textBuffer.push(line);
      }
    }

    // push the last block if file doesn't end with empty line
    if (current.offset !== undefined && textBuffer.length > 0) {
      const joinedText = textBuffer.join(preserveNewlines ? "\n" : " ");
      current.text = this.cleanAudioTags(joinedText);
      transcript.push(current as TranscriptLine);
    }
    return transcript;
  }

  async startTranslating() {
    const res = this.analysisResult();
    if (!res || !res.transcript) return;

    const hasAudio = !!this.selectedAudioFile();
    const hasVideo = !!this.selectedVideoFile();

    if (this.translationMode() === "music" && res.transcript.length > 500) {
      this.addToast(
        "Vượt quá 500 dòng. Không thể dịch ở chế độ Âm nhạc.",
        "error",
      );
      return;
    }

    if (hasAudio || hasVideo) {
      if (res.transcript.length > 1000) {
        this.addToast(
          "Vượt quá 1000 dòng. Vui lòng tắt âm thanh/video đính kèm, hoặc cắt nhỏ file phụ đề và media tương ứng.",
          "error",
        );
        return;
      }

      const mediaDur = hasAudio ? this.audioDuration() : this.videoDuration();
      if (mediaDur !== null) {
        const lastLine = res.transcript[res.transcript.length - 1];
        const lastTime = lastLine.offset + lastLine.duration;
        if (mediaDur < lastTime - 5) {
          this.addToast(
            "Thời lượng media quá ngắn so với phụ đề tiếng Anh đã tải lên.",
            "error",
          );
          return;
        }
      }
    } else {
      if (this.translationMode() === "video" && res.transcript.length > 5000) {
        this.addToast(
          "Vượt quá 5000 dòng. Vui lòng cắt nhỏ video hoặc file phụ đề để dịch.",
          "error",
        );
        return;
      }
    }

    this.isTranslating.set(true);
    this.translateError.set(null);
    this.translationCompletedText.set(null);
    this.translationSeconds.set(0);
    this.translationCurrentChunk.set(0);
    this.translationTotalChunks.set(0);

    this.translateTimerInterval = setInterval(() => {
      this.translationSeconds.update((s) => s + 1);
    }, 1000);

    try {
      let systemInstruction = "";
      let promptTemplate = "";

      try {
        const timestamp = Date.now();
        const mode = this.translationMode();
        let siUrl = "";
        
        if (mode === "music") {
            siUrl = hasAudio ? "/prompts/oa_music_system_instructions.md" : "/prompts/music_system_instructions.md";
        } else {
            if (hasVideo) {
                 siUrl = "/prompts/ov_video_system_instructions.md";
            } else if (hasAudio) {
                 siUrl = "/prompts/oa_video_system_instructions.md";
            } else {
                 siUrl = "/prompts/video_system_instructions.md";
            }
        }
        
        const promptUrl =
          mode === "music"
            ? "/prompts/music_prompt.md"
            : "/prompts/video_prompt.md";

        const [siRes, promptRes] = await Promise.all([
          fetch(`${siUrl}?t=${timestamp}`),
          fetch(`${promptUrl}?t=${timestamp}`),
        ]);

        if (!siRes.ok || !promptRes.ok)
          throw new Error("Network response bounds error.");
        systemInstruction = await siRes.text();
        promptTemplate = await promptRes.text();
      } catch (fetchErr) {
        throw new Error("SYSTEM_PROMPT_FETCH_ERROR");
      }

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const mode = this.translationMode();
      const CHUNK_SIZE = (mode === "music" || hasAudio) ? res.transcript.length : 600;
      const fullTranscript = res.transcript;
      const totalChunks = Math.ceil(fullTranscript.length / CHUNK_SIZE);
      const translatedTranscript = [...fullTranscript];

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (totalChunks > 1) {
          this.translationCurrentChunk.set(chunkIndex + 1);
          this.translationTotalChunks.set(totalChunks);
        }

        const startIndex = chunkIndex * CHUNK_SIZE;
        const endIndex = Math.min(
          startIndex + CHUNK_SIZE,
          fullTranscript.length,
        );
        const currentChunk = fullTranscript.slice(startIndex, endIndex);
        const textsToTranslate = currentChunk.map((line, idx) => ({
          id: startIndex + idx,
          en: line.text,
        }));

        let contextText = "";
        if (chunkIndex > 0) {
          const prevStart = Math.max(0, startIndex - 30);
          const prevLines = translatedTranscript.slice(prevStart, startIndex);
          contextText = `[THÔNG TIN NGỮ CẢNH - KHÔNG DỊCH PHẦN NÀY]
Người nói vừa kết thúc đoạn trước bằng các câu sau:
${prevLines.map((l, i) => `[id=${prevStart + i}] Anh: "${l.text}" -> Việt: "${l.viText}"`).join("\n")}

(Dựa vào ngữ cảnh đang nói dở dang ở trên, hãy tiếp tục dịch mảng JSON dưới đây)

`;
        }

        let prompt = promptTemplate
          .replace("{{CONTEXT_TEXT}}", contextText)
          .replace(
            "{{JSON_PAYLOAD}}",
            JSON.stringify(textsToTranslate, null, 2),
          );

        const reqConfig: any = {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: this.aiTemperature(),
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                vi: { type: "string" },
              },
              required: ["id", "vi"],
            },
          },
        };

        if (this.useGoogleSearch()) {
          reqConfig.tools = [{ googleSearch: {} }];
        }

        let reqContents: any = prompt;
        if (hasAudio && this.selectedAudioFile()) {
            const audioFile = this.selectedAudioFile()!;
            const base64Audio = await this.readFileAsBase64(audioFile);
            reqContents = [
                {
                    inlineData: {
                        mimeType: audioFile.type || "audio/mp3",
                        data: base64Audio,
                    }
                },
                prompt
            ];
        } else if (hasVideo && this.selectedVideoFile()) {
            const videoFile = this.selectedVideoFile()!;
            const base64Video = await this.readFileAsBase64(videoFile);
            reqContents = [
                {
                    inlineData: {
                        mimeType: videoFile.type || "video/mp4",
                        data: base64Video,
                    }
                },
                prompt
            ];
        }

        const response = await ai.models.generateContent({
          model: this.aiModel(),
          contents: reqContents,
          config: reqConfig,
        });

        const output = response.text;
        if (!output) throw new Error("Empty response from AI");

        // Defensive programming: Lột bỏ markdown (nếu có) trước khi parse
        const cleanOutput = output
          .replace(/```json\n?/gi, "")
          .replace(/```\n?/g, "")
          .trim();

        let translatedArray: { id: number; vi: string }[] = [];
        try {
          translatedArray = JSON.parse(cleanOutput);
        } catch (parseError) {
          throw new Error("AI returned invalid JSON format.");
        }

        for (let i = 0; i < currentChunk.length; i++) {
          const expectedId = startIndex + i;
          const translatedItem = translatedArray.find(
            (item) => item.id === expectedId,
          );
          let finalViText = translatedItem
            ? translatedItem.vi
            : currentChunk[i].text;
          // Giải bùa: Chuyển đổi ký tự thế thân <br> về \n thực sự
          if (typeof finalViText === "string") {
            finalViText = finalViText.replace(/<br\s*\/?>/gi, "\n");
          }

          translatedTranscript[expectedId] = {
            ...translatedTranscript[expectedId],
            viText: finalViText,
          };
        }

        // Update UI progressively
        this.analysisResult.set({
          lines: translatedTranscript.length,
          transcript: [...translatedTranscript],
        });
      }

      clearInterval(this.translateTimerInterval);
      this.translationCurrentChunk.set(0);
      this.translationTotalChunks.set(0);
      this.translationCompletedText.set(
        `Đã hoàn thành trong ${this.formattedTranslationTime()} phút`,
      );
      this.addToast(
        `Tuyệt vời! Đã dịch thành công trong ${this.formattedTranslationTime()} phút!`,
        "success",
      );
      this.isTranslating.set(false);
    } catch (err: any) {
      console.error(err);
      clearInterval(this.translateTimerInterval);
      this.translationCurrentChunk.set(0);
      this.translationTotalChunks.set(0);

      const errMsg = err.message || "";
      let toastMsg = "Lỗi kết nối khi dịch thuật.";
      let toastType: ToastType = "error";

      if (errMsg === "SYSTEM_PROMPT_FETCH_ERROR") {
        toastMsg =
          "Không thể tải file Cấu hình AI. Vui lòng kiểm tra lại thư mục public/prompts/";
      } else if (
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota")
      ) {
        toastMsg =
          "Hệ thống AI đang quá tải hoặc hết lượt dịch miễn phí. Vui lòng thử lại sau ít phút!";
      } else if (
        errMsg.toLowerCase().includes("safet") ||
        errMsg.toLowerCase().includes("block")
      ) {
        toastMsg =
          "Nội dung đoạn này có chứa từ khóa nhạy cảm, AI đã từ chối dịch.";
        toastType = "warning";
      } else if (errMsg.includes("JSON format") || errMsg.includes("parse")) {
        toastMsg =
          "AI phản hồi sai định dạng chuẩn. Vui lòng dịch lại đoạn này!";
        toastType = "warning";
      }

      this.translateError.set(errMsg || toastMsg);
      this.addToast(toastMsg, toastType);

      this.isTranslating.set(false);
    }
  }

  async searchYoutube() {
    if (!this.searchQuery().trim()) return;
    this.isSearchingQuery.set(true);

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      // We will use gemini-1.5-flash as it is fast and reliable for text task.
      // User mentioned `gemini-flash-latest`, both will map to latest flash model.

      const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM:** Mục tiêu là tạo ra truy vấn mà người dùng tiếng Anh thực sự sẽ gõ vào máy tìm kiếm để tìm một video, hoặc gõ trực tiếp ngay trên YouTube. Ưu tiên từ khóa cốt lõi, ý định, sự ngắn gọn, và các cụm từ tìm kiếm phổ biến (how to, best, near me, price, review, etc.).
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

      const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else:\n[${this.searchQuery().trim()}]`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1, // Low temperature for deterministic query generation
        },
      });

      const output = response.text || "";
      const cleanKeyword = output
        .replace(/```/g, "")
        .replace(/\n/g, "")
        .replace(/\"/g, "")
        .replace(/\'/g, "")
        .trim();

      if (cleanKeyword) {
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword)}`,
          "_blank",
        );
      } else {
        this.addToast("Không thể dịch từ khóa", "error");
      }
    } catch (err) {
      console.error(err);
      this.addToast("Lỗi khi dịch từ khóa tìm kiếm", "error");
    } finally {
      this.isSearchingQuery.set(false);
    }
  }

  exportSrt() {
    if (!isPlatformBrowser(this.platformId)) return;
    const res = this.analysisResult();
    if (!res || !res.transcript) return;

    const pad = (num: number, size: number) => ("000" + num).slice(-size);
    const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.floor(totalSeconds % 60);
      const ms = Math.floor((totalSeconds % 1) * 1000);
      return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
    };

    let srtContent = "";
    res.transcript.forEach((line, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(line.offset)} --> ${formatTime(line.offset + line.duration)}\n`;
      srtContent += `${line.viText || line.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/srt" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `silaSub_vi_${this.videoId() || "subtitles"}.srt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.addToast(
      `Đã tải thành công file Phụ đề Tiếng Việt: ${fileName} về máy.`,
      "success",
    );
  }
}
