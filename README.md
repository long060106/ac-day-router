# AC Day Router

Zone-batched dispatch for a one-owner AC/HVAC shop in South Florida
(Miami-Dade, Broward, south Palm Beach).

The owner takes the calls and sends 1–2 techs per job. He never scheduled, so he
crossed the same 50-mile corridor several times a day. This app batches a day's
work into one geographic zone, orders the stops so attic and roof work happens
before the heat, and gives him a page he can read out loud on the phone.

> **VI —** Ứng dụng điều phối theo vùng cho một tiệm sửa máy lạnh ở Nam Florida.
> Chủ tiệm tự nhận điện thoại và cử 1–2 thợ cho mỗi việc. Trước đây anh ta không
> hề lên lịch, nên một ngày phải chạy tới chạy lui cùng một hành lang dài 50 dặm
> nhiều lần. App này gom việc trong ngày về **một vùng địa lý duy nhất**, sắp thứ
> tự để việc trên gác mái và mái nhà làm trước khi trời nóng, và cho anh ta một
> trang có thể **đọc to qua điện thoại** cho thợ nghe.

## How it works

- **Zone days.** One corridor zone per weekday. Emergencies break the rule; nothing else does.
- **Hot places early.** The forecast high sets a cutoff time; attic and roof jobs are routed before it.
- **Honest time blocks.** Symptom sets the base minutes; access, tonnage and crew size stretch it.
- **Call sheet.** One stop at a time, in route order, in large type, phrased the way you'd say it
  out loud — `1477 NW 40th Ter` reads as "fourteen seventy-seven Northwest fortieth Terrace".

> **VI —** Bốn quy tắc:
> **(1) Mỗi ngày một vùng** — chỉ trường hợp khẩn cấp mới được phá luật này.
> **(2) Chỗ nóng làm sớm** — nhiệt độ cao nhất trong ngày quyết định giờ "cutoff";
> việc trên gác mái/mái nhà phải xếp trước giờ đó.
> **(3) Ước lượng thời gian thành thật** — triệu chứng quyết định số phút cơ bản,
> rồi nhân thêm theo vị trí máy, công suất và số thợ. Đặt lịch kiểu "việc nào cũng
> một tiếng" chính là lý do lịch vỡ trận lúc 2 giờ chiều.
> **(4) Call sheet** — mỗi lần hiện một điểm dừng, chữ to, viết theo đúng cách
> người ta *nói ra miệng* chứ không phải cách viết trên giấy.

## Deliberate non-features

No server, no accounts, no login, no sync, no encryption, no routing API, no push
notifications. One person uses this, on one iPhone. Everything lives in that
browser; GitHub Pages holds the code and never touches the data.

> **VI — Đây là phần quan trọng, đừng "sửa" nó sau này.** Cố tình **không** có:
> máy chủ, tài khoản, đăng nhập, đồng bộ, mã hoá, API tìm đường, thông báo đẩy.
> Chỉ **một người** dùng app này, trên **một chiếc iPhone**. Vì chỉ có một thiết bị
> và một người dùng nên **không có gì để đồng bộ và không có gì để xác thực** —
> thêm những thứ đó vào chỉ tạo rủi ro chứ không giải quyết vấn đề nào cả.
> Đây cũng là lý do Long **không thể** nhìn thấy dữ liệu khách hàng của bạn mình:
> không có máy chủ nào để dữ liệu đi qua. GitHub Pages chỉ chứa **mã nguồn**,
> không bao giờ chứa **dữ liệu**.

## Why the manifest matters

iOS Safari deletes script-writable storage (which is where the jobs live) after
7 days of not visiting the site in Safari — Apple's Intelligent Tracking
Prevention. A page added to the home screen as a standalone web app is exempt.
So the app **must** be installed via Share → Add to Home Screen, and opened from
that icon, or a quiet week will wipe the board.

<https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/>

> **VI — Phần quan trọng nhất của cả Stage 01.** Safari trên iOS sẽ **xoá sạch**
> mọi dữ liệu do JavaScript ghi trong trình duyệt (chính là nơi chứa danh sách
> công việc) sau **7 ngày** không mở trang đó trong Safari. Đây là chính sách
> *Intelligent Tracking Prevention* (ITP) của Apple, không phải lỗi.
>
> **Ngoại lệ duy nhất:** một trang đã được thêm vào **màn hình chính** dưới dạng
> *standalone web app* thì được miễn trừ khỏi việc xoá sau 7 ngày. Chính file
> `manifest.json` với `"display": "standalone"` là thứ bật được ngoại lệ đó.
>
> Cho nên **bắt buộc** phải cài bằng Share → Add to Home Screen và **luôn mở từ
> biểu tượng trên màn hình chính**. Nếu mở như một trang web bình thường, chỉ cần
> một tuần vắng khách là toàn bộ lịch làm việc biến mất. Đây cũng là lý do việc
> này phải làm **ngay bây giờ**, trước khi anh ta bắt đầu dùng app cho việc thật.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Markup only, plus the links to everything else |
| `style.css` | All styling |
| `app.js` | All logic — zones, durations, heat cutoffs, routing, call sheet |
| `manifest.json` | Makes it installable to the iPhone home screen |
| `icons/` | Home-screen icons (regenerate with `python make_icons.py`) |

> **VI —** So sánh với C cho dễ nhớ: `index.html` giống file header — nó chỉ khai
> báo cấu trúc và *liên kết* tới hai file kia. `style.css` và `app.js` là phần
> "implementation". Khác biệt là trình duyệt làm việc liên kết đó **lúc tải trang**,
> chứ không phải lúc biên dịch như `gcc`.

## Running it locally

```
python -m http.server 8127
```

Then open <http://localhost:8127>.

> **VI — Phải mở qua `http://`, đừng nhấp đúp vào file.** Nếu mở bằng `file://`
> thì `manifest.json` không được đọc và cơ chế lưu trữ của trình duyệt hoạt động
> khác hẳn — bạn sẽ tưởng app hỏng trong khi thật ra chỉ là mở sai cách.

## Build stages

- [x] **00** Validate — run real calls through the prototype for a week
- [x] **01** Own page + home-screen icon (file split, manifest, call sheet)
- [ ] **02** Works with no signal — `service-worker.js`, tested in airplane mode
- [ ] **03** Storage upgrade — IndexedDB or `sql.js`, plus `navigator.storage.persist()`
- [ ] **04** Backup — 7-day nag banner, `navigator.share()` to the iOS share sheet, restore via file picker

> **VI —** Stage 02 mới là bước làm app chạy được khi **không có sóng** (hiện tại
> vẫn cần mạng để mở lần đầu). Stage 03 chuyển khỏi `localStorage` sang IndexedDB
> và xin quyền lưu trữ vĩnh viễn. Stage 04 làm phần sao lưu — quan trọng, vì hiện
> giờ mất điện thoại là mất hết dữ liệu.
