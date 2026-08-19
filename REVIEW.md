# PROMPT: XÂY DỰNG CHROME EXTENSION NHẮC NHỞ KHI SỬ DỤNG CHROME

## 1. Vai trò

Bạn là Senior Chrome Extension Engineer và Product Engineer.

Nhiệm vụ của bạn là thiết kế và triển khai hoàn chỉnh một Chrome Extension có chức năng **nhắc nhở người dùng trong quá trình sử dụng Google Chrome**.

Extension phải hoạt động ổn định trong Chrome hiện đại, sử dụng **Manifest V3**, ưu tiên kiến trúc đơn giản, local-first, không cần backend ở phiên bản MVP.

Không được triển khai kiểu demo sơ sài. Hãy xây dựng cấu trúc có khả năng mở rộng thành sản phẩm thực tế.

---

# 2. Ý tưởng sản phẩm

Tên tạm thời:

**Focus Reminder**

Mục tiêu:

Cho phép người dùng tạo các lời nhắc cá nhân trong khi sử dụng Chrome.

Ví dụ:

* 08:00 — "Bắt đầu học"
* 10:00 — "Đứng dậy nghỉ 5 phút"
* 12:00 — "Ăn trưa"
* 14:00 — "Quay lại làm việc"
* 18:00 — "Kết thúc công việc"
* Mỗi 45 phút — "Bạn đã sử dụng Chrome khá lâu. Hãy nghỉ một chút."

Khi đến thời điểm nhắc:

1. Chrome hiển thị notification trên hệ điều hành.
2. Có thể phát âm thanh.
3. Notification hiển thị tiêu đề và nội dung.
4. Người dùng có thể tắt/bỏ qua reminder.
5. Reminder có thể lặp lại theo ngày hoặc theo khoảng thời gian.
6. Người dùng có thể bật/tắt từng reminder.

---

# 3. Mục tiêu MVP

MVP phải hỗ trợ đầy đủ các chức năng:

### Reminder

Người dùng có thể:

* Tạo reminder.
* Sửa reminder.
* Xóa reminder.
* Bật/tắt reminder.
* Đặt tiêu đề.
* Đặt nội dung.
* Chọn thời gian.
* Chọn ngày.
* Chọn kiểu lặp.
* Chọn âm thanh.
* Bật/tắt âm thanh.
* Xem danh sách reminder hiện tại.

### Notification

Khi reminder được kích hoạt:

* Hiển thị Chrome notification.
* Có icon extension.
* Có title.
* Có message.
* Có thể có button "Đã hiểu".
* Có thể có button "Bỏ qua".
* Notification phải hoạt động ngay cả khi popup extension đang đóng.

### Audio

Hỗ trợ:

* Không phát âm thanh.
* Âm thanh mặc định.
* Một số âm thanh tích hợp sẵn.
* Cho phép thay đổi âm thanh trong Settings.

Không sử dụng remote audio URL trong MVP.

Audio nên được lưu local trong extension.

### Scheduling

Hỗ trợ:

* Một lần.
* Hàng ngày.
* Các ngày cụ thể trong tuần.
* Khoảng thời gian định kỳ.

Ví dụ:

"Nhắc mỗi 60 phút".

Hoặc:

"Nhắc vào 08:00 từ thứ Hai đến thứ Sáu".

---

# 4. Công nghệ bắt buộc

Sử dụng:

* Chrome Extension Manifest V3
* JavaScript hoặc TypeScript
* HTML
* CSS
* Chrome Extension APIs

Các API chính:

* `chrome.alarms`
* `chrome.notifications`
* `chrome.storage`
* `chrome.runtime`
* `chrome.action`
* `chrome.offscreen` nếu cần cho audio

Không sử dụng Manifest V2.

Manifest V3 là kiến trúc bắt buộc. Chrome hiện yêu cầu Manifest V3 cho extension mới.

---

# 5. Kiến trúc hệ thống

Thiết kế architecture theo mô hình:

```text
Chrome Extension
│
├── Popup UI
│   ├── Dashboard
│   ├── Reminder List
│   └── Quick Add
│
├── Options / Settings
│   ├── General Settings
│   ├── Notification Settings
│   └── Audio Settings
│
├── Background Service Worker
│   ├── Alarm Manager
│   ├── Reminder Scheduler
│   ├── Notification Manager
│   └── Audio Trigger
│
├── Offscreen Document
│   └── Audio Playback
│
├── Storage Layer
│   └── chrome.storage.local
│
└── Assets
    ├── icons
    └── sounds
```

---

# 6. Cấu trúc project đề xuất

Tạo project theo cấu trúc:

```text
focus-reminder/
│
├── manifest.json
├── README.md
│
├── src/
│   │
│   ├── background/
│   │   ├── service-worker.js
│   │   ├── alarm-manager.js
│   │   ├── reminder-manager.js
│   │   ├── notification-manager.js
│   │   └── audio-manager.js
│   │
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   │
│   ├── options/
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   │
│   ├── offscreen/
│   │   ├── offscreen.html
│   │   └── offscreen.js
│   │
│   ├── storage/
│   │   └── storage-manager.js
│   │
│   └── utils/
│       ├── date-utils.js
│       ├── validation.js
│       └── constants.js
│
├── assets/
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   │
│   └── sounds/
│       ├── default.mp3
│       ├── soft.mp3
│       └── bell.mp3
│
└── tests/
    ├── reminder-manager.test.js
    ├── alarm-manager.test.js
    └── date-utils.test.js
```

Nếu sử dụng TypeScript hoặc framework frontend thì có thể điều chỉnh cấu trúc, nhưng phải giữ nguyên separation of concerns.

---

# 7. Manifest

Tạo `manifest.json` theo Manifest V3.

Các permission cần thiết ở MVP:

```text
storage
alarms
notifications
offscreen
```

Không yêu cầu:

```text
tabs
history
cookies
webRequest
scripting
host_permissions
```

trừ khi một feature thực sự cần chúng.

Nguyên tắc:

**Request minimum permissions.**

Extension này không cần đọc nội dung website hoặc lịch sử duyệt web.

---

# 8. Reminder Data Model

Thiết kế reminder object:

```javascript
{
    id: "uuid",

    title: "Bắt đầu học",

    message: "Hãy tập trung học trong 45 phút.",

    enabled: true,

    schedule: {
        type: "daily",
        time: "08:00",
        days: [1, 2, 3, 4, 5]
    },

    notification: {
        enabled: true,
        priority: "normal"
    },

    sound: {
        enabled: true,
        soundId: "default"
    },

    createdAt: 0,

    updatedAt: 0,

    nextTriggerAt: 0
}
```

Không hard-code logic reminder vào UI.

Reminder phải được quản lý thông qua một service riêng.

---

# 9. Các loại schedule

Thiết kế scheduler có thể mở rộng.

## One-time

Ví dụ:

```text
19/08/2026 20:00
```

Chỉ chạy một lần.

Sau khi trigger:

```text
enabled = false
```

---

## Daily

Ví dụ:

```text
08:00 mỗi ngày
```

---

## Weekly

Ví dụ:

```text
08:00
Monday
Wednesday
Friday
```

---

## Interval

Ví dụ:

```text
Every 30 minutes
Every 60 minutes
Every 120 minutes
```

---

# 10. Alarm architecture

Không sử dụng `setInterval()` hoặc `setTimeout()` làm scheduler chính.

Sử dụng:

```javascript
chrome.alarms
```

Chrome cung cấp `chrome.alarms` để lập lịch code chạy tại một thời điểm hoặc định kỳ. Alarm có thể bị trì hoãn và không nên được coi là đồng hồ realtime tuyệt đối.

Service worker phải:

1. Load reminder configuration.
2. Kiểm tra alarms.
3. Recreate missing alarms nếu cần.
4. Xử lý `chrome.alarms.onAlarm`.
5. Trigger notification.
6. Trigger audio.
7. Tính toán lần trigger tiếp theo.

Không phụ thuộc vào service worker luôn chạy.

---

# 11. Notification

Khi alarm trigger:

```text
Alarm
 ↓
Reminder Manager
 ↓
Notification Manager
 ↓
chrome.notifications.create()
```

Notification phải có:

```text
Icon
Title
Message
Priority
Buttons
```

Ví dụ:

```text
┌──────────────────────────────┐
│ Focus Reminder               │
│                              │
│ Đã đến giờ học               │
│ Hãy tập trung trong 45 phút. │
│                              │
│ [Đã hiểu] [Bỏ qua]           │
└──────────────────────────────┘
```

Chrome Notifications API hỗ trợ hiển thị notification từ extension và cần permission `notifications`.

---

# 12. Audio architecture

Đây là phần cần xử lý cẩn thận.

Manifest V3 sử dụng service worker và service worker không có DOM/window như trang web thông thường.

Không thiết kế hệ thống audio phụ thuộc trực tiếp vào DOM của popup.

Nếu cần phát audio từ background:

```text
Service Worker
      │
      ▼
Offscreen Document
      │
      ▼
HTMLAudioElement
      │
      ▼
Local audio file
```

Sử dụng `chrome.offscreen` khi cần tạo một offscreen document để xử lý audio.

Không mở tab mới chỉ để phát âm thanh.

Không sử dụng website bên ngoài để phát audio.

---

# 13. Popup UI

Popup phải đơn giản và nhanh.

Thiết kế:

```text
┌─────────────────────────────┐
│ Focus Reminder              │
│                             │
│ Next reminder               │
│ 08:00                       │
│ Bắt đầu học                 │
│                             │
│ ─────────────────────────── │
│                             │
│ Today's reminders            │
│                             │
│ ● 08:00  Bắt đầu học        │
│ ● 12:00  Ăn trưa            │
│ ○ 18:00  Kết thúc làm việc  │
│                             │
│ [+ Thêm reminder]            │
│                             │
│ Settings                    │
└─────────────────────────────┘
```

---

# 14. Reminder Form

Form tạo reminder:

```text
Tên reminder
[________________________]

Nội dung
[________________________]

Thời gian
[08:00]

Lặp lại
[ Hàng ngày ▼ ]

Ngày trong tuần
[ T2 ][ T3 ][ T4 ][ T5 ][ T6 ][ T7 ][ CN ]

Âm thanh
[ Bật ]

Âm thanh
[ Default ▼ ]

[ Hủy ] [ Lưu ]
```

Validation:

* Title không được rỗng.
* Time phải hợp lệ.
* Schedule phải hợp lệ.
* Weekly phải có ít nhất một ngày.
* Interval phải lớn hơn 0.
* Không cho phép reminder có cấu hình mâu thuẫn.

---

# 15. Dashboard

Popup phải hiển thị:

### Next Reminder

```text
08:00
Bắt đầu học
```

### Today's Reminders

Hiển thị:

* Time.
* Title.
* Status.
* Sound.
* Schedule.

Có toggle:

```text
ON / OFF
```

Không cần mở Options page cho thao tác cơ bản.

---

# 16. Options / Settings

Trang Settings phải có:

## General

```text
[ ] Enable reminders
```

## Notification

```text
[✓] Show desktop notifications

Notification priority:
[ Normal ▼ ]
```

## Audio

```text
[✓] Enable sounds

Default sound:
[ Default ▼ ]

Volume:
[──────●────]
```

## Advanced

```text
Reset all reminders
Clear all data
Export settings
Import settings
```

---

# 17. Storage

Sử dụng:

```javascript
chrome.storage.local
```

Không sử dụng:

```javascript
localStorage
```

cho dữ liệu chính của extension.

Chrome khuyến nghị sử dụng `chrome.storage` trong Manifest V3 thay cho localStorage trong background/service worker.

Storage schema:

```javascript
{
    settings: {
        enabled: true,

        notifications: {
            enabled: true,
            priority: "normal"
        },

        audio: {
            enabled: true,
            volume: 0.7,
            defaultSound: "default"
        }
    },

    reminders: []
}
```

---

# 18. Timezone

Không hard-code timezone.

Sử dụng timezone của hệ điều hành/browser.

Tất cả reminder phải được tính dựa trên local time.

Ví dụ:

```text
08:00
```

nghĩa là 08:00 theo local timezone của người dùng.

Phải xử lý:

* đổi timezone;
* daylight saving time ở các timezone có DST;
* ngày chuyển tiếp;
* reminder qua ngày mới.

---

# 19. Đồng bộ trạng thái

Khi user:

```text
Create reminder
```

thì phải:

```text
Save reminder
      ↓
Calculate next trigger
      ↓
Create/update chrome.alarm
```

Khi user:

```text
Edit reminder
```

thì phải:

```text
Update storage
      ↓
Clear old alarm
      ↓
Create new alarm
```

Khi user:

```text
Disable reminder
```

thì:

```text
Update storage
      ↓
Clear alarm
```

Khi enable:

```text
Update storage
      ↓
Calculate next trigger
      ↓
Create alarm
```

---

# 20. Service Worker lifecycle

Không giả định service worker luôn hoạt động.

Khi service worker khởi động:

```text
service-worker.js
      ↓
load settings
      ↓
load reminders
      ↓
validate reminders
      ↓
sync alarms
```

Tạo function:

```javascript
initializeScheduler()
```

và:

```javascript
syncAllAlarms()
```

Mục tiêu là nếu alarm bị mất thì extension có thể tự khôi phục.

---

# 21. Alarm naming convention

Mỗi reminder phải có alarm riêng:

```text
reminder_<reminderId>
```

Ví dụ:

```text
reminder_8f72a1
```

Không sử dụng một alarm duy nhất cho toàn bộ reminder nếu điều đó làm logic khó quản lý.

---

# 22. Error handling

Phải xử lý:

* Alarm không tồn tại.
* Reminder đã bị xóa nhưng alarm vẫn còn.
* Storage bị thiếu dữ liệu.
* Sound file không tồn tại.
* Notification bị lỗi.
* Offscreen document chưa tồn tại.
* Người dùng tắt notification permission của Chrome.
* Extension được reload.
* Browser restart.
* Reminder có schedule không hợp lệ.

Không để exception làm chết toàn bộ scheduler.

---

# 23. Chrome restart

Sau khi Chrome khởi động lại:

```text
Extension Service Worker
        ↓
Load reminders
        ↓
Check alarms
        ↓
Recreate missing alarms
```

Không được yêu cầu người dùng tạo lại reminder.

API `chrome.alarms` có cơ chế persistence, nhưng implementation vẫn phải có bước đồng bộ lại alarms khi service worker khởi động để đảm bảo tính tin cậy.

---

# 24. UX

Thiết kế UI:

* Minimal.
* Clean.
* Không quá nhiều màu.
* Typography rõ ràng.
* Responsive trong popup.
* Không sử dụng animation nặng.
* Không sử dụng external CDN nếu không cần.

Màu sắc đề xuất:

```text
Background: #FFFFFF
Primary: #2563EB
Text: #111827
Secondary text: #6B7280
Border: #E5E7EB
Danger: #DC2626
Success: #16A34A
```

Có thể sử dụng CSS thuần.

Không cần framework frontend ở MVP.

---

# 25. Accessibility

Phải hỗ trợ:

* Keyboard navigation.
* Focus state.
* Label cho input.
* Semantic HTML.
* ARIA khi cần.
* Contrast đủ tốt.

Không thiết kế UI chỉ dựa vào màu sắc để biểu thị trạng thái.

---

# 26. Data privacy

Extension không được:

* Thu thập browsing history.
* Đọc nội dung website.
* Theo dõi URL người dùng.
* Gửi dữ liệu reminder lên server.
* Gửi telemetry mặc định.
* Gửi dữ liệu cá nhân ra ngoài.

Mọi reminder và settings phải được lưu local.

Mục tiêu privacy:

```text
No backend
No account
No tracking
No analytics
No external API
```

---

# 27. Không làm trong MVP

Không triển khai ngay:

* Login.
* Cloud synchronization.
* Database server.
* AI.
* User account.
* Social features.
* Team reminder.
* Mobile application.
* Payment.
* Subscription.
* Website tracking.
* Productivity analytics phức tạp.

Các tính năng này chỉ được thiết kế sao cho kiến trúc có thể mở rộng sau này.

---

# 28. Các tính năng có thể mở rộng sau MVP

Kiến trúc phải cho phép bổ sung:

### Smart Reminder

Ví dụ:

```text
Nhắc tôi nghỉ sau mỗi 45 phút sử dụng Chrome.
```

### Website-based Reminder

Ví dụ:

```text
Khi tôi mở YouTube quá 30 phút:
"Bạn đang xem hơi lâu."
```

### Focus Mode

Ví dụ:

```text
09:00 - 11:00
Focus Mode
```

### Productivity Statistics

```text
Reminders triggered today: 7

Completed: 5

Skipped: 2
```

### Sync

Có thể bổ sung:

```text
Google Account
Cloud Sync
```

nhưng không triển khai trong MVP.

---

# 29. Testing

Phải test ít nhất các trường hợp:

### Reminder

* Create.
* Edit.
* Delete.
* Enable.
* Disable.

### Schedule

* One-time.
* Daily.
* Weekly.
* Interval.
* Multiple reminders cùng thời điểm.

### Browser lifecycle

* Reload extension.
* Restart Chrome.
* Close popup.
* Service worker restart.

### Notification

* Notification xuất hiện.
* Click notification.
* Click button.
* Notification disabled.

### Audio

* Audio enabled.
* Audio disabled.
* Audio file tồn tại.
* Audio file không tồn tại.

### Date

* Cuối ngày.
* Qua ngày mới.
* Cuối tuần.
* Tháng mới.
* Năm mới.

---

# 30. Test scenario quan trọng nhất

Tạo reminder:

```text
Title:
Test Reminder

Message:
This is a test.

Time:
1 minute from now

Repeat:
One time

Sound:
Enabled
```

Sau khi lưu:

```text
Popup đóng
        ↓
Chrome vẫn hoạt động
        ↓
Alarm trigger
        ↓
Notification xuất hiện
        ↓
Audio phát
```

Đây là acceptance test quan trọng của MVP.

---

# 31. Performance

Extension phải:

* Không chạy vòng lặp liên tục.
* Không sử dụng polling để kiểm tra thời gian.
* Không duy trì background page liên tục.
* Sử dụng `chrome.alarms`.
* Chỉ xử lý khi có event.
* Storage operations phải bất đồng bộ.
* Không inject content script vào tất cả website nếu không cần.

Manifest V3 service worker được thiết kế để background code chỉ hoạt động khi cần, do đó architecture phải event-driven.

---

# 32. Security

Không sử dụng:

```javascript
eval()
```

Không sử dụng inline JavaScript.

Không tải script từ CDN.

Không sử dụng remote code.

Không cấp quyền:

```text
tabs
history
cookies
webRequest
host_permissions
```

nếu MVP không cần.

Validate toàn bộ dữ liệu từ UI trước khi lưu.

---

# 33. Development phases

Triển khai theo các phase sau.

## Phase 1 — Project Foundation

Tạo:

* manifest.json
* project structure
* service worker
* popup
* storage layer
* basic icons

Acceptance:

```text
Extension load được bằng chrome://extensions
```

---

## Phase 2 — Reminder CRUD

Implement:

* Create.
* Read.
* Update.
* Delete.
* Enable/disable.

Acceptance:

```text
User có thể quản lý reminder hoàn chỉnh.
```

---

## Phase 3 — Scheduler

Implement:

* chrome.alarms.
* One-time.
* Daily.
* Weekly.
* Interval.
* Alarm synchronization.

Acceptance:

```text
Reminder trigger đúng theo schedule.
```

---

## Phase 4 — Notification

Implement:

* chrome.notifications.
* Notification buttons.
* Click handling.
* Notification settings.

Acceptance:

```text
Alarm → Notification.
```

---

## Phase 5 — Audio

Implement:

* Offscreen document.
* Audio manager.
* Multiple sounds.
* Volume.
* Enable/disable.

Acceptance:

```text
Alarm → Notification + Audio.
```

---

## Phase 6 — Settings

Implement:

* General settings.
* Notification settings.
* Audio settings.
* Reset.
* Import/export.

---

## Phase 7 — UX Polish

Hoàn thiện:

* UI.
* Empty states.
* Validation.
* Error states.
* Accessibility.
* Responsive popup.

---

## Phase 8 — Testing

Viết automated tests cho:

```text
Date calculation
Reminder manager
Alarm manager
Storage manager
```

Sau đó thực hiện manual testing trên Chrome.

---

# 34. Definition of Done

Project chỉ được coi là hoàn thành khi:

* [ ] Extension chạy trên Chrome.
* [ ] Manifest V3.
* [ ] Popup hoạt động.
* [ ] Có thể tạo reminder.
* [ ] Có thể sửa reminder.
* [ ] Có thể xóa reminder.
* [ ] Có thể bật/tắt reminder.
* [ ] Có thể đặt thời gian.
* [ ] Có thể đặt ngày.
* [ ] Có daily schedule.
* [ ] Có weekly schedule.
* [ ] Có interval schedule.
* [ ] Có one-time schedule.
* [ ] Notification xuất hiện đúng thời gian.
* [ ] Notification có title/message.
* [ ] Có audio.
* [ ] Có thể tắt audio.
* [ ] Có thể chọn sound.
* [ ] Settings hoạt động.
* [ ] Dữ liệu được lưu local.
* [ ] Chrome restart không làm mất reminder.
* [ ] Extension reload không làm mất reminder.
* [ ] Alarm được tự động đồng bộ.
* [ ] Không có permission thừa.
* [ ] Không có backend.
* [ ] Không tracking.
* [ ] Không đọc browsing history.
* [ ] Không inject code vào website nếu không cần.
* [ ] Có README.
* [ ] Có hướng dẫn cài đặt development.
* [ ] Có hướng dẫn build.
* [ ] Có hướng dẫn load unpacked.
* [ ] Có test cases.

---

# 35. README bắt buộc

README.md phải giải thích:

```text
1. Project overview
2. Features
3. Architecture
4. Tech stack
5. Project structure
6. Installation
7. Development
8. Build
9. Testing
10. Permissions
11. Privacy
12. Known limitations
13. Future roadmap
```

Đặc biệt phải giải thích tại sao project sử dụng:

```text
chrome.alarms
chrome.notifications
chrome.storage
chrome.offscreen
```

---

# 36. Nguyên tắc triển khai

Không viết toàn bộ project thành một file JavaScript duy nhất.

Không đặt business logic trực tiếp trong popup.

Popup chỉ chịu trách nhiệm UI.

Scheduler chịu trách nhiệm scheduling.

Storage Manager chịu trách nhiệm persistence.

Notification Manager chịu trách nhiệm notification.

Audio Manager chịu trách nhiệm audio.

Reminder Manager chịu trách nhiệm business logic.

Service Worker chịu trách nhiệm orchestration/event handling.

Thiết kế theo nguyên tắc:

```text
UI
 ↓
Manager
 ↓
Storage / Chrome API
```

Không:

```text
UI
 ↓
random Chrome API calls
 ↓
business logic
 ↓
storage
```

---

# 37. Yêu cầu đối với Coding Agent

Trước khi code:

1. Phân tích requirement.
2. Xác định architecture.
3. Tạo project structure.
4. Xác định data model.
5. Xác định scheduling strategy.
6. Xác định Chrome permissions.
7. Xác định lifecycle của service worker.
8. Xác định cách phát audio trong MV3.

Sau đó triển khai từng phase.

Không bỏ qua các phase.

Sau mỗi phase:

```text
- Implement
- Test
- Fix errors
- Verify acceptance criteria
- Report completed items
```

Không tự ý thêm backend hoặc dependency không cần thiết.

Nếu gặp giới hạn của Chrome API, phải ưu tiên giải pháp tương thích với Manifest V3 thay vì workaround không ổn định.

---

# 38. Kết quả cuối cùng

Sản phẩm cuối cùng phải là một Chrome Extension local-first có trải nghiệm:

```text
User tạo reminder
        ↓
Reminder được lưu
        ↓
Scheduler tạo chrome.alarm
        ↓
Đến thời gian
        ↓
Service Worker nhận onAlarm
        ↓
Notification Manager
        ↓
Desktop Notification
        +
Audio Manager
        ↓
Phát âm thanh
        ↓
Reminder được reschedule nếu là recurring
```

Mục tiêu của MVP là tạo ra một **reminder application thực sự hoạt động trong Chrome**, không phải một UI prototype.

Ưu tiên:

```text
Reliability
> Simplicity
> Privacy
> Maintainability
> UI polish
> Extra features
```

Không triển khai tính năng ngoài scope nếu chưa hoàn thành toàn bộ MVP.
