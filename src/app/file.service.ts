import { Injectable, inject, signal } from "@angular/core";
import { ToastService } from "./toast.service";

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private toastService = inject(ToastService);

  selectedEnFile = signal<File | null>(null);
  selectedViFile = signal<File | null>(null);
  selectedAudioFile = signal<File | null>(null);
  audioDuration = signal<number | null>(null);
  
  showViUpload = signal(false);
  showAudioUpload = signal(false);

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Xóa phần prefix (VD: data:audio/mp3;base64,)
        const base64 = base64String.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  clearAudioFile(inputElement?: HTMLInputElement) {
    this.selectedAudioFile.set(null);
    this.audioDuration.set(null);
    if (inputElement) {
      inputElement.value = "";
    }
  }

  onAudioFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const MAX_SIZE = 60 * 1024 * 1024; // 60 MB
      if (file.size > MAX_SIZE) {
        this.toastService.addToast(`File âm thanh quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Giới hạn tối đa là 60 MB.`, "error");
        input.value = "";
        return;
      }

      // Read audio duration
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        const MAX_DURATION = 45 * 60; // 45 minutes
        if (duration > MAX_DURATION) {
            this.toastService.addToast(`File âm thanh quá dài (${Math.round(duration / 60)} phút). Giới hạn tối đa là 45 phút.`, "error");
            input.value = "";
            this.selectedAudioFile.set(null);
            this.audioDuration.set(null);
        } else {
            this.selectedAudioFile.set(file);
            this.audioDuration.set(duration);
            this.toastService.addToast(`Đã chọn file âm thanh (${Math.round(duration)}s)`, "success");
        }
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
          this.toastService.addToast("Không thể đọc thời lượng file âm thanh.", "error");
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

  clearEnFile(inputElement?: HTMLInputElement) {
    this.selectedEnFile.set(null);
    if (inputElement) {
      inputElement.value = "";
    }
  }

  onEnFileSelected(event: Event, onTranslatedFileDetected: (extractedId: string) => void, onParsed: () => void) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        this.toastService.addToast(
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
        this.toastService.addToast("Đã chuyển file dịch sẵn sang mục Tiếng Việt", "success");
        input.value = "";
        onTranslatedFileDetected(match[1]);
        onParsed();
        return;
      }

      this.selectedEnFile.set(file);
      onParsed();
    } else {
      this.selectedEnFile.set(null);
      onParsed();
    }
  }

  clearViFile(inputElement?: HTMLInputElement) {
    this.selectedViFile.set(null);
    if (inputElement) {
      inputElement.value = "";
    }
  }

  onViFileSelected(event: Event, onVideoDetected: (extractedId: string) => void, onParsed: (autoDetected: boolean) => void) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        this.toastService.addToast(
          `File dịch sẵn quá lớn (${(file.size / 1024).toFixed(1)} KB). Giới hạn tối đa là 500 KB.`,
          "error",
        );
        input.value = "";
        return;
      }

      const match = file.name.match(/silaSub_vi_([a-zA-Z0-9_-]{11})/);
      let autoDetected = false;
      if (match && match[1]) {
        const extractedId = match[1];
        autoDetected = true;
        this.toastService.addToast("Đã nạp Video thành công", "success");
        onVideoDetected(extractedId);
      }

      this.selectedViFile.set(file);
      onParsed(autoDetected);
    } else {
      this.selectedViFile.set(null);
      onParsed(false);
    }
  }

  downloadFile(content: string, fileName: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
