import { Injectable } from "@angular/core";

export interface TranscriptLine {
  text: string;
  viText?: string;
  duration: number;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubtitleService {
  cleanAudioTags(text: string): string {
    const audioTagRegex = /\[.*?(music|upbeat).*?\]/gi;
    const textWithoutTags = text.replace(audioTagRegex, "").trim();

    if (!/[a-zA-Z0-9\u00C0-\u017F]/.test(textWithoutTags)) {
      return text;
    }

    const cleaned = text.replace(audioTagRegex, (match, _, offset) => {
      const beforeStr = text.substring(0, offset);
      const afterStr = text.substring(offset + match.length);

      const cleanBefore = beforeStr.replace(/\[.*?\]/g, "");
      const hasTextBefore = /[a-zA-Z0-9\u00C0-\u017F]/.test(cleanBefore);

      const cleanAfter = afterStr.replace(/\[.*?\]/g, "");
      const hasTextAfter = /[a-zA-Z0-9\u00C0-\u017F]/.test(cleanAfter);

      if (hasTextBefore && hasTextAfter) {
        return " ";
      }

      return match;
    });

    return cleaned.replace(/\s{2,}/g, " ").trim();
  }

  parseSRT(srtData: string, preserveNewlines = false): TranscriptLine[] {
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

    for (const lineRaw of lines) {
      const line = lineRaw.trim();
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

    if (current.offset !== undefined && textBuffer.length > 0) {
      const joinedText = textBuffer.join(preserveNewlines ? "\n" : " ");
      current.text = this.cleanAudioTags(joinedText);
      transcript.push(current as TranscriptLine);
    }
    return transcript;
  }

  generateSrtContent(transcript: TranscriptLine[]): string {
    const pad = (num: number, size: number) => ("000" + num).slice(-size);
    const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.floor(totalSeconds % 60);
      const ms = Math.floor((totalSeconds % 1) * 1000);
      return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
    };

    let srtContent = "";
    transcript.forEach((line, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(line.offset)} --> ${formatTime(line.offset + line.duration)}\n`;
      srtContent += `${line.viText || line.text}\n\n`;
    });
    
    return srtContent;
  }

  mergeTranscripts(enText: string | null, viText: string | null): TranscriptLine[] {
    let mergedTranscript: TranscriptLine[] = [];
    const enTranscript = enText ? this.parseSRT(enText, false) : [];
    const viTranscript = viText ? this.parseSRT(viText, true) : [];

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
    
    if (mergedTranscript.length === 0 && (enText != null || viText != null)) {
      throw new Error("File không đúng định dạng SRT hoặc trống.");
    }
    
    return mergedTranscript;
  }
}
