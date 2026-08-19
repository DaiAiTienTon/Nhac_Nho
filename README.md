# Event Reminder — Chrome Extension Nhắc Nhở Sự Kiện & Lịch Trình (Manifest V3)

> Chrome Extension local-first, bảo mật và chuẩn Manifest V3 giúp người dùng tạo lời nhắc sự kiện, lịch trình và công việc cá nhân trong quá trình sử dụng trình duyệt Google Chrome.

---

## 1. Tổng Quan (Project Overview)

**Event Reminder** được thiết kế để nhắc nhở người dùng khi đến thời điểm diễn ra các sự kiện trong ngày (ví dụ: giờ học, ăn trưa, giờ họp, nghỉ ngơi, uống nước, kết thúc công việc,...). 

Extension hoạt động theo cơ chế **Local-First**, không cần máy chủ backend, không yêu cầu đăng nhập, đảm bảo quyền riêng tư tuyệt đối và vận hành ổn định ngay cả khi popup đang đóng hoặc sau khi khởi động lại Chrome.

---

## 2. Tính Năng Nổi Bật (Features)

- **Quản lý lời nhắc sự kiện (CRUD)**:
  - Tạo, chỉnh sửa, xóa và bật/tắt từng lời nhắc một cách nhanh chóng.
  - Đặt tiêu đề, ghi chú chi tiết, thời gian và tùy chọn âm thanh.
- **Hỗ trợ đa dạng kiểu lịch trình (Flexible Scheduling)**:
  - **Một lần (One-time)**: Nhắc đúng ngày và giờ cụ thể (tự động tắt sau khi hoàn thành).
  - **Hàng ngày (Daily)**: Nhắc vào giờ cố định mỗi ngày.
  - **Theo thứ trong tuần (Weekly)**: Nhắc vào các ngày được chọn (T2, T3, T4, T5, T6, T7, CN).
  - **Định kỳ (Interval)**: Nhắc lặp lại sau mỗi $X$ phút (ví dụ: mỗi 45 phút uống nước).
- **Thông báo Desktop chuẩn hệ điều hành (Desktop Notifications)**:
  - Hiển thị banner thông báo kèm icon, tiêu đề và nội dung dặn dò.
  - Tích hợp 2 nút hành động nhanh: **"✓ Đã hiểu"** và **"⏰ Nhắc lại sau 5 phút" (Snooze)**.
  - Hoạt động ổn định ở chế độ chạy nền kể cả khi popup đang đóng.
- **Hệ thống âm thanh đa âm sắc (Offscreen Audio Engine)**:
  - Sử dụng Chrome Offscreen API để phát âm thanh chuông báo trong Manifest V3.
  - Tích hợp sẵn 3 kiểu chuông: *Chuông tiêu chuẩn (Ấm áp)*, *Chuông nhẹ nhàng (Thư thái)*, *Chuông ngân vang (Rõ ràng)*.
  - Cho phép tùy chỉnh âm lượng hoặc tắt chuông theo ý muốn.
- **Bảng điều khiển Popup hiện đại & Tinh tế**:
  - Giao diện Dark theme cao cấp, chuẩn thiết kế Double-Bezel.
  - Banner đếm ngược thời gian trực tiếp đến sự kiện gần nhất (**Next Event Countdown**).
  - Bộ lọc theo tab: *Tất cả*, *Hôm nay*, *Đang bật*.
  - Các mẫu sự kiện gợi ý nhanh (Quick Presets) giúp tạo chỉ với 1 click.
- **Trang Cài đặt Nâng cao (Options UI)**:
  - Bật/tắt tổng thể hệ thống lời nhắc.
  - Chọn mức độ ưu tiên thông báo (Low / Normal / High).
  - Xuất dữ liệu sao lưu (Export JSON) và Khôi phục dữ liệu (Import JSON) an toàn.
  - Nút đồng bộ Alarms và đặt lại hệ thống.

---

## 3. Kiến Trúc Hệ Thống (Architecture)

Extension tuân thủ nguyên tắc **Separation of Concerns (SoC)** và thiết kế hướng sự kiện (Event-Driven Architecture):

```text
Chrome Extension
│
├── Popup UI (src/popup/)
│   ├── Dashboard & Countdown Ticker
│   ├── Quick Add / Preset Chips
│   └── Event List & Management Modal
│
├── Options / Settings UI (src/options/)
│   ├── General, Notification & Audio Controls
│   ├── Audio Preview & Volume Tester
│   └── Backup / Restore (JSON) & Alarm Sync
│
├── Background Service Worker (src/background/service-worker.js)
│   ├── Alarm Manager (src/background/alarm-manager.js)
│   ├── Reminder Manager (src/background/reminder-manager.js)
│   ├── Notification Manager (src/background/notification-manager.js)
│   └── Audio Manager (src/background/audio-manager.js)
│
├── Offscreen Document (src/offscreen/)
│   └── Audio Playback (<audio> element trong Manifest V3)
│
└── Storage Layer (src/storage/storage-manager.js)
    └── chrome.storage.local
```

### Luồng Hoạt Động (Event Flow):
```text
User tạo reminder trên Popup
       ↓
StorageManager lưu vào chrome.storage.local
       ↓
ReminderManager tính toán nextTriggerAt
       ↓
AlarmManager lập lịch với chrome.alarms (tên: reminder_<id>)
       ↓
Khi đến giờ hẹn
       ↓
Service Worker nhận sự kiện chrome.alarms.onAlarm
       ↓
NotificationManager hiển thị Desktop Notification
       +
AudioManager kích hoạt Offscreen Document phát âm thanh chuông
       ↓
Nếu là sự kiện lặp lại: Tự động tính nextTriggerAt và đặt alarm mới
Nếu là sự kiện một lần: Chuyển trạng thái enabled = false
```

---

## 4. Công Nghệ & API Sử Dụng (Tech Stack)

- **Nền tảng**: Chrome Extension Manifest V3.
- **Ngôn ngữ**: Vanilla JavaScript (ES Modules), HTML5 Semantic, Modern Vanilla CSS.
- **Chrome Extension APIs**:
  - `chrome.alarms`: Quản lý lập lịch các mốc thời gian sự kiện mà không cần chạy nền liên tục.
  - `chrome.notifications`: Hiển thị thông báo màn hình hệ điều hành kèm nút bấm tương tác.
  - `chrome.storage`: Lưu trữ dữ liệu cấu hình và danh sách sự kiện bền vững (`chrome.storage.local`).
  - `chrome.offscreen`: Tạo ngữ cảnh phát âm thanh chuông chuẩn Manifest V3 (do Service Worker không có DOM).
  - `chrome.runtime` & `chrome.action`: Điều phối thông điệp (messaging) và điều khiển popup.

---

## 5. Cấu Trúc Thư Mục (Project Structure)

```text
d:\Nhac_Nho/
├── manifest.json                  # Khai báo cấu hình Manifest V3
├── package.json                   # Cấu hình dự án & scripts test
├── README.md                      # Tài liệu hướng dẫn toàn diện
├── REVIEW.md                      # Đặc tả yêu cầu kỹ thuật
├── assets/
│   ├── icons/                     # Icons kích thước 16x16, 48x48, 128x128
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── sounds/                    # Các file âm thanh chuông báo chuẩn PCM WAV
│       ├── default.wav
│       ├── soft.wav
│       └── bell.wav
├── scripts/
│   └── generate-assets.js         # Script tạo tự động icons & âm thanh
├── src/
│   ├── background/
│   │   ├── service-worker.js      # Service worker chính điều phối sự kiện
│   │   ├── alarm-manager.js       # Quản lý chrome.alarms & đồng bộ
│   │   ├── reminder-manager.js    # Nghiệp vụ tạo/sửa/xóa & kích hoạt reminder
│   │   ├── notification-manager.js# Quản lý thông báo desktop
│   │   └── audio-manager.js       # Quản lý giao tiếp phát audio
│   ├── popup/
│   │   ├── popup.html             # Giao diện popup
│   │   ├── popup.css              # Style cao cấp cho popup
│   │   └── popup.js               # Logic điều khiển popup
│   ├── options/
│   │   ├── options.html           # Giao diện trang cài đặt
│   │   ├── options.css            # Style trang cài đặt
│   │   └── options.js             # Logic lưu cài đặt, sao lưu/khôi phục
│   ├── offscreen/
│   │   ├── offscreen.html         # Tài liệu offscreen chạy ngầm
│   │   └── offscreen.js           # Bộ phát âm thanh HTMLAudioElement
│   ├── storage/
│   │   └── storage-manager.js     # Tầng truy xuất dữ liệu chrome.storage.local
│   └── utils/
│       ├── constants.js           # Hằng số, kiểu lịch trình, âm thanh, messages
│       ├── date-utils.js          # Tính toán ngày giờ múi giờ local
│       └── validation.js          # Kiểm tra tính hợp lệ dữ liệu
└── tests/
    ├── date-utils.test.js         # Unit tests cho tính toán thời gian
    ├── validation.test.js         # Unit tests cho validation
    ├── storage-manager.test.js    # Unit tests cho lưu trữ
    ├── reminder-manager.test.js   # Unit tests cho vòng đời reminder
    └── run-tests.js               # Test runner
```

---

## 6. Hướng Dẫn Cài Đặt Vào Chrome (Installation / Load Unpacked)

Để cài đặt và sử dụng extension trực tiếp trên trình duyệt Google Chrome:

1. Mở trình duyệt **Google Chrome**.
2. Truy cập vào đường dẫn: `chrome://extensions/`
3. Ở góc trên bên phải màn hình, bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)**.
4. Nhấn vào nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục dự án: `d:\Nhac_Nho`.
6. Extension **Event Reminder - Nhắc Nhở Sự Kiện** sẽ xuất hiện trên thanh tiện ích của Chrome. Nhấn vào biểu tượng ghim (Pin) để tiện sử dụng.

---

## 7. Phát Triển & Kiểm Thử (Development & Testing)

### Chạy Automated Tests:
Dự án có bộ kiểm thử tự động toàn diện kiểm tra các logic tính toán múi giờ, lịch lặp, xác thực dữ liệu và vòng đời sự kiện:

```bash
npm test
```

### Tạo lại Tài Nguyên Icons & Sounds:
Nếu muốn tạo lại bộ icon hoặc âm thanh chuông:

```bash
npm run generate-assets
```

---

## 8. Quyền Hạn Sử Dụng (Permissions)

Extension tuân thủ nghiêm ngặt nguyên tắc **Tối thiểu quyền hạn (Least Privilege)**:

- `storage`: Lưu trữ cục bộ danh sách sự kiện và cài đặt người dùng.
- `alarms`: Đặt lịch đánh thức Service Worker đúng giờ sự kiện.
- `notifications`: Hiển thị thông báo màn hình khi đến thời gian nhắc.
- `offscreen`: Phát âm thanh chuông báo qua ngữ cảnh DOM offscreen mà không cần mở tab mới.

> **Tuyệt đối không yêu cầu các quyền nhạy cảm**: Không dùng `tabs`, không đọc lịch sử duyệt web (`history`), không đọc cookies, không inject script vào trang web (`scripting`, `<all_urls>`).

---

## 9. Quyền Riêng Tư (Privacy)

- **100% Local-First**: Mọi dữ liệu sự kiện được lưu hoàn toàn trên máy tính của bạn thông qua `chrome.storage.local`.
- Không có máy chủ backend, không theo dõi hành vi người dùng, không gắn mã phân tích / telemetry.
- Dữ liệu của bạn không bao giờ rời khỏi thiết bị.

---

## 10. Giới Hạn Đã Biết & Kế Hoạch Tương Lai (Roadmap)

### Giới hạn hiện tại:
- Do cơ chế tiết kiệm pin của hệ điều hành và `chrome.alarms`, độ trễ của thông báo có thể dao động trong khoảng một vài giây.
- Chưa hỗ trợ đồng bộ đám mây qua tài khoản Google.

### Kế hoạch phát triển:
- [ ] Đồng bộ hóa tùy chọn qua Google Drive / Google Calendar.
- [ ] Tính năng nhắc nhở thông minh theo thời gian sử dụng trình duyệt liên tục.
- [ ] Thống kê số lượng sự kiện đã hoàn thành trong tuần.