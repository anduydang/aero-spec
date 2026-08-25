import type { LanguageType, PersonaType, RigProfileType, PersonaInsight } from '../types/hardware';

export interface DictContent {
  headerHint: string;
  uptime: string;
  busStatus: string;
  targetPersona: string;
  rigMode: string;
  exportBtn: string;
  perCore: string;
  peripheralsTitle: string;
  copilotTitle: string;
  copilotDesc: string;
  synergyLabel: string;
  diagnosisBtn: string;
  pillar1: string;
  pillar2: string;
  pillar3: string;
  lowLevelTitle: string;
  archTitle: string;
  personas: Record<RigProfileType, Record<PersonaType, PersonaInsight>>;
}

export const i18nData: Record<LanguageType, DictContent> = {
  EN: {
    headerHint: "Click component for Deep Inspection",
    uptime: "Uptime:",
    busStatus: "Hardware Bus Active",
    targetPersona: "Target Persona:",
    rigMode: "Hardware Mode:",
    exportBtn: "Export Card",
    perCore: "Per-Core Active Loads",
    peripheralsTitle: "Connected Peripherals",
    copilotTitle: "Neural Hardware Copilot",
    copilotDesc: "In-depth analysis based on real hardware telemetry and user workload profiles",
    synergyLabel: "Build Synergy:",
    diagnosisBtn: "Run AI Diagnosis",
    pillar1: "SYNERGY & SWEET SPOT",
    pillar2: "THERMAL & VRM HEADROOM",
    pillar3: "PERSONA RECOMMENDATION",
    lowLevelTitle: "Low-Level Hardware Registers & Micro-Specs",
    archTitle: "Silicon & Microarchitecture Breakdown",
    personas: {
      live: {
        dev: {
          score: "82",
          tag1: "STABLE DUAL-CH",
          tag2: "COOL THERMAL",
          tag3: "GOOD FOR CODE",
          text1: "Intel Core i5-8400 (6 Cores) with 16GB Dual-Channel DDR4-2666 provides a rock-solid dev setup for VS Code, Node.js, and web compilation.",
          text2: "CPU operating at 46.5°C under stock cooler with 42W draw, well within safe 65W TDP thermal limits.",
          text3: "16GB RAM handles 4-6 Docker containers comfortably. Consider adding a dedicated SATA SSD for heavy container storage."
        },
        creator: {
          score: "62",
          tag1: "iGPU ACTIVE",
          tag2: "QUICKSYNC READY",
          tag3: "CONSIDER dGPU",
          text1: "Intel UHD 630 with QuickSync handles 1080p H.264 timeline playback nicely in Premiere Pro.",
          text2: "Without a discrete GPU, 4K ProRes timeline rendering will be software-rasterized on the 6 CPU cores.",
          text3: "Adding a dedicated PCIe GPU (e.g. GTX 1660 / RTX 3050+) will dramatically accelerate 3D rendering and video export times."
        },
        esports: {
          score: "70",
          tag1: "1080p 60FPS",
          tag2: "LOW LATENCY USB",
          tag3: "LIGHTWEIGHT ESPORTS",
          text1: "Intel UHD 630 can run League of Legends, Valorant (Low 720p/1080p) at ~60-80 FPS.",
          text2: "Dual-channel memory provides necessary memory bandwidth for the integrated graphics engine.",
          text3: "For 144Hz+ competitive gaming in CS2 or Apex, a dedicated graphics card is recommended."
        },
        silent: {
          score: "92",
          tag1: "QUIET 42W",
          tag2: "LOW POWER",
          tag3: "OFFICE WORK",
          text1: "System total power draw under load is under 90W, running exceptionally cool and quiet for extended office hours.",
          text2: "Dell motherboard power delivery is well-regulated for the 65W i5-8400 silicon.",
          text3: "Ideal low-power productivity workstation with zero thermal throttling risks."
        }
      },
      full: {
        dev: {
          score: "97",
          tag1: "PASSED",
          tag2: "EXCELLENT",
          tag3: "OPTIMAL",
          text1: "DDR5-6000 CL30 memory is operating at a 1:1 synchronous ratio with FCLK 2000MHz, hitting the optimal Zen 4 memory sweet spot with zero bus penalty.",
          text2: "The 14+2 phase 80A VRM holds MOSFET thermals at a cool 42.8°C under 58W CPU draw, providing massive headroom for future flagship upgrades.",
          text3: "For Fullstack Dev + Docker workloads, 32GB RAM handles 12+ active containers easily. Empty A1/B1 DIMM slots allow seamless upgrade to 64GB."
        },
        creator: {
          score: "93",
          tag1: "OPTIMAL",
          tag2: "GREAT",
          tag3: "CONSIDER 64GB",
          text1: "Dual NVMe Gen4 x4 array provides 12.4 GB/s aggregate throughput, streaming 4K ProRes 422 footage with zero buffer drops in Premiere and DaVinci.",
          text2: "RTX 4070 Ti Super 16GB with Dual AV1 Encoders cuts render export times by 58% compared to single-encoder setups.",
          text3: "Heavy Unreal Engine 5 or After Effects caching may push 32GB RAM close to 85% capacity. Upgrading to 64GB is recommended for large cinematic scenes."
        },
        esports: {
          score: "99",
          tag1: "ENDGAME",
          tag2: "ZERO THROTTLE",
          tag3: "ULTRA LOW LATENCY",
          text1: "Ryzen 7 7800X3D with 96MB 3D V-Cache delivers the world's highest esports 1% low frame rates, eliminating micro-stutters during heavy combat.",
          text2: "Logitech G Pro X Superlight 2 (4000Hz / 0.25ms) paired with Wooting 60HE (0.1mm Rapid Trigger) establishes the lowest input-latency chain on direct USB.",
          text3: "LG Nano-IPS 165Hz OC 180Hz with G-Sync Full Range provides flawless frame pacing at 300+ FPS with zero tearing."
        },
        silent: {
          score: "96",
          tag1: "SUB-30dB",
          tag2: "STABLE THERMAL",
          tag3: "EFFICIENT Q4/Q8",
          text1: "CPU VCore at 1.085V (Curve Optimizer -20) caps full-load package power at just 58W, keeping Arctic AIO fans under 800 RPM for near-silent operation.",
          text2: "16GB VRAM on RTX 4070 Ti Super fits Qwen-2.5 14B Q4_K_M or Llama-3.3 8B FP16 entirely in memory with >85 tokens/sec generation speed.",
          text3: "Room ambient and VRM temps stay below 45°C without supplementary fans, maintaining zero audible noise floor."
        }
      },
      missing: {
        dev: {
          score: "74",
          tag1: "MEMORY BOTTLENECK",
          tag2: "iGPU FALLBACK",
          tag3: "UPGRADE RECOMMENDED",
          text1: "Single-Channel 16GB RAM detected in Slot A2 (32-bit bus). Memory bandwidth is halved (31.2 GB/s), causing an ~18% CPU IPC penalty in compile workloads.",
          text2: "Discrete GPU is absent. Integrated AMD Radeon Graphics (2 CUs RDNA2) is active for display output, drawing from system RAM.",
          text3: "For Docker clusters, 16GB RAM will easily hit 90%+ saturation. Strongly recommend inserting a 2nd 16GB stick into Slot B2 to restore Dual-Channel 128-bit bus."
        },
        creator: {
          score: "58",
          tag1: "NO ACCELERATION",
          tag2: "VRAM BOTTLENECK",
          tag3: "REQUIRES dGPU",
          text1: "No discrete GPU detected. Premiere and DaVinci Resolve cannot utilize CUDA/NVENC acceleration, shifting all video encoding to CPU software rasterization.",
          text2: "Single NVMe SSD limits concurrent scratch disk bandwidth during 4K timelines. Slot M.2_2 is available for a dedicated cache drive.",
          text3: "System is severely under-equipped for heavy video production. Recommend adding an RTX 40-series GPU and populating Slot B2 with 16GB RAM."
        },
        esports: {
          score: "65",
          tag1: "iGPU LIMITATION",
          tag2: "SINGLE-CH LATENCY",
          tag3: "720p LOW ONLY",
          text1: "Integrated Radeon RDNA2 graphics cannot drive 1440p 165Hz at competitive frame rates. Expected frame rates: 45-60 FPS on 720p Low settings.",
          text2: "Single-channel RAM increases memory frame latency to 84ns, introducing noticeable 1% low frame time stuttering in esports titles.",
          text3: "Install a dedicated PCIe GPU in Slot 1 and enable Dual-Channel RAM to unlock 7800X3D's true 300+ FPS potential."
        },
        silent: {
          score: "88",
          tag1: "ULTRA LOW POWER",
          tag2: "SILENT OPERATION",
          tag3: "CPU INFERENCE ONLY",
          text1: "Without a discrete GPU, system total power consumption drops to just 118W under load. Total system is completely silent.",
          text2: "Local LLM inference is limited to small CPU quantized models (e.g. Llama-3.2 3B Q4) running at ~14 tokens/sec on CPU AVX-512 instructions.",
          text3: "Great low-power silent home server profile, but adding RAM and discrete GPU is required for heavy AI reasoning."
        }
      }
    }
  },
  VI: {
    headerHint: "Click vào linh kiện để xem vi thông số",
    uptime: "Thời gian chạy:",
    busStatus: "Đường truyền bus đang kích hoạt",
    targetPersona: "Nhu cầu sử dụng:",
    rigMode: "Chế độ phần cứng:",
    exportBtn: "Xuất Thẻ Flex",
    perCore: "Mức tải từng nhân CPU",
    peripheralsTitle: "Thiết Bị Ngoại Vi Đang Cắm",
    copilotTitle: "Trợ Lý AI Phân Tích Phần Cứng",
    copilotDesc: "Đánh giá chuyên sâu dựa trên cấu hình phần cứng thật và hồ sơ người dùng",
    synergyLabel: "Điểm Cân Bằng:",
    diagnosisBtn: "Chạy Chẩn Đoán AI",
    pillar1: "ĐỘ TƯƠNG THÍCH & SWEET SPOT",
    pillar2: "NHIỆT ĐỘ & ĐỘ AN TOÀN VRM",
    pillar3: "GỢI Ý TỐI ƯU THEO NHU CẦU",
    lowLevelTitle: "Thanh Ghi Phần Cứng & Vi Thông Số",
    archTitle: "Bóc Tách Vi Kiến Trúc & Bán Dẫn",
    personas: {
      live: {
        dev: {
          score: "82",
          tag1: "DUAL-CH ỔN ĐỊNH",
          tag2: "NHIỆT ĐỘ MÁT",
          tag3: "TỐT CHO LẬP TRÌNH",
          text1: "CPU Intel Core i5-8400 (6 Cores) kết hợp RAM 16GB Dual-Channel DDR4-2666 chạy mượt các tác vụ lập trình VS Code, Node.js và biên dịch web app.",
          text2: "Nhiệt độ CPU duy trì mát mẻ 46.5°C với tản nhiệt stock, mức ăn điện 42W rất an toàn so với giới hạn 65W TDP.",
          text3: "16GB RAM đủ gánh 4-6 container Docker chạy đồng thời. Nên ưu tiên lưu project trên ổ SSD Intel để tốc độ compile nhanh nhất."
        },
        creator: {
          score: "62",
          tag1: "iGPU TÍCH HỢP",
          tag2: "QUICKSYNC SẴN SÀNG",
          tag3: "NÊN GẮN THÊM GPU",
          text1: "Đồ họa tích hợp Intel UHD 630 hỗ trợ công nghệ Intel QuickSync giúp preview timeline video 1080p H.264 mượt mà trên Premiere Pro.",
          text2: "Do không có GPU rời, việc render video 4K nặng hoặc dựng 3D Blender sẽ phụ thuộc hoàn toàn vào 6 nhân CPU.",
          text3: "Khuyến nghị gắn thêm GPU rời (như GTX 1660 / RTX 3050) để tăng tốc xuất video Premiere và dựng hiệu ứng 3D."
        },
        esports: {
          score: "70",
          tag1: "1080p 60FPS",
          tag2: "ĐỘ TRỄ USB THẤP",
          tag3: "ESPORTS NHẸ",
          text1: "Đồ họa Intel UHD 630 đủ sức kéo các game esports nhẹ như Liên Minh Huyền Thoại, Valorant (Low 720p/1080p) ở mức 60-80 FPS.",
          text2: "Cấu hình RAM Dual-Channel 16GB giúp tăng băng thông đồ họa chia sẻ cho iGPU so với cắm 1 thanh đơn.",
          text3: "Nếu muốn chơi CS2 hoặc Apex Legends ở màn hình 144Hz mượt mà, cần nâng cấp thêm card đồ họa rời."
        },
        silent: {
          score: "92",
          tag1: "MÁT & ÊM (42W)",
          tag2: "TIẾT KIỆM ĐIỆN",
          tag3: "VĂN PHÒNG",
          text1: "Tổng công suất hệ thống chỉ khoảng 88W khi làm việc, quạt chạy êm ái hoàn toàn không gây ồn trong không gian làm việc.",
          text2: "Bo mạch chủ Dell cung cấp nguồn điện ổn định, linh kiện bền bỉ cho nhu cầu làm việc liên tục 24/7.",
          text3: "Máy chạy cực kỳ bền bỉ và mát mẻ, không có bất kỳ rủi ro quá nhiệt nào."
        }
      },
      full: {
        dev: {
          score: "97",
          tag1: "ĐẠT CHUẨN",
          tag2: "XUẤT SẮC",
          tag3: "TỐI ƯU",
          text1: "RAM DDR5-6000 CL30 đang chạy đúng tỉ lệ đồng bộ 1:1 với FCLK 2000MHz cho Zen 4, triệt tiêu hoàn toàn độ trễ bus bộ nhớ.",
          text2: "Dàn phase 14+2 (80A SPS) của B650 Tomahawk giữ nhiệt độ MOSFET ở mức 42.8°C khi kéo CPU ăn 58W, an toàn nâng cấp CPU cao hơn sau này.",
          text3: "Với nhu cầu Fullstack Dev + Docker, 32GB RAM cân mượt 12+ containers đồng thời. Khe A1/B1 còn trống sẵn sàng nâng lên 64GB khi cần."
        },
        creator: {
          score: "93",
          tag1: "TỐI ƯU",
          tag2: "RẤT TỐT",
          tag3: "CÂN NHẮC 64GB",
          text1: "Hệ thống 2 ổ NVMe Gen4 x4 cho tổng băng thông đọc 12.4 GB/s, preview video 4K ProRes 422 mượt mà không bị nghẽn bộ nhớ đệm.",
          text2: "RTX 4070 Ti Super 16GB với Dual AV1 Encoders thế hệ 8 giúp xuất video Premiere/DaVinci nhanh gấp 2.4x so với encoder đơn.",
          text3: "Khi làm dự án Unreal Engine 5 đại cảnh hoặc After Effects nặng, 32GB RAM có thể chạm ngưỡng 85% tải. Khuyến nghị lên 64GB nếu làm phim chuyên nghiệp."
        },
        esports: {
          score: "99",
          tag1: "ĐỈNH CAO",
          tag2: "KHÔNG NGHẼN",
          tag3: "ĐỘ TRỄ CỰC THẤP",
          text1: "Ryzen 7 7800X3D với 96MB 3D V-Cache là CPU chơi game esport số 1 thế giới, loại bỏ hoàn toàn hiện tượng tụt 1% Low FPS trong combat đông người.",
          text2: "Chuột Logitech Superlight 2 (4000Hz / 0.25ms) kết hợp phím Wooting 60HE (0.1mm Rapid Trigger) tạo chuỗi phản hồi tín hiệu nhanh nhất trên cổng USB.",
          text3: "Màn hình LG Nano-IPS 165Hz OC 180Hz bật G-Sync Full Range đồng bộ 300+ FPS mượt mà tuyệt đối, không có độ trễ phím/chuột."
        },
        silent: {
          score: "96",
          tag1: "DƯỚI 30dB",
          tag2: "NHIỆT CỰC MÁT",
          tag3: "TỐI ƯU Q4/Q8",
          text1: "Điện áp CPU VCore 1.085V (Curve -20) giúp CPU chỉ ăn 58W khi tải nặng, quạt tản AIO duy trì dưới 800 RPM hoàn toàn im lặng về đêm.",
          text2: "16GB VRAM trên 4070 Ti Super load trọn vẹn mô hình LLM Qwen-2.5 14B Q4 hoặc Llama-3.3 8B FP16 với tốc độ sinh từ > 85 tokens/giây.",
          text3: "Nhiệt độ phòng và VRM duy trì dưới 45°C không cần quạt thổi phụ, bảo toàn độ tĩnh lặng tuyệt đối cho không gian làm việc."
        }
      },
      missing: {
        dev: {
          score: "74",
          tag1: "NGHẼN BĂNG THÔNG RAM",
          tag2: "iGPU TÍCH HỢP",
          tag3: "KHUYẾN NGHỊ NÂNG CẤP",
          text1: "Phát hiện hệ thống chỉ cắm 1 thanh RAM 16GB ở khe A2 (chạy Single-Channel 32-bit). Băng thông RAM giảm 50% (31.2 GB/s), làm tụt ~18% hiệu năng CPU.",
          text2: "Hệ thống không có GPU rời, đang dùng iGPU AMD Radeon tích hợp (2 CUs) chia sẻ RAM hệ thống để xuất hình.",
          text3: "Khi chạy Docker cluster, 16GB RAM sẽ sớm bị tràn bộ nhớ (>90%). Khuyến nghị cắm thêm 1 thanh 16GB vào khe B2 để kích hoạt Dual-Channel 128-bit."
        },
        creator: {
          score: "58",
          tag1: "THIẾU CARD ĐỒ HỌA",
          tag2: "TRÀN BỘ NHỚ",
          tag3: "CẦN LẮP THÊM GPU",
          text1: "Không có GPU rời khiến Premiere/DaVinci không thể bật CUDA/NVENC hardware render, bắt CPU phải gánh 100% bằng phần mềm.",
          text2: "Chỉ có 1 ổ SSD NVMe làm giảm tốc độ đọc/ghi dữ liệu tạm thời (cache scratch disk) khi dựng timeline 4K.",
          text3: "Cấu hình chưa đáp ứng tốt nhu cầu Creator. Cần lắp thêm GPU NVIDIA RTX và cắm thêm 1 thanh RAM 16GB vào khe B2."
        },
        esports: {
          score: "65",
          tag1: "iGPU YẾU",
          tag2: "TRỄ BỘ NHỚ CAO",
          tag3: "CHỈ CHƠI 720p LOW",
          text1: "Đồ họa tích hợp Radeon iGPU chỉ đạt 45-60 FPS ở mức thiết lập 720p Low, không đủ kéo màn hình 1440p 165Hz.",
          text2: "RAM Single-Channel làm tăng độ trễ bộ nhớ lên 84ns, gây hiện tượng khựng khung hình (1% Low FPS) khi giao tranh.",
          text3: "Cần cắm thêm GPU rời vào khe PCIe x16 và thêm thanh RAM thứ 2 để mở khóa toàn bộ 300+ FPS của CPU 7800X3D."
        },
        silent: {
          score: "88",
          tag1: "TIẾT KIỆM ĐIỆN",
          tag2: "IM LẶNG TUYỆT ĐỐI",
          tag3: "CHỈ CHẠY LLM NHỎ",
          text1: "Không có GPU rời giúp tổng công suất toàn hệ thống giảm xuống chỉ 118W khi tải nặng, máy chạy êm tuyệt đối.",
          text2: "Chỉ chạy được các model AI cỡ nhỏ (Llama-3.2 3B Q4) bằng CPU AVX-512 với tốc độ ~14 tokens/giây do thiếu VRAM.",
          text3: "Thích hợp làm máy chủ silent server gia đình. Nếu muốn làm AI Lab chuyên sâu, cần trang bị thêm GPU 16GB VRAM."
        }
      }
    }
  }
};
