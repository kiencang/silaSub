import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from './toast.service';
import { StorageService } from './storage.service';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  
  searchQuery = signal("");
  isSearchingQuery = signal(false);
  translatedSearchQuery = signal("");
  encodedTranslatedQuery = computed(() => encodeURIComponent(this.translatedSearchQuery()));

  private getAuthHeaders(): Record<string, string> {
    const key = this.storageService.userApiKey();
    const headers: Record<string, string> = {};
    if (key) {
      headers["x-gemini-api-key"] = key;
    }
    return headers;
  }

  async searchYoutube() {
    this.translatedSearchQuery.set("");
    const rawQuery = this.searchQuery().trim();
    if (!rawQuery) return;

    // Phát hiện nếu người dùng nhập nhầm link thay vì từ khóa
    const isUrl = /^(https?:\/\/|www\.|youtube\.com|youtu\.be)/i.test(rawQuery);
    if (isUrl) {
      this.toastService.addToast(
        'Phần này dùng để nhập từ khóa tìm kiếm video, vui lòng nhập link video YouTube ở phần "Dán link Video..." bên cột phải.',
        'warning'
      );
      return;
    }

    this.isSearchingQuery.set(true);

    try {
      const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM:** Mục tiêu là tạo ra truy vấn mà người dùng tiếng Anh thực sự sẽ gõ vào máy tìm kiếm để tìm một video, hoặc gõ trực tiếp ngay trên YouTube. Ưu tiên từ khóa cốt lõi, ý định, sự ngắn gọn, và các cụm từ tìm kiếm phổ biến (how to, best, near me, price, review, etc.).
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

      const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else:\n[${this.searchQuery().trim()}]`;

      const key = this.storageService.userApiKey();
      if (!key) {
        throw new Error("Bắt buộc: Vui lòng truy cập Cài đặt để nhập Gemini API Key của bạn trước khi dịch từ khóa.");
      }

      const ai = new GoogleGenAI({ apiKey: key });

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const output = response.text || "";
      const cleanKeyword = output
        .replace(/```/g, "")
        .replace(/\n/g, "")
        .replace(/"/g, "")
        .replace(/'/g, "")
        .trim();

      if (cleanKeyword) {
        this.translatedSearchQuery.set(cleanKeyword);
      } else {
        this.toastService.addToast("Không thể dịch từ khóa", "error");
      }
    } catch (err) {
      console.error(err);
      const error = err as Error;
      let toastMsg = "Lỗi khi dịch từ khóa tìm kiếm";
      const errMsg = error.message || "";
      if (errMsg.includes("Bắt buộc")) {
        toastMsg = errMsg;
      } else if (
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota")
      ) {
        toastMsg = "API Key của bạn đã hết ngưỡng miễn phí hoặc giới hạn request. Vui lòng thử lại sau hoặc đổi API Key khác.";
      } else if (
        errMsg.includes("403") ||
        errMsg.toLowerCase().includes("permission")
      ) {
        toastMsg = "API Key của bạn không hợp lệ hoặc không có quyền truy cập Gemini API. Vui lòng kiểm tra lại.";
      }
      this.toastService.addToast(toastMsg, "error");
    } finally {
      this.isSearchingQuery.set(false);
    }
  }
}
