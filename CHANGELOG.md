# Changelog

Tất cả những thay đổi đáng chú ý của dự án kiencang/SI-Prompt-EV-Translate sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.76] - 2026-06-02
### Fixed
- Từ khóa dịch tìm kiếm video YouTube trả kết quả về một dạng dropdown thay vì tự động mở cửa sổ ra ở tab mới (phòng lỗi chặn của trình duyệt);
- Cập nhật hướng dẫn sử dụng;

## [1.0.75] - 2026-06-01
### Fixed
- Điều chỉnh số ký tự ước chừng xuống thành 12 ký tự/s trong TTS (để tránh TTS phát âm chậm).
- Điều chỉnh loại bỏ xuống dòng trước khi truyền vào TTS (xuống dòng để tối ưu hiển thị phụ đề tránh tràn dòng), đưa vào TTS cần loại bỏ để phát âm được mượt hơn.
- Điều chỉnh loại các chú thích tiếng Anh trong ngoặc đơn và chú thích trong ngoặc vuông trước khi đưa vào TTS.

## [1.0.74] - 2026-06-01
### Fixed
- Cập nhật tính năng lồng tiếng (sử dụng audio TTS của hệ điều hành).

## [1.0.73] - 2026-05-29
### Fixed
- Chỉnh title của index.html

## [1.0.72] - 2026-05-26
### Fixed
- Loại bỏ các file serverside dư thừa vì nay ứng dụng đã là clientside.

## [1.0.71] - 2026-05-25
### Fixed
- Chuyển về dạng Clientside, và bắt buộc nhập API Key để dịch.
- Chỉnh sửa giao diện nhập API Key.

## [v1.0.70]- 2026-05-24
### Fixed
- Chỉnh lại một số Toast để thông báo chuẩn hơn.
- Bắt lỗi input phần đưa link web vào phần dịch từ khóa.
- Chỉnh chút tooltip.

## [v1.0.69]- 2026-05-21
### Fixed
- Thiết lập cài đặt khóa API dùng riêng.
- Loại bỏ temperature.

## [v1.0.68]- 2026-05-20
### Fixed
- Đổi mặc định sang model Flash, vì những hạn chế ở model Pro ở tài khoản miễn phí.

## [v1.0.67]- 2026-05-14
### Fixed
- Chỉnh lại nút toàn màn hình để xem video YouTube bị lệch.
- AI Studio tự động đưa khóa API key chuyển về tầng server để an toàn hơn.

## [v1.0.66]- 2026-05-07
### Fixed
- Đồng bộ về một bộ icon duy nhất (Angular Material).
- Sửa các lỗi lặt vặt về vị trí icon không cân đối do hệ thống icon svg cũ để lại.

## [v1.0.65]- 2026-05-06
### Fixed
- Điều chỉnh lại giao diện của mục History.
- Trong khi dịch, mục History phải bị khóa để tránh người dùng nạp lại thông tin khiến bản đang dịch bị cắt đứt giữa chừng.
- Điều chỉnh vị trí nút History từ footer lên Khung video, tính năng này có khả năng được dùng thường xuyên nên cần có vị trí nổi bật hơn (khi chuyển lên khung video chính cái việc khóa mục history tự động thành hiện thực! Vì chuyển lên khung chính nghĩa là đang dịch thì không thấy nút để mà bấm).

## [v1.0.64]- 2026-05-06
### Added
- Thêm tính năng lịch sử dịch để tiện xem lại video khi cần.

## [v1.0.63]- 2026-05-06
### Fixed
- Video mới, tốc độ phát phải về mặc định.
- Phải ẩn được hộp điều chỉnh tốc độ khi chế độ mở của phụ đề được bung ra.
- Phát triền thêm nút gạt Dev, chỉ hiện thị thông tin trung gian cho người phát triển, không cần thiết cho người dùng cuối.

## [v1.0.62]- 2026-05-05
### Fixed
- Bổ sung cơ chế kiểm tra tên file .srt tiếng Việt up lên có phải là lyric hay không, để không hiển thị phần kiểm tra tốc độ đọc (vì cái này không áp dụng cho âm nhạc).
- Nút bật tắt phụ đề tiếng Anh phải luôn có mặt khi có phụ đề tiếng Anh.
- Nút bật tắt phụ đề tiếng Anh phải quay về trạng thái mặc định khi người dùng nhập video tiếng Anh mới (nhập input).

## [v1.0.61]- 2026-05-05
### Added
- Bổ sung hộp cảnh báo tốc độ phụ đề quá cao & cho phép điều chỉnh lại tốc độ phát video khi cần.

## [v1.0.60]- 2026-05-03
### Fixed
- Bổ sung xử lý khi từ mồ côi ở cuối dòng.

### Added
- Nút bật/tắt phụ đề tiếng Anh khi xem.

## [v1.0.59]- 2026-05-03
### Fixed
- Nâng giới hạn độ dài file audio (từ 30 lên 45 phút).
- Chỉnh lại một chút giao diện (màu nút bấm, đường viền).

## [v1.0.58]- 2026-05-03
### Fixed
- Cập nhật lên SI phiên bản mới nhất.

## [v1.0.57]- 2026-05-03
### Fixed
- Điều chỉnh hướng dẫn sử dụng để tránh bị cache.
- Thêm giải thích rõ ràng hơn cho phần up lên audio.

### Added
- Thêm nút chia sẻ ứng dụng để người dùng tiện copy ngay.

## [v1.0.56]- 2026-05-03
### Fixed
- Tình chỉnh SI.
- Đổi tên file SI chế độ đa nhiệm cho thống nhất tư duy.
- Tăng giới hạn up lên của file audio lên 60 MB.

## [v1.0.55]- 2026-05-03
### Fixed
- Thêm lưu ý cho tab Tải lên Audio.

### Removed
- Loại bỏ tính năng tải lên Video vì chi phí token quá đắt đỏ.

## [v1.0.54]- 2026-05-02
### Fixed
- Hạ mức độ gắt của dịch lyric hiphop, chuyển 'bố mày' thành 'anh mày' (điều chỉnh SI).
- Chỉnh nhẹ SI ov_ để nhận diện giới tính và tuổi tác tốt hơn.

## [v1.0.53]- 2026-05-02
### Fixed
- Chỉnh nhẹ gap giữa 2 index cho phần xét từ mồ côi.
- Giảm mức độ thu hút của Tải lên phụ đề tiếng Việt, để người dùng tránh hiểu nhầm.
- Bổ sung các tooltip giải thích để người dùng dễ dùng hơn.

## [v1.0.52]- 2026-05-02
### Fixed
- Chỉnh sửa tooltip lặt vặt.
- Chỉnh sửa chút hướng dẫn sử dụng.
- Điều chỉnh lại giao diện, sắp xếp luồng thao tác sang cột phải, không phân mảnh trái và phải đồng thời nữa.

## [v1.0.51]- 2026-05-02
### Fixed
- Xử lý tự động từ mồ côi (chỉ áp dụng khi với kiểu dịch 2 phase, khi ranh giới người nói được xác định với độ tin cậy cao).
- Không áp dụng xử lý từ mồ côi với chế độ dịch lời bài hát (vì lời bài hát có đặc thù nhả chữ riêng, nên tôn trọng).
- Chuyển tính năng Search về mặc định tắt, phòng ngừa bị quá giới hạn miễn phí, chỉ dùng khi cần thiết.

## [v1.0.50]- 2026-05-02
### Fixed
- Cập nhật hướng dẫn sử dụng.
- Cập nhật SI cho phần xác định ranh giới người nói.
- Sửa lỗi sai thời gian start, end do chia thêm cho 1000!

## [v1.0.49]- 2026-05-01
### Fixed
- Thay đổi font chữ & mức độ trong của màu nền cho font chữ.
- Thay đổi mặc định tắt +search thành bật +search và điều chỉnh lại thông tin ở tooltips cho phù hợp với bối cảnh mới.

## [v1.0.48]- 2026-05-01
### Fixed
- Điều chỉnh hướng dẫn sử dụng.
- Khắc phục lỗi trang hướng dẫn sử dụng bị cache.

## [v1.0.47]- 2026-05-01
### Fixed
- Tinh chỉnh SI.
- Loại bỏ thẻ audio tags (music|upbeat|laughter|applause) bất kể vị trí nào trong index, trừ khi chúng chỉ có một mình.
- Chỉnh lại giao diện của ứng dụng, thống nhất tông màu.

## [v1.0.46]- 2026-05-01
### Fixed
- Thêm một font chữ kiểu monospace cho người dùng.
- Khóa chết tải audio, video lên ở chế độ Flash, do các chỉ thị phức tạp chỉ dùng ở chế độ Pro mới hiệu quả.
- Chuyển dịch chế độ 'Thêm bối cảnh' thành dạng 2 phase để cải thiện chất lượng xử lý
- Điều chỉnh nhẹ SI để phù hợp với chế độ 2 phase.
- Rút gọn 3 SI tương đối nhiều với chế độ dịch đa nhiệm (loại bỏ các chỉ thị phù hợp về lý thuyết nhưng khó thực thi hiệu quả).
- Đổi tên các SI cho phù hợp hơn.

## [v1.0.45]- 2026-04-30
### Fixed
- Bổ sung gap vào thông tin đầu vào cho AI.
- Gap là khoảng cách thời gian giữa 2 câu.

## [v1.0.44]- 2026-04-30
### Fixed
- Cập nhật SI/Prompt phiên bản mới nhất.
- Chỉnh nhẹ giao diện.

## [v1.0.43]- 2026-04-30
### Fixed
- Tái cấu trúc lại mã, chia mã khổng lồ trong app.ts và app.html thành các phần nhỏ hơn.
- Bổ sung thêm thông tin vào tên file tải về (model, temp, search).
- Điều chỉnh subtile đầu vào có thêm thông tin start và end của thời gian phụ đề (nhắm cung cấp thêm ngữ cảnh và giúp AI tiện đối chiếu hơn).
- Điều chỉnh SI tương ứng để phù hợp với kiểu thông tin đầu vào mới.

## [v1.0.42]- 2026-04-29
### Fixed
- Thêm tên video vào file tải về.

## [v1.0.41]- 2026-04-28
### Added
- Thêm danh sách các kênh ưa thích.

## [v1.0.40]- 2026-04-28
### Added
- Thêm hướng dẫn sử dụng.

## [v1.0.39]- 2026-04-28
### Fixed
- Tinh chỉnh SI.

## [v1.0.38]- 2026-04-28
### Fixed
- Tinh chỉnh SI, đặc biệt cho phần đại từ nhân xưng.
- Chỉnh một chút giao diện.

## [v1.0.37]- 2026-04-27
### Added
- Bổ sung SI cho dữ liệu đầu vào là video.

## [v1.0.36]- 2026-04-27
### Fixed
- Cập nhật SI dành riêng cho việc có thêm dữ liệu âm thanh (tận dụng lợi thế xác định rõ ranh giới người nói).

## [v1.0.35]- 2026-04-27
### Fixed
- Cập nhật SI dành riêng cho việc có thêm dữ liệu âm thanh.

## [v1.0.34]- 2026-04-27
- Không có!

## [v1.0.33]- 2026-04-27
### Added
- Bổ sung tính năng bổ trợ âm thanh giúp quá trình dịch phụ đề chuẩn hơn.

## [v1.0.32]- 2026-04-26
### Fixed
- Cập nhật SI cho music.

## [v1.0.31]- 2026-04-26
### Added
- Bổ sung tính năng tra cứu với Google tìm kiếm (trong khi AI dịch / grounding with google search).

### Fixed
- Cập nhật SI phiên bản mới nhất.

## [v1.0.30]- 2026-04-26
### Fixed
- Sửa các tiêu đề hộp cho rõ ràng.
- Sửa lại button dịch thay đổi theo các cài đặt cho không nhầm lẫn.

## [v1.0.29]- 2026-04-26
### Fixed
- Sửa lại hoàn toàn SI dịch lyric.
- Sửa lại tính năng up file .srt cho rõ ràng hơn (phân rõ up file tiếng Anh và tiếng Việt).

## [v1.0.28]- 2026-04-26
### Fixed
- Tinh chỉnh SI dịch thông thường.
- Điều chỉnh Cài đặt phụ đề thao tác được ngay cả trong lúc dịch (hữu ích khi dịch phù đề dài/Có thể vừa xem vừa tùy chỉnh).
- Đổi tên dịch thông thường thành dịch đa chủ đề.

## [v1.0.27] - 2026-04-25
### Fixed
- Cập nhật cho SI dịch lyric.
- Thay đổi icon phù hợp hơn cho model Pro và chế độ dịch thông thường.
- Thêm icon cho nút Cài đặt.

## [v1.0.26] - 2026-04-25
### Fixed
- Xử lý được link video dạng short.
- Thiết lập giới hạn cho chế độ dịch thông thường là 5000 dòng, dịch âm nhạc là 500 dòng.

### Added
- Thêm tính năng dịch phụ đề âm nhạc.

## [v1.0.25] - 2026-04-25
### Fixed
- Thêm tính năng tùy chọn model để dịch tiết kiệm, nhanh hơn khi cần (mặc định vẫn dùng model có chất lượng cao nhất).
- Khóa cứng các tùy chỉnh khi bấm nút Dịch.

## [v1.0.24] - 2026-04-25
### Fixed
- SI phiên bản mới nhất (siết thêm bảo vệ index / đưa thêm chỉ số index vào JSON gửi đi và nhận về).
- Chỉnh chunking về 600, và ngữ cảnh cung cấp trước là 30 của chunk trước.

## [v1.0.23] - 2026-04-25
### Fixed
- SI phiên bản mới nhất (siết chặt bảo vệ timing/thứ tự index).
- Giảm ngưỡng chunking để tránh hiện tượng lạc trôi! 567 là con số được chọn (con số cũ là 900).

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
