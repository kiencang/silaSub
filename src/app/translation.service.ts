import { Injectable, signal, computed, inject, WritableSignal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ToastService, ToastType } from "./toast.service";
import { FileService } from "./file.service";
import { TranscriptLine, SubtitleService } from "./subtitle.service";
import { HistoryService } from "./history.service";
import { AppStateService } from "./app.state.service";
import { VideoService } from "./video.service";

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  private toastService = inject(ToastService);
  private fileService = inject(FileService);
  private subtitleService = inject(SubtitleService);
  private historyService = inject(HistoryService);
  private appState = inject(AppStateService);
  private videoService = inject(VideoService);
  private http = inject(HttpClient);

  aiTemperature = signal<number>(0.5);
  aiModel = signal<string>("gemini-pro-latest");
  translationMode = signal<"multi-task" | "lyric">("multi-task");
  useGoogleSearch = signal<boolean>(false);

  isTranslating = signal(false);
  translateError = signal<string | null>(null);

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
  analyzedBlocksJson = signal<string | null>(null);
  analyzedBlocksFileName = signal<string | null>(null);
  translationPhaseInfo = signal<string | null>(null);
  
  private translateTimerInterval: ReturnType<typeof setInterval> | undefined;

  stopTranslation() {
    this.isTranslating.set(false);
    if (this.translateTimerInterval) clearInterval(this.translateTimerInterval);
  }

  resetState() {
    this.translateError.set(null);
    this.translationCurrentChunk.set(0);
    this.translationTotalChunks.set(0);
    this.translationCompletedText.set(null);
    this.analyzedBlocksJson.set(null);
    this.analyzedBlocksFileName.set(null);
    this.translationPhaseInfo.set(null);
    this.stopTranslation();
  }

  async startTranslating(
    analysisResultSignal: WritableSignal<{ lines: number; transcript: TranscriptLine[] } | null>
  ) {
    const res = analysisResultSignal();
    if (!res || !res.transcript) return;

    const hasAudio = !!this.fileService.selectedAudioFile();

    if (this.translationMode() === "lyric" && res.transcript.length > 500) {
      this.toastService.addToast("Vượt quá 500 dòng. Không thể dịch ở chế độ Âm nhạc.", "error");
      return;
    }

    if (hasAudio) {
      if (res.transcript.length > 1000) {
        this.toastService.addToast(
          "Vượt quá 1000 dòng. Vui lòng tắt âm thanh đính kèm, hoặc cắt nhỏ file phụ đề và media tương ứng.",
          "error",
        );
        return;
      }

      const mediaDur = this.fileService.audioDuration();
      if (mediaDur !== null) {
        const lastLine = res.transcript[res.transcript.length - 1];
        const lastTime = lastLine.offset + lastLine.duration;
        if (mediaDur < lastTime - 5) {
          this.toastService.addToast(
            "Thời lượng media quá ngắn so với phụ đề tiếng Anh đã tải lên.",
            "error",
          );
          return;
        }
      }
    } else {
      if (this.translationMode() === "multi-task" && res.transcript.length > 5000) {
        this.toastService.addToast(
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
        
        if (mode === "lyric") {
            siUrl = (hasAudio) ? "/prompts/oa_lyric_system_instructions.md" : "/prompts/lyric_system_instructions.md";
        } else {
            if (hasAudio) {
                 siUrl = "/prompts/oa_multi_system_instructions.md";
            } else {
                 siUrl = "/prompts/multi_system_instructions.md";
            }
        }
        
        const promptUrl =
          mode === "lyric"
            ? "/prompts/lyric_prompt.md"
            : "/prompts/multi_prompt.md";

        const [siRes, promptRes] = await Promise.all([
          fetch(`${siUrl}?t=${timestamp}`),
          fetch(`${promptUrl}?t=${timestamp}`),
        ]);

        if (!siRes.ok || !promptRes.ok)
          throw new Error("Network response bounds error.");
        systemInstruction = await siRes.text();
        promptTemplate = await promptRes.text();
      } catch (fetchErr) {
        console.warn(fetchErr);
        throw new Error("SYSTEM_PROMPT_FETCH_ERROR");
      }

      const mode = this.translationMode();
      const CHUNK_SIZE = (mode === "lyric" || hasAudio) ? res.transcript.length : 600;
      const fullTranscript = res.transcript;
      const totalChunks = Math.ceil(fullTranscript.length / CHUNK_SIZE);
      const translatedTranscript = [...fullTranscript];
      const allDevData: { id: number; start: number; end: number; gap: number | null; en: string; block?: number | null }[] = [];

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
        const textsToTranslate: { id: number, start: number, end: number, gap: number | null, en: string, block?: number | null }[] = currentChunk.map((line, idx) => {
          const globalIdx = startIndex + idx;
          let gap: number | null = null;
          if (globalIdx > 0) {
            const prevLine = fullTranscript[globalIdx - 1];
            const prevEnd = prevLine.offset + prevLine.duration;
            gap = parseFloat((line.offset - prevEnd).toFixed(2));
          }
          return {
            id: globalIdx,
            start: parseFloat(line.offset.toFixed(2)),
            end: parseFloat((line.offset + line.duration).toFixed(2)),
            gap: gap,
            en: line.text,
          };
        });

        // Phase 1: Muti-task with Extra Context -> Speaker Boundary Analysis
        if (mode === "multi-task" && hasAudio) {
          this.translationPhaseInfo.set("PHASE 1: Phân tích ranh giới...");
          try {
            const phase1SiRes = await fetch(`/prompts/speaker_boundary_system_instructions.md?t=${Date.now()}`);
            if (!phase1SiRes.ok) throw new Error("Phase 1 SI fetch failed");
            const phase1Si = await phase1SiRes.text();
            
            const reqConfigPhase1: Record<string, unknown> = {
              systemInstruction: phase1Si,
              responseMimeType: "application/json",
              temperature: 0.1,
              thinkingConfig: { thinkingLevel: 5 }, // 5 = HIGH
              responseSchema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    block: { type: ["integer", "null"] },
                  },
                  required: ["id", "block"],
                },
              },
            };

            const phase1Prompt = "Phân tích ranh giới người nói cho mảng JSON sau:\n\n" + JSON.stringify(textsToTranslate, null, 2);
            let reqContentsPhase1: unknown[] = [{ role: 'user', parts: [{ text: phase1Prompt }] }];

            if (this.fileService.selectedAudioFile()) {
                const audioFile = this.fileService.selectedAudioFile()!;
                const base64Audio = await this.fileService.readFileAsBase64(audioFile);
                reqContentsPhase1 = [
                  { 
                    role: 'user', 
                    parts: [
                      { inlineData: { mimeType: audioFile.type || "audio/mp3", data: base64Audio } },
                      { text: phase1Prompt }
                    ] 
                  }
                ];
            }

            const phase1Res = await firstValueFrom(this.http.post<{ text: string }>('/api/ai/generate', {
              model: this.aiModel(),
              contents: reqContentsPhase1,
              config: reqConfigPhase1
            }));
            
            const phase1Data = JSON.parse(phase1Res.text || "[]");
            
            // Merge block into textsToTranslate
            textsToTranslate.forEach(t => {
               const bInfo = phase1Data.find((b: { id: number, block: number | null }) => b.id === t.id);
               t.block = bInfo ? (bInfo.block !== undefined ? bInfo.block : null) : null;
            });

            // -----------------------------------------------------------------
            // [Quy tắc dồn chữ] Xử lý từ mồ côi (Orphan words)
            // 1. Mang từ đầu tiên có kèm dấu ngắt câu lên vị trí cuối dòng trước
            // 2. Đẩy từ cuối cùng mồ côi sau dấu ngắt câu xuống đầu dòng sau
            // (Chỉ áp dụng khi không phải chế độ dịch bài hát - lyric)
            // -----------------------------------------------------------------
            if (this.translationMode() !== "lyric") {
              for (let i = 1; i < textsToTranslate.length; i++) {
                const prev = textsToTranslate[i - 1];
                const curr = textsToTranslate[i];

                if (
                  curr.block != null &&
                  prev.block === curr.block &&
                  typeof curr.gap === "number" &&
                  curr.gap <= 0.1
                ) {
                  // 1. Mang từ mồ côi ở ĐẦU dòng dưới lên CUỐI dòng trên
                  // Đảm bảo dòng trước đó chưa kết thúc bằng dấu câu
                  const prevEndsWithPunctuation = /[.,!?;:]["']?$/.test(prev.en.trim());
                  
                  if (!prevEndsWithPunctuation) {
                    const cWords = curr.en.trim().split(/\s+/);
                    if (cWords.length >= 4) {
                      const firstWord = cWords[0];
                      if (/[.,!?;:]["']?$/.test(firstWord)) {
                        // Di chuyển từ đầu tiên của curr lên cuối prev
                        prev.en = prev.en.trim() + " " + firstWord;
                        // Loại bỏ từ đầu tiên khỏi curr
                        curr.en = cWords.slice(1).join(" ");
                      }
                    }
                  }

                  // 2. Đẩy từ mồ côi ở CUỐI dòng trên xuống ĐẦU dòng dưới
                  const pWords = prev.en.trim().split(/\s+/);
                  if (pWords.length >= 4) {
                    const lastWord = pWords[pWords.length - 1];
                    const secondToLastWord = pWords[pWords.length - 2];

                    if (/[.,!?;:]["']?$/.test(secondToLastWord) && !/[.,!?;:]["']?$/.test(lastWord)) {
                      // Đẩy từ cuối cùng của prev xuống đầu curr
                      curr.en = lastWord + " " + curr.en.trim();
                      // Loại bỏ từ cuối cùng khỏi prev
                      prev.en = pWords.slice(0, pWords.length - 1).join(" ");
                    }
                  }
                }
              }
            }
            // -----------------------------------------------------------------

            // Generate filename based on subtitle file
            const subFile = this.fileService.selectedEnFile();
            const subName = subFile ? subFile.name.replace(/\.[^/.]+$/, "") : "subtitle";
            this.analyzedBlocksFileName.set(`silaSub_${subName}_blocks.json`);

            allDevData.push(...textsToTranslate);
            this.analyzedBlocksJson.set(JSON.stringify(allDevData, null, 2));
          } catch (phase1Err) {
            console.error("Phase 1 error:", phase1Err);
            throw new Error("Lỗi khi phân tích ranh giới người nói. Vui lòng thử lại.");
          }
          
          this.translationPhaseInfo.set("PHASE 2: Dịch thuật ngữ nghĩa...");
        } else {
          const subFile = this.fileService.selectedEnFile();
          const subName = subFile ? subFile.name.replace(/\.[^/.]+$/, "") : "subtitle";
          this.analyzedBlocksFileName.set(`silaSub_${subName}_input.json`);
          // Loại bỏ properties 'block' không cần thiết ở normal mode
          const devData = textsToTranslate.map(t => {
            const line = { ...t };
            if ('block' in line) delete line.block;
            return line;
          });
          allDevData.push(...devData);
          this.analyzedBlocksJson.set(JSON.stringify(allDevData, null, 2));

          this.translationPhaseInfo.set(null);
        }

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

        const prompt = promptTemplate
          .replace("{{CONTEXT_TEXT}}", contextText)
          .replace(
            "{{JSON_PAYLOAD}}",
            JSON.stringify(textsToTranslate, null, 2),
          );

        const reqConfig: Record<string, unknown> = {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: this.aiTemperature(),
          thinkingConfig: { thinkingLevel: 5 }, // 5 = HIGH
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
          reqConfig['tools'] = [{ googleSearch: {} }];
        }

        let reqContents: unknown[] = [{ role: 'user', parts: [{ text: prompt }] }];
        if (hasAudio && this.fileService.selectedAudioFile()) {
            const audioFile = this.fileService.selectedAudioFile()!;
            const base64Audio = await this.fileService.readFileAsBase64(audioFile);
            reqContents = [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: audioFile.type || "audio/mp3",
                      data: base64Audio,
                    }
                  },
                  { text: prompt }
                ]
              }
            ];
        }

        const response = await firstValueFrom(this.http.post<{ text: string }>('/api/ai/generate', {
          model: this.aiModel(),
          contents: reqContents,
          config: reqConfig,
        }));

        const output = response.text;
        if (!output) throw new Error("Empty response from AI");

        const cleanOutput = output
          .replace(/```json\n?/gi, "")
          .replace(/```\n?/g, "")
          .trim();

        let translatedArray: { id: number; vi: string }[] = [];
        try {
          translatedArray = JSON.parse(cleanOutput);
        } catch (parseError) {
          console.warn(parseError);
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
          if (typeof finalViText === "string") {
            finalViText = finalViText.replace(/<br\s*\/?>/gi, "\n");
          }

          translatedTranscript[expectedId] = {
            ...translatedTranscript[expectedId],
            viText: finalViText,
          };
        }

        // Update UI progressively
        analysisResultSignal.set({
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
      this.toastService.addToast(
        `Tuyệt vời! Đã dịch thành công trong ${this.formattedTranslationTime()} phút!`,
        "success",
      );
      this.isTranslating.set(false);

      // Save to History using the completed translatedTranscript
      const youtubeUrl = this.appState.videoUrl() || null;
      let videoName = "Không rõ video";
      
      const enFile = this.fileService.selectedEnFile();
      if (enFile) {
        videoName = enFile.name.replace(/\.[^/.]+$/, "");
      }

      const enSrtContent = this.subtitleService.generateSrtContent(
        translatedTranscript.map(t => ({ ...t, text: t.text, viText: undefined }))
      );
      
      const viSrtContent = this.subtitleService.generateSrtContent(translatedTranscript);

      this.historyService.saveTranslation({
        videoName,
        youtubeUrl,
        enSrtContent,
        viSrtContent
      });
    } catch (err) {
      const error = err as Error;
      console.error(error);
      clearInterval(this.translateTimerInterval);
      this.translationCurrentChunk.set(0);
      this.translationTotalChunks.set(0);

      const errMsg = error.message || "";
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
      this.toastService.addToast(toastMsg, toastType);

      this.isTranslating.set(false);
    }
  }
}
