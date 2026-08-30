# ⚡ AeroSpec Pro - Neural Hardware Architecture Studio & Upgrade Copilot

<div align="center">

![AeroSpec Pro Banner](https://img.shields.io/badge/AeroSpec%20Pro-v2.6-0284c7?style=for-the-badge&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri%20v2-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-3.7%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

**A modern, aesthetic, high-performance desktop hardware architecture analyzer, interactive PCB schematic visualizer, and AI upgrade consultant.**

[📦 Cài đặt Windows](#-cài-đặt-windows) • [✨ Key Features](#-key-features) • [🎨 Aesthetic Themes](#-5-aesthetic-studio-themes) • [🛠️ Tech Stack](#-technical-architecture) • [🚀 Development](#-development--build)

</div>

---

## 🌟 Overview

**AeroSpec Pro** là ứng dụng desktop giám sát và phân tích cấu hình phần cứng thế hệ mới được xây dựng bằng **Rust (Tauri v2)** và **React 19 + TypeScript**. Không chỉ hiển thị thông số khô khan như Task Manager hay CPU-Z, AeroSpec Pro trực quan hóa toàn bộ bo mạch chủ dưới dạng **sơ đồ mạch in (Interactive PCB Schematic)** với các luồng tín hiệu bus phát sáng, tích hợp **Trợ lý AI Gemini 3.7/3.5 Flash** tư vấn nâng cấp trực tiếp dựa trên dữ liệu phần cứng máy thật.

---

## ✨ Key Features (Tính Năng Thực Tế)

### 1. ⚡ Real Hardware Inventory & Telemetry (Windows + NVIDIA)
- **Windows inventory**: đọc CPU, bo mạch chủ/BIOS, từng DIMM, display adapter, ổ đĩa vật lý và trạng thái sức khỏe, card mạng vật lý đang hoạt động, màn hình, bàn phím, thiết bị trỏ và audio qua Windows PowerShell, CIM, Storage và PnP API.
- **Windows dynamic data**: đọc các chỉ số tải mà Windows cung cấp; mỗi nhóm dữ liệu có trạng thái nguồn riêng và dữ liệu không có sẽ được hiển thị là không khả dụng, không tự điền bằng dữ liệu giả.
- **NVIDIA telemetry**: khi driver NVIDIA có `nvidia-smi` hợp lệ, AeroSpec dùng nó cho VRAM, phiên bản driver, nhiệt độ GPU, mức tải, công suất, xung đồ họa và tốc độ quạt mà driver thực sự báo cáo.

#### Giới hạn dữ liệu
- **PSU không thể tự nhận diện đáng tin cậy** trên máy Windows phổ thông. Người dùng có thể nhập hồ sơ PSU cục bộ; mọi giá trị này được gắn nhãn `Manual` và AeroSpec không suy đoán model/công suất từ mức tiêu thụ hệ thống.
- **Nhiệt độ CPU/package/core, VCore, điện áp bo mạch và tốc độ quạt mainboard** không có nguồn Windows chuẩn, đáng tin cậy trên mọi máy nên hiện chưa được hỗ trợ. Trường không có dữ liệu vẫn để `Unavailable`.
- AeroSpec không cài sensor helper, service, scheduled task hay kernel driver, và không yêu cầu nâng quyền quản trị. Vì vậy một số dữ liệu phụ thuộc vào phiên bản Windows, quyền đọc và driver phần cứng đang cài.
- Máy không có NVIDIA hoặc driver không hỗ trợ trường nào đó vẫn dùng inventory Windows bình thường; phần NVIDIA tương ứng được đánh dấu không hỗ trợ/không khả dụng.

### 2. 🔬 Interactive PCB Schematic Canvas
- Trực quan hóa bo mạch chủ và các linh kiện (Socket CPU, Khe RAM DIMM, VRM Heatsink, Khe cắm M.2 / SATA, Bus PCIe x16) bằng canvas vector sắc nét.
- **Animated Signal Bus Lines**: Vệt sáng truyền tín hiệu nhấp nháy theo thời gian thực mô phỏng luồng dữ liệu giữa CPU, RAM và GPU.
- **Deep Inspector Drawer**: Nhấp vào bất kỳ linh kiện nào (CPU, VRM, RAM, M.2 SSD, PSU, GPU, Network) để mở ngăn kéo phân tích kiến trúc vi mạch chuyên sâu.

### 3. 🩺 AI Hardware Upgrade Advisor (Gemini 3.7 & 3.5 Flash)
- **Kết nối AI thật**: Tích hợp Google Gemini API với cơ chế ưu tiên cascade (`gemini-3.7-flash` $\rightarrow$ `gemini-3.5-flash` $\rightarrow$ `gemini-3.1-flash-lite`).
- **Nạp dữ liệu phần cứng làm context**: AI chỉ nhận các trường phần cứng không định danh được cho phép; PSU chỉ được đưa vào khi người dùng tự nhập. Khuyến nghị là thông tin tham khảo và cần được kiểm tra lại với tài liệu nhà sản xuất trước khi nâng cấp.
- **Rich Markdown Engine**: Hiển thị câu trả lời dạng bảng so sánh giá (VND/USD), khối mã, danh sách hành động và nhãn in đậm bắt mắt.

### 4. 📊 Dynamic Hardware Synergy & Bottleneck Scoring (0 - 100)
- Đánh giá năng lực phần cứng thực tế theo công thức trọng số chuẩn khoa học kết hợp với nhu cầu người dùng (**Persona**):
  - 💻 **Fullstack Dev + Docker**: Ưu tiên CPU đa nhân + RAM lớn + SSD tốc độ cao.
  - 🎬 **4K Video Creator + Blender**: Ưu tiên GPU rời mạnh + Dung lượng VRAM + Luồng CPU.
  - 🎮 **Esports 240Hz High FPS**: Ưu tiên GPU kéo FPS + Xung nhịp đơn nhân CPU.
  - 🧠 **Silent AI Lab (Local LLM)**: Ưu tiên VRAM GPU rời để nạp mô hình.
- Phạt điểm rõ ràng khi bị nghẽn vật lý (RAM Single-Channel, chạy iGPU không có card rời, ổ cứng SATA SSD đời cũ).

### 5. 🎨 5 Aesthetic Studio Themes (Dịu Mắt & Tinh Tế)
- Hệ thống **Theme Design Tokens** đồng bộ 100% màu sắc từ nền, viền card, huy hiệu, nút bấm đến đường bus vi mạch:
  1. ❄️ **Băng Tuyết (Arctic Cleanroom)** *(Mặc định)*: Trắng tuyết & Xanh Icy Blue mát lạnh.
  2. ☕ **Cà Phê Sữa (Warm Latte / Macintosh 1984)**: Be kem ấm áp, nâu Espresso & cam caramel thư giãn.
  3. 🍵 **Trà Xanh (Matcha Zen Garden)**: Xanh sương mai & ngọc lục bảo êm dịu mắt tối đa.
  4. 🌸 **Hoa Anh Đào (Sakura Blossom)**: Trắng phớt hồng đào pastel & tím phong lan trang nhã.
  5. 🌌 **Đêm Dịu Mắt (Slate Dark Studio)**: Xanh than chì trầm cho ban đêm.
- Tự động lưu thiết lập theme vào `localStorage`.

### 6. 🔊 Synthesized Sci-Fi Hardware Audio FX
- Bộ phát âm thanh vi mạch (Click, Switch, Chime) bằng **Web Audio Synthesizer** không cần load file âm thanh nặng, có nút bật/tắt âm trên Header.

### 7. 🎴 Holographic Flex Card Exporter
- Xuất thẻ tóm tắt cấu hình máy phong cách Holographic sắc nét định dạng PNG để chia sẻ mạng xã hội, kèm hiệu ứng pháo hoa Confetti.

### 8. 🖥️ 100vh Native Desktop Fixed Viewport
- Khóa toàn bộ Dashboard trong 1 màn hình duy nhất (Fixed Viewport) chuẩn ứng dụng Desktop (Raycast, Linear, CPU-Z), tối ưu hoàn hảo cho màn hình **1600x900**, **1080p**, **1440p**, **4K** và **Ultrawide**.

---

## 📦 Cài đặt Windows

AeroSpec được đóng gói dưới dạng **NSIS Setup cho người dùng hiện tại** (`currentUser`):

- Cài đặt và chạy app bằng tài khoản Windows thông thường, không yêu cầu quyền Administrator.
- Bộ cài không triển khai sidecar, .NET runtime, sensor helper, service, scheduled task hay kernel driver.
- Bản personal build hiện **chưa ký số**, nên Windows SmartScreen có thể hiện cảnh báo. Chỉ tiếp tục khi file đến từ nguồn bạn tin cậy và checksum khớp với bản phát hành.
- Gỡ cài đặt bằng **Settings → Apps → Installed apps** trong chính tài khoản đã cài.

Repo không cam kết có sẵn executable dựng trước. Sau khi chạy lệnh build bên dưới, NSIS Setup được tạo trong `src-tauri/target/release/bundle/nsis/`; hãy dùng đúng tên file mà Tauri xuất ra cho phiên bản `2.6.1`.

---

## 🛠️ Technical Architecture

```mermaid
graph TD
    subgraph Rust Native Backend [Tauri v2 Native Layer]
        A[Sysinfo & WMI Probe] -->|Invoke Command| B[get_live_hardware_telemetry]
        B -->|Hardware Struct| C[Tauri Core Bridge]
    end

    subgraph Frontend Studio [React 19 + TypeScript + Vite]
        C -->|State| D[HardwareTelemetryState]
        D --> E[SiliconMetrics - CPU & RAM Gauges]
        D --> F[MotherboardSchematic - Vector PCB Canvas]
        D --> G[PsuAndPeripherals - Power & Device Grid]
        D --> H[CopilotFooter - Hardware Synergy Engine]
        D --> I[AiAdvisorModal - Gemini API Cascade]
        D --> J[FlexCardModal - Canvas Exporter]
    end

    subgraph Design System [Tailwind CSS v4 + Design Tokens]
        K[Theme Engine: Arctic / Latte / Matcha / Sakura / Slate] --> Frontend Studio
        L[Web Audio Synthesizer] --> Frontend Studio
    end
```

---

## 🚀 Development & Build

### Yêu cầu môi trường
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (v1.75+)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Chạy môi trường Dev
```bash
# Cài đặt dependencies
npm install

# Khởi động giao diện web dev preview
npm run dev

# Khởi động app với native Tauri backend
npm run tauri dev
```

### Đóng gói NSIS Setup (.exe)
```bash
# Chỉ tạo NSIS Setup current-user theo src-tauri/tauri.conf.json
npx tauri build --bundles nsis
```

---

## 📄 License
Phát triển bởi **AeroSpec Studio Team** © 2026. Mã nguồn phát hành dưới giấy phép MIT License.
