import type { HardwareTelemetryState, InspectorItem } from '../types/hardware';
import { simulatedCapabilities } from './liveTelemetry';

// 1. LIVE PC TELEMETRY
export const liveRigTelemetry: HardwareTelemetryState = {
  telemetry: { mode: 'simulated', status: 'ready', capabilities: simulatedCapabilities() },
  hostName: "DESKTOP-VNPT-WORK",
  uptime: "02h 45m",
  busFrequencyHz: 1000,
  isLiveDetected: true,
  cpu: {
    name: "Intel Core i5-8400 CPU @ 2.80GHz",
    cores: 6,
    threads: 6,
    cache: "9MB Intel Smart Cache",
    avgClockMhz: 2808,
    maxClockMhz: 4000,
    currentLoadPct: 33,
    tempC: 46.5,
    tjMaxC: 100.0,
    vcoreV: 1.050,
    curveOptimizer: "Factory Intel Spec",
    powerW: 42.0,
    tdpLimitW: 65,
    perCoreLoads: [25, 45, 18, 60, 30, 22]
  },
  ram: {
    totalGb: 16,
    channelMode: "Dual-Channel (2x 8GB)",
    config: "2x 8GB DDR4-2666",
    model: "Kingston / Micron OEM DDR4",
    die: "Micron B-Die DDR4",
    frequencyMhz: 1333,
    fclkMhz: 1333,
    primaryTimings: "CL19-19-19-43",
    voltageV: 1.200,
    slotTopology: "Slot DIMM1 + DIMM2 (Dual-Channel Active)",
    isSingleChannel: false,
    slots: [
      { slot: "DIMM1", size: "8GB", status: "active", label: "DDR4" },
      { slot: "DIMM2", size: "8GB", status: "active", label: "DDR4" },
      { slot: "DIMM3", size: "Empty", status: "empty" },
      { slot: "DIMM4", size: "Empty", status: "empty" }
    ]
  },
  motherboard: {
    name: "Dell Inc. 0D02VH (Version A01)",
    chipset: "Intel B360 / Q370 Express",
    pcbLayers: "4-Layer Industrial PCB",
    agesaVersion: "Dell Inc. UEFI 2.18.0",
    biosVendor: "Dell Inc.",
    biosVersion: "2.18.0",
    biosDate: "2021-06-17",
    vrm: {
      phases: "4+1 Phase Discrete MOSFET",
      spsAmp: "45A Low-RDSon MOSFETs",
      tempC: 48.2,
      mosfetLoadPct: 40
    }
  },
  storage: {
    m2_1: {
      name: "Intel SSDSCKKW180H6 (180GB M.2)",
      lane: "M.2 SATA / PCIe Gen3 x4",
      speedRead: "540 MB/s",
      tempC: 36.0,
      healthPct: 98,
      isPopulated: true
    },
    m2_2: {
      name: "Toshiba DT01ACA100 (1TB 7.2k HDD)",
      lane: "SATA 6.0 Gb/s",
      speedRead: "185 MB/s",
      tempC: 34.0,
      healthPct: 100,
      isPopulated: true
    },
    m2_3: {
      isPopulated: false
    }
  },
  gpu: {
    name: "Intel(R) UHD Graphics 630 (iGPU)",
    isDiscrete: false,
    vram: "1024MB Shared System Memory",
    busWidth: "128-bit Dual-Channel Shared",
    pcieLink: "Direct Ring Bus / System Agent Link",
    rebarActive: false,
    tempC: 44.0,
    powerW: 12,
    driverVersion: "Simulated"
  },
  cooler: {
    name: "Dell OEM Copper Core Tower Cooler",
    type: "Air Cooler (4-Pin PWM)",
    pumpRpm: 0,
    fanRpm: 1250,
    coolantTempC: 38.0
  },
  psu: {
    name: "Dell Gold Bronze 260W 80 PLUS",
    rating: "80+ Bronze",
    ratedWattage: 260,
    currentLoadW: 88,
    loadPct: 33.8,
    rail12v: 12.04,
    zeroRpm: false
  },
  network: {
    name: "Realtek PCIe GbE Family Controller",
    band: "Gigabit Ethernet (1000Mbps)",
    linkSpeedMbps: 1000,
    pingMs: 2,
    rssi: "Wired RJ45",
    lanName: "Realtek RTL8111"
  },
  peripherals: [
    {
      id: "monitor",
      name: "Dell Full HD Work Display",
      type: "display",
      spec: "60Hz • 1080p",
      detail: "IPS 1920x1080 • DisplayPort 1.2",
      icon: "tv",
      active: true
    },
    {
      id: "mouse",
      name: "Standard USB Optical Mouse",
      type: "mouse",
      spec: "1000Hz Polling",
      detail: "1000 DPI • USB Direct",
      icon: "mouse",
      active: true
    },
    {
      id: "keyboard",
      name: "Standard USB Business Keyboard",
      type: "keyboard",
      spec: "Membrane USB",
      detail: "Full-Size 104 Keys • USB 2.0",
      icon: "keyboard",
      active: true
    },
    {
      id: "dac",
      name: "Realtek High Definition Audio",
      type: "audio",
      spec: "192kHz / 24-bit",
      detail: "Onboard ALC Audio Codec",
      icon: "headphones",
      active: true
    }
  ]
};

// 2. FULLY LOADED SIMULATOR RIG
export const fullRigTelemetry: HardwareTelemetryState = {
  telemetry: { mode: 'simulated', status: 'ready', capabilities: simulatedCapabilities() },
  hostName: "DESKTOP-TITAN-X",
  uptime: "04h 32m",
  busFrequencyHz: 1000,
  isLiveDetected: false,
  cpu: {
    name: "AMD Ryzen 7 7800X3D",
    cores: 8,
    threads: 16,
    cache: "96MB 3D V-Cache",
    avgClockMhz: 4850,
    maxClockMhz: 5050,
    currentLoadPct: 44,
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
    biosVendor: "MSI / AMI UEFI",
    biosVersion: "7D78v1J",
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
    powerW: 215,
    driverVersion: "Simulated"
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

// 3. MISSING COMPONENTS SIMULATOR RIG
export const missingRigTelemetry: HardwareTelemetryState = {
  ...fullRigTelemetry,
  isLiveDetected: false,
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
    powerW: 15,
    driverVersion: "Simulated"
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

// Inspector database
export const inspectorDatabase: Record<string, InspectorItem> = {
  mainboard: {
    id: "mainboard",
    title: "Motherboard & BIOS Firmware",
    badge: "UEFI FIRMWARE & VRM ROUTING",
    icon: "circuit-board",
    aiScore: "FIRMWARE: VERIFIED",
    aiText_EN: "System BIOS firmware and SMBIOS table registers are loaded securely in UEFI mode. Power distribution traces maintain clean signal integrity.",
    aiText_VI: "Firmware BIOS và bảng thanh ghi SMBIOS đã được tải bảo mật ở chế độ UEFI. Các đường mạch cấp nguồn VRM và bus PCIe duy trì độ ổn định cao.",
    specs: [
      { label: "BIOS Version", val: "SMBIOS 2.18.0 / UEFI" },
      { label: "Firmware Release", val: "2021-06-17 (Stable Release)" },
      { label: "PCIe Link Protocol", val: "PCIe Gen 3.0 / Direct CPU Link" },
      { label: "Power Delivery", val: "Regulated Multi-Phase VRM" }
    ],
    arch_EN: "Industrial-grade PCB substrate with multi-rail power distribution and UEFI firmware security.",
    arch_VI: "Bo mạch chủ công nghiệp tích hợp mạch cấp nguồn nhiều phase và firmware UEFI bảo mật."
  },
  cpu: {
    id: "cpu",
    title: "Processor Engine Micro-Architecture",
    badge: "SOCKET & CACHE REGISTERS",
    icon: "cpu",
    aiScore: "SILICON HEALTH: OPTIMAL",
    aiText_EN: "Processor core frequencies and VCore voltage registers operate within safe manufacturer thresholds. Thermal sensor telemetry indicates no thermal throttling.",
    aiText_VI: "Các thanh ghi điện áp VCore và xung nhịp của CPU hoạt động ổn định trong ngưỡng an toàn của nhà sản xuất. Cảm biến nhiệt độ duy trì tốt, không phát hiện hiện tượng giảm xung (thermal throttling).",
    specs: [
      { label: "Instruction Sets", val: "AVX2, SSE4.2, VT-x / AMD-V, AES-NI" },
      { label: "Power State", val: "C0 (Active C-State Package)" },
      { label: "Memory Controller", val: "Integrated Dual-Channel IMC" },
      { label: "Thermal Status", val: "Operating safely below TJMax" }
    ],
    arch_EN: "Host compute core architecture with high-efficiency branch predictor and hardware prefetchers.",
    arch_VI: "Kiến trúc nhân vi xử lý tích hợp bộ dự đoán nhánh lệnh hiệu suất cao và bộ đệm phần cứng."
  },
  ram: {
    id: "ram",
    title: "System Memory Bus & Timings",
    badge: "DIMM PHYSICAL TOPOLOGY",
    icon: "layers",
    aiScore: "MEMORY BUS: ACTIVE",
    aiText_EN: "Dual-channel topology maximizes theoretical bandwidth across physical DIMM slots.",
    aiText_VI: "Kiến trúc bộ nhớ kênh đôi Dual-Channel tối ưu hóa băng thông truyền dữ liệu giữa RAM và CPU.",
    specs: [
      { label: "Bus Mode", val: "Dual-Channel 128-bit Interleaved" },
      { label: "Signal Integrity", val: "Verified Clean Trace Routing" }
    ],
    arch_EN: "Synchronous memory bus interface delivering high throughput for multitasking.",
    arch_VI: "Giao tiếp bus bộ nhớ đồng bộ mang lại băng thông ổn định cho các tác vụ đa nhiệm."
  },
  gpu: {
    id: "gpu",
    title: "Graphics Processing & Display Engine",
    badge: "GPU SILICON REGISTERS",
    icon: "monitor",
    aiScore: "DISPLAY ADAPTER: READY",
    aiText_EN: "Display engine active for multi-monitor desktop acceleration and hardware decoding.",
    aiText_VI: "Bộ xử lý đồ họa kích hoạt sẵn sàng tăng tốc giải mã video phần cứng và xuất hình đa màn hình.",
    specs: [
      { label: "Hardware Decode", val: "H.264, HEVC / H.265, VP9" },
      { label: "Display Protocol", val: "DisplayPort / HDMI Native" }
    ],
    arch_EN: "Integrated rasterization and video decode acceleration engine.",
    arch_VI: "Nhân xử lý đồ họa rasterization và tăng tốc giải mã video trực tiếp từ phần cứng."
  }
};
