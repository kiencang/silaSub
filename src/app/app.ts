import {ChangeDetectionStrategy, Component, signal, computed, OnDestroy, effect, OnInit, PLATFORM_ID, inject} from '@angular/core';
import {isPlatformBrowser, DecimalPipe} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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

  videoUrl = signal('');
  selectedFile = signal<File | null>(null);
  isVietnameseFile = signal(false); // Flag if the uploaded file is already Vietnamese
  
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // 500 KB limit limit
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        this.addToast(`File phụ đề quá lớn (${(file.size / 1024).toFixed(1)} KB). Giới hạn tối đa là 500 KB.`, 'error');
        this.selectedFile.set(null);
        input.value = ''; // Reset file input
        return;
      }
      this.selectedFile.set(file);
    } else {
      this.selectedFile.set(null);
    }
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

  analyzeData() {
    if (!this.videoId()) {
      this.analyzeError.set('Vui lòng nhập link YouTube hợp lệ.');
      this.addToast('Bạn chưa nhập link YouTube hoặc link không hợp lệ!', 'warning');
      return;
    }
    if (!this.selectedFile()) {
      this.analyzeError.set('Vui lòng tải lên file phụ đề (.srt).');
      this.addToast('Bạn chưa tải lên file phụ đề (.srt)!', 'warning');
      return;
    }

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
        if (this.isVietnameseFile()) {
           transcript.forEach(line => {
              line.viText = line.text;
              line.text = '[Phụ đề Tiếng Việt có sẵn]'; // Hide original English logic
           });
        }

        this.analysisResult.set({
          lines: transcript.length,
          transcript: transcript
        });
        
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
    reader.readAsText(this.selectedFile()!);
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
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const systemInstruction = `Bạn là một chuyên gia DỊCH THUẬT PHỤ ĐỀ VIDEO (tiếng Anh sang tiếng Việt) xuất sắc. 
Nhiệm vụ của bạn là nhận một mảng JSON chứa các dòng phụ đề tiếng Anh, và trả ra mảng JSON tiếng Việt với số lượng và thứ tự index KHÔNG ĐỔI.

NGUYÊN TẮC DỊCH THUẬT (ĐẶC TRƯNG VĂN NÓI YOUTUBE):
1. Tính chất văn nói (Spoken Language): Nội dung video chủ yếu là văn nói. Tùy thuộc vào bối cảnh (phim tài liệu, vlog, phỏng vấn, tâm sự, hài kịch, v.v..), hãy linh hoạt thay đổi từ vựng, ngữ điệu và đại từ xưng hô sao cho sát với ngữ cảnh tự nhiên nhất. Khung cảnh trang trọng thì dùng từ lịch sự, khung cảnh suồng sã bạn bè thì dùng từ lóng, trẻ trung. Tránh tuyệt đối việc dịch cứng nhắc kiểu word-by-word hoặc phong cách văn bản hành chính, Hán Việt dập khuôn.
2. Contextual Continuity (Tính liền mạch): Vì phụ đề bị giới hạn bởi thời gian hiển thị (timestamp), một câu nói thường bị cắt vụn ra nhiều dòng. BẮT BUỘC phải đọc tổng quan (look-ahead) các dòng phía sau để nắm rõ cấu trúc câu hoàn chỉnh, rồi mới quyết định chia từ vựng tiếng Việt tương ứng vào từng dòng một cách hợp lý và liền mạch.
3. Độ dài & Tốc độ đọc: Mắt đọc chậm hơn tai nghe. Ưu tiên sự SÚC TÍCH. Hãy dịch gọn gàng nhất có thể nhưng vẫn giữ nguyên cảm xúc. Bạn có quyền lược bỏ các từ đệm vô nghĩa (như "you know", "like", "actually") nếu nó làm phụ đề quá dài.
4. Cấu trúc đứt gãy & Cảm xúc: Giữ lại nhịp điệu ngập ngừng, chuyển ý đột ngột của người nói bằng dấu (...) hoặc gạch ngang (-). Đối với các câu cảm thán, hãy bọc lót tinh tế bằng các từ thuần Việt (ví dụ: "Trời ạ", "Thật luôn", "Này nhé", "Nè") để đẩy cảm xúc lên mức tự nhiên nhất.
5. Thuật ngữ Jargon: Đối với các video đặc thù (Gaming, Coding, Esports), hãy giữ nguyên các thuật ngữ tiếng Anh gốc phổ biến (ví dụ: buff, nerf, deploy, bug) thay vì cố dịch gượng ép sang tiếng Việt.`;

      const CHUNK_SIZE = 500;
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
           const prevStart = Math.max(0, startIndex - 3);
           const prevLines = translatedTranscript.slice(prevStart, startIndex);
           contextText = `[THÔNG TIN NGỮ CẢNH - KHÔNG DỊCH PHẦN NÀY]
Người nói vừa kết thúc đoạn trước bằng các câu sau:
${prevLines.map((l, i) => `${i + 1}. Anh: "${l.text}" -> Việt: "${l.viText}"`).join('\n')}

(Dựa vào ngữ cảnh đang nói dở dang ở trên, hãy tiếp tục dịch mảng JSON dưới đây)

`;
        }

        const prompt = `${contextText}[NHIỆM VỤ CỦA BẠN - CHỈ DỊCH DUY NHẤT MẢNG JSON DƯỚI ĐÂY]
Dịch toàn bộ mảng JSON sau sang tiếng Việt theo đúng các nguyên tắc trong System Instruction.
CHỈ TRẢ VỀ DUY NHẤT một mảng JSON string hợp lệ, độ dài mảng phải KHỚP 100% với dữ liệu đầu vào.

Input:
${JSON.stringify(textsToTranslate)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.5,
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          }
        });

        const output = response.text;
        if (!output) throw new Error("Empty response from AI");
        
        let translatedArray: string[] = [];
        try {
          translatedArray = JSON.parse(output);
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
      
      if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
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
    a.download = `viettrans_${this.videoId() || 'subtitles'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.addToast('Đã tải thành công file Phụ đề Tiếng Việt về máy.', 'success');
  }
}
