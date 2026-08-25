import type { HardwareTelemetryState, InspectorItem } from '../types/hardware';

export const fullRigTelemetry: HardwareTelemetryState = {
  hostName: "DESKTOP-TITAN-X",
  uptime: "04h 32m",
  busFrequencyHz: 1000,
  cpu: {
    name: "AMD Ryzen 7 7800X3D",
    cores: 8,
    threads: 16,
    cache: "96MB 3D V-Cache",
    avgClockMhz: 4850,
    maxClockMhz: 5050,
    tempC: 56.2,
    tjMaxC: 89.0,
    vcoreV: 1.085,
    curveOptimizer: "-20 All Cores",
    powerW: 58.4,
    tdpLimitW: 120,
    perCoreLoads: [60, 40, 85, 25, 20, 90, 15, 18]
  },
  ram: {
    totalGb: 32,
    channelMode: "Dual-Channel (2x16GB)",
    config: "2x 16GB",
    model: "G.Skill Trident Z5 Neo RGB",
    die: "SK Hynix A-Die",
    frequencyMhz: 3000,
    fclkMhz: 2000,
    primaryTimings: "CL30-38-38-96",
    voltageV: 1.350,
    slotTopology: "Slot A2 + B2 (Optimal Daisy-Chain)",
    isSingleChannel: false,
    slots: [
      { slot: "A1", size: "Empty", status: "empty" },
      { slot: "A2", size: "16GB", status: "active", label: "EXPO" },
      { slot: "B1", size: "Empty", status: "empty" },
      { slot: "B2", size: "16GB", status: "active", label: "EXPO" }
    ]
  },
  motherboard: {
    name: "MSI MAG B650 TOMAHAWK WIFI",
    chipset: "AMD B650 Promontory 21",
    pcbLayers: "6-Layer 2oz Server-Grade",
    agesaVersion: "AGESA 1.2.0.2",
    biosDate: "2025-09-18",
    vrm: {
      phases: "14+2+1 Duet Stages",
      spsAmp: "80A Smart Power Stages",
      tempC: 42.8,
      mosfetLoadPct: 35
    }
  },
  storage: {
    m2_1: {
      name: "Samsung 990 Pro 2TB",
      lane: "PCIe 4.0 x4 (CPU Direct)",
      speedRead: "7,450 MB/s",
      tempC: 41.0,
      healthPct: 100,
      isPopulated: true
    },
    m2_2: {
      name: "Crucial P3 Plus 1TB",
      lane: "PCIe 4.0 x4 (PCH Chipset)",
      speedRead: "5,000 MB/s",
      tempC: 38.5,
      healthPct: 99,
      isPopulated: true
    },
    m2_3: {
      isPopulated: false
    }
  },
  gpu: {
    name: "NVIDIA GeForce RTX 4070 Ti SUPER",
    isDiscrete: true,
    vram: "16GB GDDR6X (256-bit)",
    busWidth: "256-bit",
    pcieLink: "PCIe 4.0 x16 @ 16.0 GT/s",
    rebarActive: true,
    tempC: 54.0,
    powerW: 215
  },
  cooler: {
    name: "Arctic Liquid Freezer III 360",
    type: "AIO 360mm Radiator",
    pumpRpm: 2800,
    fanRpm: 850,
    coolantTempC: 32.4
  },
  psu: {
    name: "Corsair RM850x (ATX 3.0)",
    rating: "80+ Gold",
    ratedWattage: 850,
    currentLoadW: 312,
    loadPct: 36.7,
    rail12v: 12.08,
    zeroRpm: true
  },
  network: {
    name: "AMD RZ616 Wi-Fi 6E",
    band: "6GHz Dedicated (160MHz)",
    linkSpeedMbps: 2402,
    pingMs: 4,
    rssi: "-42 dBm",
    lanName: "Realtek RTL8125BG 2.5G"
  },
  peripherals: [
    {
      id: "monitor",
      name: "LG 27GP850-B UltraGear",
      type: "display",
      spec: "165Hz • 1440p",
      detail: "Nano-IPS • 10-bit HDR • DP 1.4",
      icon: "tv",
      active: true
    },
    {
      id: "mouse",
      name: "Logitech G Pro X Superlight 2",
      type: "mouse",
      spec: "4000Hz Polling",
      detail: "HERO 2 • 0.25ms • Batt: 88%",
      icon: "mouse",
      active: true
    },
    {
      id: "keyboard",
      name: "Wooting 60HE+ (Hall Effect)",
      type: "keyboard",
      spec: "0.1mm RT",
      detail: "Lekker Linear • 8000Hz USB",
      icon: "keyboard",
      active: true
    },
    {
      id: "dac",
      name: "FiiO K5 Pro ESS DAC/Amp",
      type: "audio",
      spec: "384kHz / 32-bit",
      detail: "USB Audio 2.0 • ES9038Q2M",
      icon: "headphones",
      active: true
    }
  ]
};

export const missingRigTelemetry: HardwareTelemetryState = {
  ...fullRigTelemetry,
  ram: {
    ...fullRigTelemetry.ram,
    totalGb: 16,
    channelMode: "Single-Channel (1x16GB)",
    config: "1x 16GB",
    slotTopology: "Slot A2 Only (Single-Channel 32-bit)",
    isSingleChannel: true,
    slots: [
      { slot: "A1", size: "Empty", status: "empty" },
      { slot: "A2", size: "16GB", status: "active", label: "EXPO" },
      { slot: "B1", size: "Empty", status: "empty" },
      { slot: "B2", size: "Empty", status: "empty" }
    ]
  },
  storage: {
    ...fullRigTelemetry.storage,
    m2_2: {
      name: "M.2_2 Slot [Unpopulated]",
      lane: "PCIe 4.0 x4 (Available)",
      speedRead: "--",
      tempC: 0,
      healthPct: 0,
      isPopulated: false
    }
  },
  gpu: {
    name: "AMD Radeon Graphics (Integrated iGPU)",
    isDiscrete: false,
    vram: "Shared System Memory",
    busWidth: "32-bit (Shared)",
    pcieLink: "PCIe x16 [EMPTY - iGPU ACTIVE]",
    rebarActive: false,
    tempC: 45.0,
    powerW: 15
  },
  psu: {
    ...fullRigTelemetry.psu,
    currentLoadW: 118,
    loadPct: 13.8
  },
  peripherals: [
    fullRigTelemetry.peripherals[0],
    fullRigTelemetry.peripherals[1],
    fullRigTelemetry.peripherals[2],
    {
      id: "dac",
      name: "Realtek ALC4080 Onboard Audio",
      type: "audio",
      spec: "192kHz / 24-bit",
      detail: "Motherboard Integrated Codec",
      icon: "headphones",
      active: true
    }
  ]
};

export const inspectorDatabase: Record<string, InspectorItem> = {
  cpu: {
    id: "cpu",
    title: "AMD Ryzen 7 7800X3D (Zen 4 Raphael)",
    badge: "AM5 • 8C/16T • 96MB V-CACHE",
    icon: "cpu",
    aiScore: "SILICON SCORE: 98/100",
    aiText_EN: "This 7800X3D sample runs stably with Curve Optimizer -20 on all cores at just 1.085V VCore under heavy load. The 96MB 3D V-Cache stack eliminates memory latency penalties for both 1440p gaming and large codebase indexing.",
    aiText_VI: "Con 7800X3D này đang chạy Curve Optimizer -20 All Cores với điện áp VCore chỉ 1.085V khi tải nặng. Nhiệt độ Tdie 56.2°C chứng tỏ tản nhiệt tiếp xúc cực tốt. Cache 3D V-Cache 96MB bù đắp triệt để độ trễ RAM khi chơi game 1440p và tăng tốc biên dịch file TypeScript lớn.",
    specs: [
      { label: "Silicon Stepping", val: "RPL-B2 (CPUID: 00A60F12)" },
      { label: "CCD / CCX Config", val: "1x CCD (8 Cores Active) + 1x cIOD" },
      { label: "L1 Data / Inst Cache", val: "8 x 32 KB / 8 x 32 KB (8-way)" },
      { label: "L2 Cache (Dedicated)", val: "8 x 1 MB (1 MB/Core)" },
      { label: "L3 3D V-Cache", val: "96 MB (32MB Core + 64MB 3D Stack)" },
      { label: "Instruction Sets", val: "AVX-512, BMI2, SHA, AES, AMD-V" },
      { label: "FCLK Frequency", val: "2,000 MHz (Synchronous 1:1)" },
      { label: "Curve Optimizer", val: "All Cores: -20 Negative Offset" },
      { label: "Silicon SP Quality", val: "SP 114 (Gold Sample)" },
      { label: "TJMax Temperature", val: "89.0 °C (Headroom: +32.8 °C)" }
    ],
    arch_EN: "Zen 4 microarchitecture combined with TSMC direct-bonded 3D V-Cache across TSVs providing >2.5 TB/s bandwidth between L3 cache and core compute dies.",
    arch_VI: "Vi kiến trúc Zen 4 kết hợp công nghệ TSMC 3D V-Cache (Direct-bonded SRAM qua TSVs với băng thông > 2.5 TB/s giữa L3 và CPU cores). Controller I/O 6nm rời hỗ trợ 28 lanes PCIe 5.0."
  },
  ram: {
    id: "ram",
    title: "G.Skill Trident Z5 Neo RGB DDR5-6000",
    badge: "32GB (2x16GB) • SK HYNIX A-DIE",
    icon: "layers",
    aiScore: "RAM SYNERGY: 99/100",
    aiText_EN: "SK Hynix A-Die kit operating on EXPO I DDR5-6000 CL30 profile syncs perfectly with AMD Infinity Fabric FCLK 2000MHz. Sub-timings can be safely tightened down to tRFC 380ns to reduce latency by another ~4ns.",
    aiText_VI: "Kít RAM Hynix A-Die chạy profile EXPO I DDR5-6000 CL30 hoàn hảo cho Infinity Fabric của AMD 7000 series. Điện áp VDD 1.35V cực kỳ mát mẻ (41°C). Nếu muốn vắt thêm hiệu năng, kit này hoàn toàn siết được tRFC từ 480 xuống 380 và tFAW xuống 20 để giảm thêm 4ns memory latency.",
    specs: [
      { label: "DRAM Die Manufacturer", val: "SK Hynix A-Die (16Gb Density)" },
      { label: "Config & Channels", val: "2x 16GB • 2x 32-bit Sub-channels/DIMM" },
      { label: "Primary Timings", val: "CL30 - tRCD 38 - tRP 38 - tRAS 96" },
      { label: "Secondary (tRFC / tREFI)", val: "tRFC 480ns • tREFI 65,535" },
      { label: "Tertiary (tFAW / tRRD)", val: "tFAW 24 • tRRD_S 4 • tRRD_L 8" },
      { label: "Read / Write Bandwidth", val: "Read: 62.4 GB/s • Write: 81.2 GB/s" },
      { label: "Memory Latency", val: "63.8 ns (AIDA64 Memory Benchmark)" },
      { label: "On-Die ECC", val: "Supported & Active" },
      { label: "PMIC Voltage (VDD/VDDQ)", val: "1.350 V / 1.350 V (Richtek PMIC)" },
      { label: "SPD Hub Sensor Temp", val: "DIMM A2: 41.2°C • DIMM B2: 42.0°C" }
    ],
    arch_EN: "Daisy-chain motherboard trace topology achieves highest signal integrity on slots A2 + B2. VDDIO and SoC voltage remain capped at safe 1.20V.",
    arch_VI: "Topology Daisy-Chain trên MSI Tomahawk phát huy hiệu quả cao nhất ở 2 khe A2 + B2. Điện áp VDDIO và SoC Voltage được giữ ở mức 1.20V an toàn tuyệt đối."
  },
  mainboard: {
    id: "mainboard",
    title: "MSI MAG B650 TOMAHAWK WIFI",
    badge: "AMD B650 • 6-LAYER SERVER PCB",
    icon: "circuit-board",
    aiScore: "VRM & EXPANSION: 96/100",
    aiText_EN: "Solid 6-layer server-grade PCB ensures clean DDR5 signal integrity up to 7200MT/s. AGESA 1.2.0.2 BIOS minimizes cold boot times and unlocks aggressive PBO curve tuning.",
    aiText_VI: "Bo mạch chủ thuộc hàng best-seller phân khúc tầm trung cao cấp. PCB 6 lớp đồng 2oz tiêu chuẩn server giúp tín hiệu DDR5 6000 sạch sẽ, không nhiễu. BIOS AGESA mới nhất 1.2.0.2 fix triệt để độ trễ boot time và tối ưu PBO boost clock.",
    specs: [
      { label: "Chipset Model", val: "AMD B650 Promontory 21" },
      { label: "PCB Construction", val: "6-Layer 2oz Thickened Copper" },
      { label: "BIOS Version / Date", val: "7D75v1J (AGESA 1.2.0.2 / 2025-09)" },
      { label: "PCIe Slot 1 (Primary)", val: "PCIe 4.0 x16 (Direct CPU Lines)" },
      { label: "M.2 Storage Count", val: "3x M.2 PCIe 4.0 x4 with Shield Frozr" },
      { label: "LAN Controller", val: "Realtek RTL8125BG 2.5Gbps" },
      { label: "Wireless / Bluetooth", val: "AMD Wi-Fi 6E (160MHz) + BT 5.3" },
      { label: "Audio Codec", val: "Realtek ALC4080 (High-Res 384kHz)" }
    ],
    arch_EN: "Direct discrete lanes: GPU and M.2_1 connect straight to CPU root complex; M.2_2 and peripherals route via B650 chipset uplink.",
    arch_VI: "Phân bổ làn PCIe độc lập: GPU và M.2_1 nhận trực tiếp 20 làn PCIe 4.0 từ CPU, các cổng M.2_2 và thiết bị ngoại vi đi qua bus B650 chipset mà không bị share băng thông."
  },
  vrm: {
    id: "vrm",
    title: "14+2+1 Phase Duet Power Stage VRM",
    badge: "80A SMART POWER STAGES",
    icon: "shield",
    aiScore: "VRM THERMAL: 99/100",
    aiText_EN: "Total 1,120A theoretical capacity runs at barely 5% load on 7800X3D, generating minimal heat (42.8°C) with safe thermal ceiling for 16-core flagship upgrades.",
    aiText_VI: "Tổng công suất lý thuyết của dàn VRM lên tới 1120A, trong khi 7800X3D chỉ ăn khoảng 50A dưới tải nặng nhất. Nhiệt độ MOSFET chỉ 42.8°C mà không cần quạt phụ. Thoải mái nâng cấp lên các dòng CPU Flagship như 9950X / 9900X3D trong tương lai.",
    specs: [
      { label: "PWM Controller IC", val: "Monolithic Power Systems MP2857" },
      { label: "VCore Power Stages", val: "14x MPS MP87670 (80A per Phase)" },
      { label: "SOC / MISC Phases", val: "2x 80A (SOC) + 1x (MISC)" },
      { label: "Total VRM Ampacity", val: "1,120 Amperes Max Peak" },
      { label: "VRM MOSFET Temp", val: "42.8 °C (Ambient: 27.5 °C)" },
      { label: "VCore Ripple Voltage", val: "< 12 mV (Clean Power Delivery)" }
    ],
    arch_EN: "Duet Power phase layout delivers instant transient recovery under microsecond CPU boost clock shifts.",
    arch_VI: "Thiết kế Duet Power Phase cấp nguồn ổn định tức thời khi CPU chuyển đổi xung nhịp đột ngột từ 0.8GHz lên 5.05GHz trong vài micro-giây."
  },
  nvme1: {
    id: "nvme1",
    title: "Samsung 990 Pro 2TB (NVMe PCIe Gen4)",
    badge: "M.2_1 • CPU DIRECT LANE • 7450 MB/s",
    icon: "hard-drive",
    aiScore: "STORAGE HEALTH: 100/100",
    aiText_EN: "Direct CPU lane attachment delivers 7,450 MB/s sequential and 1.4M IOPS. Mainboard Shield Frozr keeps controller at 52°C and NAND flash at 41°C with zero thermal throttling.",
    aiText_VI: "Cắm trực tiếp vào lane PCIe của CPU giúp Samsung 990 Pro đạt tốc độ đọc tuần tự 7,450 MB/s và IOPS ngẫu nhiên 1,400,000 IOPS. Tản nhiệt Shield Frozr của mainboard giữ NAND ở 41°C và Controller ở 52°C, không hề bị thermal throttling.",
    specs: [
      { label: "SSD Controller", val: "Samsung Pascal S4LV008 (8nm)" },
      { label: "NAND Flash Type", val: "Samsung V-NAND 176-Layer 3D TLC" },
      { label: "DRAM Cache", val: "2GB LPDDR4 Low Power" },
      { label: "Sequential Read / Write", val: "7,450 MB/s / 6,900 MB/s" },
      { label: "PCIe Link State", val: "PCIe Gen 4.0 x4 (L0 Active)" },
      { label: "Total Bytes Written (TBW)", val: "14.2 TB / 1,200 TB (Wear: 1%)" }
    ],
    arch_EN: "Samsung 8nm in-house controller increases energy efficiency by 50% per watt compared to previous-gen 980 Pro.",
    arch_VI: "Controller 8nm thế giới mới của Samsung cải thiện 50% hiệu suất năng lượng trên mỗi Watt so với thế hệ 980 Pro."
  },
  nvme2: {
    id: "nvme2",
    title: "Crucial P3 Plus 1TB (M.2_2 Chipset Lane)",
    badge: "M.2_2 • CHIPSET PCH LANE • 5000 MB/s",
    icon: "hard-drive",
    aiScore: "SECONDARY STORAGE: 95/100",
    aiText_EN: "Secondary 1TB drive dedicated to game libraries and Docker containers. 5,000 MB/s read speed via B650 chipset provides instantaneous container layer loading.",
    aiText_VI: "Ổ phụ 1TB phục vụ lưu trữ games và dữ liệu Docker images. Tốc độ đọc 5,000 MB/s qua chipset B650 hoàn toàn mượt mà, thời gian load map game nặng hay pull Docker container chỉ tính bằng giây.",
    specs: [
      { label: "SSD Controller", val: "Phison PS5021-E21T (DRAMless Host Memory)" },
      { label: "NAND Flash Type", val: "Micron 176-Layer 3D QLC" },
      { label: "Sequential Read / Write", val: "5,000 MB/s / 3,600 MB/s" },
      { label: "Operating Temp", val: "38.5 °C" }
    ],
    arch_EN: "Utilizes Windows Host Memory Buffer (HMB) to cache FTL lookup tables directly in system DRAM.",
    arch_VI: "Tận dụng Host Memory Buffer (HMB) của Windows để lưu trữ bảng FTL translation thay vì chip DRAM vật lý, giúp tiết kiệm điện và giảm nhiệt."
  },
  gpu: {
    id: "gpu",
    title: "NVIDIA GeForce RTX 4070 Ti SUPER (16GB)",
    badge: "AD103 DIE • 8448 CUDA • 256-BIT BUS",
    icon: "monitor",
    aiScore: "GPU WORKLOAD SYNERGY: 97/100",
    aiText_EN: "16GB 256-bit VRAM on AD103 die eliminates 1440p/4K VRAM bottlenecks. Gen 4 Tensor cores provide massive acceleration for local AI inference and DLSS 3 Frame Gen.",
    aiText_VI: "Bản nâng cấp 16GB VRAM 256-bit trên chip AD103 giải quyết hoàn toàn bài toán tràn VRAM ở độ phân giải 1440p và 4K. Hỗ trợ Dual AV1 Encoders thế hệ 8 và Tensor Cores Gen 4 cực mạnh để tăng tốc AI inference (Stable Diffusion / Ollama local).",
    specs: [
      { label: "GPU Die Code", val: "AD103-275-A1 (TSMC 4N Custom)" },
      { label: "CUDA Cores / SM Count", val: "8,448 Cores / 66 SMs" },
      { label: "Tensor / RT Cores", val: "264 Tensor (Gen 4) • 66 RT (Gen 3)" },
      { label: "Base / Boost Clock", val: "2,340 MHz / 2,610 MHz (Actual: 2,745 MHz)" },
      { label: "VRAM Memory Spec", val: "16GB GDDR6X • Micron 21 Gbps" },
      { label: "Memory Bus / Bandwidth", val: "256-bit • 672.0 GB/s" },
      { label: "Resizable BAR (ReBAR)", val: "Enabled (Full 16GB Addressable)" }
    ],
    arch_EN: "Ada Lovelace architecture featuring 4th-gen Tensor cores and optical flow accelerator for neural rendering.",
    arch_VI: "Vi kiến trúc Ada Lovelace với Optical Flow Accelerator phục vụ DLSS 3 Frame Generation và bộ nhớ L2 Cache khổng lồ 48MB."
  },
  psu: {
    id: "psu",
    title: "Corsair RM850x (2024 Edition ATX 3.0)",
    badge: "850W • 80+ GOLD • ZERO RPM",
    icon: "zap",
    aiScore: "PSU EFFICIENCY: 99/100",
    aiText_EN: "The 850W ATX 3.0 power supply operates in its peak efficiency zone (36.7% load / 312W draw) while system is running at full gaming load. Dedicated native 12V-2x6 cable guarantees clean power delivery to RTX 4070 Ti Super with zero transient spike risks.",
    aiText_VI: "Bộ nguồn 850W ATX 3.0 hoạt động trong dải hiệu suất vàng (36.7% tải / 312W tổng hệ thống khi gaming). Cáp 12V-2x6 cấp điện trực tiếp cho RTX 4070 Ti Super giúp triệt tiêu hoàn toàn rủi ro sập nguồn do transient spikes.",
    specs: [
      { label: "Rated Wattage & Efficiency", val: "850 Watts • 80 PLUS Gold (91.4% Eff)" },
      { label: "Standard & Compliance", val: "ATX 3.0 / PCIe 5.0 (200% Excursion Safe)" },
      { label: "+12V Rail Output", val: "70.8A (849.6W Max on Single Rail)" },
      { label: "Actual +12V Voltage", val: "12.08 V (Super Low 8mV Ripple)" }
    ],
    arch_EN: "LLC resonant topology with synchronous rectification and DC-DC conversion module for rock-solid cross-load voltage regulation.",
    arch_VI: "Cấu trúc mạch cộng hưởng LLC Resonant kết hợp DC-DC Converter giúp ổn định điện áp trên toàn bộ các đường ray +12V, +5V và +3.3V."
  },
  cooler: {
    id: "cooler",
    title: "Arctic Liquid Freezer III 360 A-RGB",
    badge: "360mm RADIATOR • VRM FAN • 2800 RPM PUMP",
    icon: "fan",
    aiScore: "THERMAL DISSIPATION: 99/100",
    aiText_EN: "Thick 38mm radiator paired with Arctic P12 PWM fans and an active 40mm VRM auxiliary fan keeps CPU Tdie under 57°C and Motherboard VRM below 43°C while remaining under 28 dBA acoustics.",
    aiText_VI: "Két nước dày 38mm kết hợp quạt áp suất tĩnh P12 PWM và quạt tản VRM tích hợp trên block bơm giữ CPU dưới 57°C và dàn VRM dưới 43°C, độ ồn toàn hệ thống dưới 28 dBA.",
    specs: [
      { label: "Radiator Dimensions", val: "398 x 120 x 38 mm (Extra Thick Fin Stack)" },
      { label: "Cold Plate Contact", val: "Full Copper with Offset AM5 Mounting" },
      { label: "Pump Speed", val: "2,800 RPM (PWM Controlled)" },
      { label: "Coolant Temperature", val: "32.4 °C (Delta T Ambient: +4.9 °C)" }
    ],
    arch_EN: "Offset mounting bracket places the micro-skived copper cold plate directly over Zen 4's offset Core Compute Die (CCD) hotspot.",
    arch_VI: "Ngàm Offset AM5 đặt tâm tấm đồng tản nhiệt tiếp xúc chuẩn xác vào vị trí điểm nóng của chip CCD Ryzen 7000."
  },
  network: {
    id: "network",
    title: "AMD RZ616 Wi-Fi 6E (160MHz) + Realtek 2.5G LAN",
    badge: "WI-FI 6E • 6GHz BAND • 2.5Gbps ETHERNET",
    icon: "wifi",
    aiScore: "NETWORK LATENCY: 98/100",
    aiText_EN: "6GHz clean wireless spectrum delivers 2,402 Mbps link speed with rock-solid 4ms ping jitter, offering near-ethernet packet stability for competitive gaming and cloud sync.",
    aiText_VI: "Băng tần 6GHz không bị nhiễu sóng Wi-Fi hàng xóm, tốc độ link 2,402 Mbps với độ trễ jitter chỉ 4ms, ổn định tương đương cắm dây LAN trực tiếp.",
    specs: [
      { label: "Wireless Protocol", val: "Wi-Fi 6E (IEEE 802.11ax • 160MHz Channels)" },
      { label: "Connected Band", val: "6 GHz Dedicated Spectrum (WPA3-SAE)" },
      { label: "Link Speed (Tx/Rx)", val: "2,402 Mbps / 2,402 Mbps" },
      { label: "Signal RSSI", val: "-42 dBm (Excellent 100% Signal)" }
    ],
    arch_EN: "MediaTek Filogic 330 (RZ616) chip with dual-band concurrent transmission and integrated Bluetooth 5.3 core.",
    arch_VI: "Chip vi xử lý mạng MediaTek Filogic 330 tích hợp công nghệ chống nghẽn gói tin OFDMA và Bluetooth 5.3."
  },
  monitor: {
    id: "monitor",
    title: "LG 27GP850-B UltraGear 27-inch",
    badge: "NANO-IPS • 2560x1440 • 165Hz OC 180Hz",
    icon: "tv",
    aiScore: "DISPLAY SYNERGY: 98/100",
    aiText_EN: "27-inch 1440p Nano-IPS panel with 98% DCI-P3 color gamut and 1ms response time syncs seamlessly with RTX 4070 Ti Super over G-Sync Variable Refresh Rate.",
    aiText_VI: "Màn hình 27 inch 1440p Nano-IPS với độ phủ màu 98% DCI-P3 và độ trễ 1ms GtG. Phối hợp hoàn hảo với RTX 4070 Ti Super để bật G-Sync Full Range (48-165Hz) mượt mà không bao giờ bị xé hình.",
    specs: [
      { label: "Panel Technology", val: "LG Nano-IPS (DCI-P3 98%, sRGB 135%)" },
      { label: "Native Resolution", val: "2560 x 1440 (QHD 16:9 • 109 PPI)" },
      { label: "Refresh Rate / OC", val: "165 Hz (Overclockable to 180 Hz)" }
    ],
    arch_EN: "Nano-meter particles applied to LED backlights filter unwanted light wavelengths for ultra-pure RGB color reproduction.",
    arch_VI: "Tấm nền Nano IPS sử dụng các hạt kích thước nanomet trên đèn nền LED để lọc các bước sóng ánh sáng dư thừa, tạo màu đỏ và xanh lá chuẩn xác."
  },
  mouse: {
    id: "mouse",
    title: "Logitech G Pro X Superlight 2 Lightspeed",
    badge: "HERO 2 SENSOR • 4000Hz POLLING • 60g",
    icon: "mouse",
    aiScore: "PERIPHERAL RATING: 99/100",
    aiText_EN: "Top-tier esports mouse with 4000Hz wireless polling rate (0.25ms report interval) and zero-smoothing HERO 2 sensor with 88% battery life.",
    aiText_VI: "Chuột esport hàng đầu với polling rate không dây 4000Hz (độ trễ 0.25ms). Cảm biến HERO 2 tracking 32,000 DPI không gia tốc. Pin 88% cho thời lượng dùng lên tới 95 giờ.",
    specs: [
      { label: "Sensor Model", val: "Logitech HERO 2 (Dual Sensor Matrix)" },
      { label: "Wireless Polling Rate", val: "4,000 Hz (0.25 ms latency jitter < 0.02ms)" },
      { label: "Switch Type", val: "LIGHTFORCE Optical-Mechanical Hybrids" }
    ],
    arch_EN: "Proprietary 2.4GHz Lightspeed wireless protocol with channel-hopping RF interference mitigation.",
    arch_VI: "Công nghệ kết nối không dây Lightspeed tần số 2.4GHz với thuật toán nhảy kênh chống nhiễu sóng Wi-Fi."
  },
  keyboard: {
    id: "keyboard",
    title: "Wooting 60HE+ (Hall Effect Analog)",
    badge: "RAPID TRIGGER • 0.1mm ACTUATION • 8000Hz",
    icon: "keyboard",
    aiScore: "KEYBOARD LATENCY: 100/100",
    aiText_EN: "Magnetic Hall Effect keyboard with 0.1mm actuation and dynamic Rapid Trigger continuous reset for instantaneous mechanical response.",
    aiText_VI: "Bàn phím cơ công nghệ cảm ứng từ trường Hall Effect. Điểm nhận phím siêu nhạy 0.1mm kết hợp tính năng Rapid Trigger tự động reset phím ngay khi nhả tay, tối ưu tối đa phản xạ.",
    specs: [
      { label: "Switch Mechanism", val: "Lekker Magnetic Linear (Hall Effect)" },
      { label: "Actuation Range", val: "0.1 mm to 4.0 mm (0.1mm Increments)" },
      { label: "Rapid Trigger Sensitivity", val: "0.1 mm Continuous Reset" }
    ],
    arch_EN: "Hall effect sensors track continuous analog magnet movement with sub-millimeter precision.",
    arch_VI: "Cảm biến từ tính đo sự thay đổi của từ trường nam châm trong switch với độ chính xác sub-millimeter."
  },
  dac: {
    id: "dac",
    title: "FiiO K5 Pro ESS Desktop Headphone DAC/Amp",
    badge: "ES9038Q2M DAC • 32-BIT/768kHz • 1.5W AMP",
    icon: "headphones",
    aiScore: "AUDIO FIDELITY: 97/100",
    aiText_EN: "Audiophile-grade desktop DAC powered by ESS Sabre ES9038Q2M and XMOS XUF208 supporting 768kHz/32-bit PCM and DSD512 native decoding.",
    aiText_VI: "DAC giải mã audiophile cao cấp dùng chip ESS Sabre ES9038Q2M và chip USB XMOS XUF208. Hỗ trợ PCM 32-bit/768kHz và DSD512 native. Kéo khỏe mọi tai nghe trở kháng từ 16 đến 300 Ohms.",
    specs: [
      { label: "DAC Chipset", val: "ESS Technology Sabre ES9038Q2M" },
      { label: "Max Decoding Rate", val: "PCM 768kHz/32-bit • DSD512 Native" },
      { label: "Signal to Noise Ratio", val: "118 dB (A-weighted)" }
    ],
    arch_EN: "Isolated clean power rail architecture with OPA1642 pre-amp and TPA6120 current-feedback amplifier stages.",
    arch_VI: "Thiết kế mạch nguồn lọc sạch nhiễu USB 5V độc lập, kết hợp tầng khuếch đại OPA1642 + TPA6120."
  }
};
