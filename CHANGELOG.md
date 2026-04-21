# Changelog

Tất cả những thay đổi đáng chú ý của dự án kiencang/SI-Prompt-EV-Translate sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.7] - 2026-04-21
### Fixed
- Tính năng mở rộng hộp cuộn phù đề trực tiếp.
- Căn lề cột trái để hiển thị video tốt hơn (không bị mất lề).
- Click dấu x trong input video sẽ xóa hết các thông tin của video trước (phụ đề, hộp cuộn) để đảm bảo logic vận hành.

## [v1.0.6] - 2026-04-21
### Fixed
- Cải thiện tính năng của phần cuộn phụ đề trực tiếp.

## [v1.0.5] - 2026-04-21
### Fixed
- Cấu trúc lại vị trí của input nhập video (cho lên header) và input nhập phụ để (cho sang cột phải).
- Tăng khả năng điều chỉnh khoảng cách phụ đề từ đáy.
- Khắc phục lỗi font chữ trên di động quá to.
- Điều chỉnh lại vị trí xuất hiện của Cài đặt phụ đề, người dùng dễ dàng nhìn thấy điều chỉnh của họ theo thời gian thực.

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
