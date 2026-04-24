# Changelog

Tất cả những thay đổi đáng chú ý của dự án kiencang/SI-Prompt-EV-Translate sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.23] - 2026-04-25
### Fixed
- SI phiên bản mới nhất (điều chỉnh Ưu tiên 2, cho phép mượn/trả, san sẻ ý nghĩa).

## [v1.0.22] - 2026-04-25
### Fixed
- Điều chỉnh thông báo khi dịch kiểu chunking hợp lý hơn.
- Cập nhật SI phiên bản mới nhất (tăng cường chất lượng các ví dụ).

## [v1.0.21] - 2026-04-25
### Fixed
- Chỉnh UI cho input tìm kiếm.
- Lên SI phiên bản mới nhất (cập nhật lại phần "Cô đọng ý nghĩa", bổ sung, điều chỉnh nhiều ví dụ).
- Loại bỏ sound-tag [music] nằm giữa câu, gây phân tâm trong câu.

## [v1.0.20] - 2026-04-24
### Fixed
- Chỉnh cỡ chữ to thêm cho 2 phần input.
- Chỉnh lại footer cho đỡ bí.
- Chỉnh lại cuộn phụ đề trực tiếp thoáng hơn.
- Chỉnh lại logo.
- Cập nhật SI.

## [v1.0.19] - 2026-04-24
### Fixed
- Cho input nhập video sang cột phải.
- Thêm công cụ tìm kiếm video trên YouTube.

## [v1.0.18] - 2026-04-24
### Fixed
- Lên SI phiên bản mới nhất (khắc phục lỗi timing).

## [v1.0.17] - 2026-04-23
### Fixed
- Lỗi tên phiên bản. 

## [v1.0.16] - 2026-04-23
### Fixed
- Cập nhật SI lên phiên bản mới nhất (điều chỉnh mã markdown, chỉ thị phong cách dịch, thêm tag xml phân đoạn SI dài).
- Tăng chunking lên 900, tăng bối cảnh cũ lên 45 (trước đây là 35).

## [v1.0.15] - 2026-04-23
### Fixed
- Cập nhật SI lên phiên bản mới nhất (điều chỉnh ví dụ tốt hơn).
- Tăng chunking lên 700, tăng bối cảnh cũ lên 35 (trước đây là 10).
- Ngưỡng 700 sẽ xử lý tốt đa số các video có độ dài từ 25 phút đổ xuống.

## [v1.0.14] - 2026-04-23
### Fixed
- Cập nhật SI lên phiên bản mới nhất.

## [v1.0.13] - 2026-04-23
### Fixed
- Cập nhật SI lên phiên bản mới nhất.
- Giảm chunking thành 500 index, và tăng số câu từ bản chunk trước lên 10. Mục đích là giảm tải cho AI và tăng cường bối cảnh cũ để dịch mượt hơn.

## [v1.0.12] - 2026-04-23
### Fixed
- Thêm link YouTube vào input, hộp phụ đề sáng lên.
- Toast thông báo tải phụ đề tiếng Việt về thông báo chi tiết hơn (thêm tên file vào).

## [v1.0.11] - 2026-04-23
### Fixed
- Thêm tùy chọn đổi màu chữ cho font chữ (thêm 2 màu).
- Thêm phần định hướng phong cách dịch trong SI.

## [v1.0.10] - 2026-04-22
### Fixed
- Điều chỉnh SI dịch thuật.
- Điều chỉnh font chữ mặc định hiển thị phụ đề thành Lexend.

## [v1.0.9] - 2026-04-22
### Fixed
- Chỉnh kích cỡ tối đa của phần phụ đề trên màn hình lớn (900px chiều ngang).
- Cải thiện UX/UI của input nhập URL và input tải file .srt lên.
- Điều chỉnh lại SI để nó đáp ứng kiểu dịch tương ứng 1 - 1 giữa hành động nói trên video (đảm bảo timing, chấp nhận hy sinh một phần tính tự nhiên).

## [v1.0.8] - 2026-04-22
### Fixed
- Điều chỉnh lỗi CSS hiển thị phụ đề khiến từ bị rớt xuống cụt lủn.
- Điều chỉnh kích cỡ scrollbar.
- Chỉnh SI để làm biên tập file phụ đề tốt hơn (nhất là với mấy câu dài).

## [v1.0.7] - 2026-04-21
### Fixed
- Tính năng mở rộng hộp cuộn phù đề trực tiếp (cho những ai muốn học tiếng Anh, hoặc cho những đoạn nói quá nhanh cần xem lại đoạn trước,..).
- Căn lề cột trái để hiển thị video tốt hơn (không bị mất lề).
- Click dấu x trong input video sẽ xóa hết các thông tin của video trước (phụ đề, hộp cuộn) để đảm bảo logic vận hành.

## [v1.0.6] - 2026-04-21
### Fixed
- Cải thiện tính năng của phần cuộn phụ đề trực tiếp (click vào phụ đề cột phải sẽ nhảy sang play tại thời điểm tương ứng).
- Chỉnh mốc thời gian hiển thị theo phong cách 'con người', ví dụ 10:50 (thay vì 650s) ở hộp cuộn phụ đề trực tiếp.

## [v1.0.5] - 2026-04-21
### Fixed
- Cấu trúc lại vị trí của input nhập video (cho lên header) và input nhập phụ để (cho sang cột phải).
- Tăng khả năng điều chỉnh khoảng cách phụ đề từ đáy.
- Khắc phục lỗi font chữ trên di động quá to.
- Điều chỉnh lại vị trí xuất hiện của Cài đặt phụ đề, người dùng dễ dàng nhìn thấy điều chỉnh của họ theo thời gian thực với video thực tế bên cột trái.

## [v1.0.4] - 2026-04-21
### Removed
- Bỏ nút Phân tích Phụ đề dư thừa không cần thiết.

### Added
- Thêm tính năng tải phụ đề tiếng Việt lên thì tự động lắp video vào (nhận biết thông qua tên file).
- Thêm tính năng điều chỉnh khoảng cách của phụ đề so với đáy.

## [v1.0.3] - 2026-04-21
### Added
- Thêm phần tùy chỉnh temperature.
- Thêm phần cài đặt loại font, cỡ chữ, mức độ đậm của nền.
- Một lời nhắc về cách lấy file .srt
