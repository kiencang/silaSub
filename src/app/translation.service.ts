import { Injectable, signal, computed, inject, WritableSignal } from "@angular/core";
import { ToastService, ToastType } from "./toast.service";
import { FileService } from "./file.service";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { TranscriptLine } from "./subtitle.service";

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  private toastService = inject(ToastService);
  private fileService = inject(FileService);

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
    this.stopTranslation();
  }

  async startTranslating(
    analysisResultSignal: WritableSignal<{ lines: number; transcript: TranscriptLine[] } | null>
  ) {
    const res = analysisResultSignal();
    if (!res || !res.transcript) return;

    const hasAudio = !!this.fileService.selectedAudioFile();
    const hasVideo = !!this.fileService.selectedVideoFile();

    if (this.translationMode() === "lyric" && res.transcript.length > 500) {
      this.toastService.addToast("Vượt quá 500 dòng. Không thể dịch ở chế độ Âm nhạc.", "error");
      return;
    }

    if (hasAudio || hasVideo) {
      if (res.transcript.length > 1000) {
        this.toastService.addToast(
          "Vượt quá 1000 dòng. Vui lòng tắt âm thanh/video đính kèm, hoặc cắt nhỏ file phụ đề và media tương ứng.",
          "error",
        );
        return;
      }

      const mediaDur = hasAudio ? this.fileService.audioDuration() : this.fileService.videoDuration();
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
            siUrl = (hasAudio) ? "/prompts/oa_music_system_instructions.md" : "/prompts/music_system_instructions.md";
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
          mode === "lyric"
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
        console.warn(fetchErr);
        throw new Error("SYSTEM_PROMPT_FETCH_ERROR");
      }

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const mode = this.translationMode();
      const CHUNK_SIZE = (mode === "lyric" || hasAudio || hasVideo) ? res.transcript.length : 600;
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
          start: parseFloat((line.offset / 1000).toFixed(2)),
          end: parseFloat(((line.offset + line.duration) / 1000).toFixed(2)),
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
          reqConfig['tools'] = [{ googleSearch: {} }];
        }

        let reqContents: unknown = prompt;
        if (hasAudio && this.fileService.selectedAudioFile()) {
            const audioFile = this.fileService.selectedAudioFile()!;
            const base64Audio = await this.fileService.readFileAsBase64(audioFile);
            reqContents = [
                {
                    inlineData: {
                        mimeType: audioFile.type || "audio/mp3",
                        data: base64Audio,
                    }
                },
                prompt
            ];
        } else if (hasVideo && this.fileService.selectedVideoFile()) {
            const videoFile = this.fileService.selectedVideoFile()!;
            const base64Video = await this.fileService.readFileAsBase64(videoFile);
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
          contents: reqContents as never,
          config: reqConfig,
        });

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
