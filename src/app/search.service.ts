import { Injectable, inject, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private toastService = inject(ToastService);
  
  searchQuery = signal("");
  isSearchingQuery = signal(false);

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
        .replace(/"/g, "")
        .replace(/'/g, "")
        .trim();

      if (cleanKeyword) {
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword)}`,
          "_blank",
        );
      } else {
        this.toastService.addToast("Không thể dịch từ khóa", "error");
      }
    } catch (err) {
      console.error(err);
      this.toastService.addToast("Lỗi khi dịch từ khóa tìm kiếm", "error");
    } finally {
      this.isSearchingQuery.set(false);
    }
  }
}
