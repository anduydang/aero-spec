import type { HardwareTelemetryState, InspectorItem, LanguageType, PersonaType } from '../types/hardware';

export function getDynamicInspectorItem(
  id: string,
  telemetry: HardwareTelemetryState,
  _lang: LanguageType,
  _persona: PersonaType
): InspectorItem {
  const { cpu, ram, motherboard, storage, gpu, cooler, psu, network, peripherals } = telemetry;
  const isIntel = cpu.name.toLowerCase().includes('intel');

  switch (id) {
    case 'cpu': {
      return {
        id: 'cpu',
        title: cpu.name,
        badge: isIntel ? 'INTEL COFFEE LAKE • 14NM' : 'AMD ZEN 4 • 5NM TSMC',
        icon: 'cpu',
        aiScore: `SILICON SCORE: ${cpu.tempC < 70 ? '98/100' : '85/100'}`,
        aiText_EN: isIntel
          ? `Intel Core i5-8400 (6C/6T) operating at ${cpu.avgClockMhz} MHz with ${cpu.vcoreV}V VCore. Thermal output is well-managed at ${cpu.tempC}°C under ${cpu.powerW}W load. Hardware registers show zero thermal throttling.`
          : `AMD Ryzen 7 7800X3D running with Curve Optimizer ${cpu.curveOptimizer} at ${cpu.vcoreV}V VCore. 96MB 3D V-Cache eliminates memory latency penalties for both gaming and code compilation.`,
        aiText_VI: isIntel
          ? `CPU Intel Core i5-8400 (6 nhân / 6 luồng) đang chạy ở mức xung ${cpu.avgClockMhz} MHz, điện áp VCore ${cpu.vcoreV}V. Nhiệt độ duy trì mát mẻ ${cpu.tempC}°C với công suất tiêu thụ ${cpu.powerW}W. Không phát hiện hiện tượng giảm xung.`
          : `CPU AMD Ryzen 7 7800X3D đang chạy thiết lập Curve Optimizer ${cpu.curveOptimizer} ở điện áp ${cpu.vcoreV}V. Bộ đệm 96MB 3D V-Cache triệt tiêu độ trễ truy xuất dữ liệu, tối ưu hiệu năng chơi game và lập trình.`,
        specs: [
          { label: 'Cores & Threads', val: `${cpu.cores} Physical Cores / ${cpu.threads} Threads` },
          { label: 'Clock Frequency', val: `${cpu.avgClockMhz} MHz (Max: ${cpu.maxClockMhz} MHz)` },
          { label: 'VCore Voltage', val: `${cpu.vcoreV.toFixed(3)} V` },
          { label: 'Cache Hierarchy', val: cpu.cache },
          { label: 'Package Power Draw', val: `${cpu.powerW.toFixed(1)} W (TDP Limit: ${cpu.tdpLimitW} W)` },
          { label: 'Core Thermals', val: `${cpu.tempC}°C (TJMax: ${cpu.tjMaxC}°C)` },
          { label: 'Curve Optimizer / Stepping', val: cpu.curveOptimizer },
          { label: 'Compute Architecture', val: isIntel ? 'Intel x86-64 Coffee Lake (14nm)' : 'AMD Zen 4 Raphael TSMC (5nm + 6nm IOD)' }
        ],
        arch_EN: isIntel
          ? 'Intel 8th Generation Coffee Lake microarchitecture featuring dedicated Ring Bus interconnect between 6 execution cores, 9MB Smart Cache, and integrated Gen 9.5 GPU.'
          : 'Zen 4 microarchitecture combined with TSMC direct-bonded 3D V-Cache across TSVs providing >2.5 TB/s bandwidth between L3 cache and core compute dies.',
        arch_VI: isIntel
          ? 'Vi kiến trúc Intel thế hệ 8 Coffee Lake kết hợp đường truyền Ring Bus tốc độ cao liên kết 6 nhân xử lý, bộ nhớ đệm 9MB Smart Cache và nhân đồ họa tích hợp Gen 9.5.'
          : 'Vi kiến trúc Zen 4 kết hợp công nghệ xếp chồng bộ nhớ đệm TSMC 3D V-Cache qua liên kết TSV cho băng thông vượt mức 2.5 TB/s giữa L3 cache và các nhân xử lý.'
      };
    }

    case 'ram': {
      return {
        id: 'ram',
        title: `${ram.totalGb}GB ${ram.channelMode}`,
        badge: ram.isSingleChannel ? 'SINGLE-CHANNEL WARNING' : 'DUAL-CHANNEL ACTIVE',
        icon: 'layers',
        aiScore: ram.isSingleChannel ? 'MEMORY BUS: 68/100 (HALVED)' : 'MEMORY BUS: 99/100 (OPTIMAL)',
        aiText_EN: ram.isSingleChannel
          ? `Single-channel configuration detected. Memory operates on a single 32/64-bit channel, reducing memory throughput by 50% and causing ~18% CPU IPC loss in memory-bound tasks. Recommend adding a 2nd stick.`
          : `Dual-channel configuration confirmed (${ram.config}). Operating stably at ${ram.frequencyMhz} MHz with timings ${ram.primaryTimings}. Full bus bandwidth available to CPU and integrated graphics.`,
        aiText_VI: ram.isSingleChannel
          ? `Phát hiện hệ thống chỉ chạy RAM Single-Channel 1 thanh. Băng thông bộ nhớ bị giảm một nửa, gây tụt khoảng 18% hiệu năng CPU trong các tác vụ nặng. Khuyến nghị cắm thêm thanh RAM thứ 2.`
          : `Cấu hình RAM kênh đôi Dual-Channel kích hoạt hoàn chỉnh (${ram.config}). Hoạt động ổn định ở xung nhịp ${ram.frequencyMhz} MHz, thông số ${ram.primaryTimings}, cung cấp đầy đủ băng thông cho CPU.`,
        specs: [
          { label: 'Installed Capacity', val: `${ram.totalGb} GB Total System Memory` },
          { label: 'Channel Mode', val: ram.channelMode },
          { label: 'Configuration & Model', val: `${ram.model} (${ram.config})` },
          { label: 'Memory Silicon Die', val: ram.die },
          { label: 'Primary Timings', val: ram.primaryTimings },
          { label: 'Frequency / Fabric', val: `${ram.frequencyMhz} MHz / FCLK: ${ram.fclkMhz} MHz` },
          { label: 'Operating Voltage', val: `${ram.voltageV.toFixed(2)} V` },
          { label: 'Physical Slot Topology', val: ram.slotTopology }
        ],
        arch_EN: 'Multi-channel DDR SDRAM architecture with dedicated memory controllers ensuring high bandwidth and low latency pipelining.',
        arch_VI: 'Kiến trúc bộ nhớ DDR đa kênh với bộ điều khiển tích hợp IMC, tối ưu luồng truyền dữ liệu giữa RAM và các nhân CPU.'
      };
    }

    case 'mainboard': {
      return {
        id: 'mainboard',
        title: motherboard.name,
        badge: `BIOS: ${motherboard.biosVersion}`,
        icon: 'circuit-board',
        aiScore: 'FIRMWARE & BOARD: 96/100',
        aiText_EN: `Motherboard ${motherboard.name} operating with BIOS version ${motherboard.biosVersion} (Release: ${motherboard.biosDate}). Multi-layer PCB traces and VRM power distribution operate stably.`,
        aiText_VI: `Bo mạch chủ ${motherboard.name} đang chạy phiên bản BIOS ${motherboard.biosVersion} (Ngày phát hành: ${motherboard.biosDate}). Đường mạch PCB và hệ thống cấp điện VRM duy trì tính ổn định cao.`,
        specs: [
          { label: 'Motherboard Model', val: motherboard.name },
          { label: 'Chipset Platform', val: motherboard.chipset },
          { label: 'BIOS / Firmware Version', val: motherboard.biosVersion },
          { label: 'BIOS Release Date', val: motherboard.biosDate },
          { label: 'Firmware Vendor', val: motherboard.biosVendor || 'OEM / UEFI' },
          { label: 'PCB Substrate Layering', val: motherboard.pcbLayers },
          { label: 'VRM Power Stages', val: motherboard.vrm.phases },
          { label: 'VRM Current Rating', val: motherboard.vrm.spsAmp }
        ],
        arch_EN: 'High-density motherboard PCB substrate designed for low crosstalk signal integrity, clean ground planes, and stable PCIe / DDR trace impedance matching.',
        arch_VI: 'Mạch in PCB mật độ cao tối ưu trở kháng đường truyền PCIe và bus bộ nhớ, giảm nhiễu tín hiệu chéo giữa các linh kiện phần cứng.'
      };
    }

    case 'vrm': {
      return {
        id: 'vrm',
        title: `Voltage Regulator Module (${motherboard.vrm.phases})`,
        badge: `${motherboard.vrm.tempC}°C • LOAD: ${motherboard.vrm.mosfetLoadPct}%`,
        icon: 'shield',
        aiScore: motherboard.vrm.tempC < 65 ? 'VRM EFFICIENCY: 98/100' : 'VRM EFFICIENCY: 82/100',
        aiText_EN: `Power delivery VRM operating at ${motherboard.vrm.tempC}°C under ${motherboard.vrm.mosfetLoadPct}% load. Power stages supply clean, ripple-free VCore current to the processor.`,
        aiText_VI: `Khối cấp nguồn VRM đang hoạt động ở nhiệt độ ${motherboard.vrm.tempC}°C với mức tải ${motherboard.vrm.mosfetLoadPct}%. Dàn MOSFET cung cấp dòng điện ổn định, triệt tiêu xung nhiễu điện áp cho CPU.`,
        specs: [
          { label: 'Phase Configuration', val: motherboard.vrm.phases },
          { label: 'Power Stage Rating', val: motherboard.vrm.spsAmp },
          { label: 'Current MOSFET Temp', val: `${motherboard.vrm.tempC} °C` },
          { label: 'Calculated VRM Load', val: `${motherboard.vrm.mosfetLoadPct} %` },
          { label: 'PWM Switching Frequency', val: '500 kHz Digital Controller' },
          { label: 'Inductor Chokes', val: 'Alloy Core High-Permeability Chokes' }
        ],
        arch_EN: 'Synchronous buck converter topology utilizing smart power stages with integrated driver ICs and MOSFETs for ultra-low switching losses.',
        arch_VI: 'Mạch biến đổi xung đồng bộ PWM kết hợp IC điều khiển và MOSFET điện trở thấp giúp giảm tổn hao điện năng và tỏa nhiệt tối thiểu.'
      };
    }

    case 'gpu': {
      return {
        id: 'gpu',
        title: gpu.name,
        badge: gpu.isDiscrete ? 'DISCRETE PCIE GPU' : 'INTEGRATED GRAPHICS (iGPU)',
        icon: 'monitor',
        aiScore: gpu.isDiscrete ? 'GPU POWER: 97/100' : 'DISPLAY ENGINE: 72/100',
        aiText_EN: gpu.isDiscrete
          ? `${gpu.name} with ${gpu.vram} operating on ${gpu.pcieLink}. ReBAR is ${gpu.rebarActive ? 'Active' : 'Disabled'}. Excellent 1440p/4K rendering and gaming throughput.`
          : `${gpu.name} active for display acceleration and hardware video decoding via ${gpu.pcieLink}. Uses system memory for frame buffer.`,
        aiText_VI: gpu.isDiscrete
          ? `Card đồ họa ${gpu.name} với ${gpu.vram} đang chạy trên giao tiếp ${gpu.pcieLink}. Tính năng ReBAR ${gpu.rebarActive ? 'Đang Bật' : 'Chưa Bật'}. Hiệu năng xử lý đồ họa và render 3D vượt trội.`
          : `Nhân đồ họa tích hợp ${gpu.name} đảm nhiệm xuất hình và tăng tốc giải mã video phần cứng qua ${gpu.pcieLink}. Sử dụng bộ nhớ RAM hệ thống chia sẻ làm bộ đệm khung hình.`,
        specs: [
          { label: 'Graphics Processor', val: gpu.name },
          { label: 'VRAM Frame Buffer', val: gpu.vram },
          { label: 'Memory Bus Width', val: gpu.busWidth },
          { label: 'Host Interconnect', val: gpu.pcieLink },
          { label: 'Resizable BAR / SAM', val: gpu.rebarActive ? 'Enabled (Full VRAM Direct Access)' : 'Shared System Buffer' },
          { label: 'Current GPU Temp', val: `${gpu.tempC} °C` },
          { label: 'Board Power Draw', val: `${gpu.powerW} W` },
          { label: 'Hardware Acceleration', val: 'DirectX 12, Vulkan 1.3, OpenGL 4.6, QuickSync/NVENC' }
        ],
        arch_EN: 'Parallel compute graphics architecture with raster engines, tensor/ray-tracing or fixed-function media decoding units.',
        arch_VI: 'Kiến trúc tính toán song song với các đơn vị xử lý đổ bóng đồ họa và khối giải mã media phần cứng chuyên dụng.'
      };
    }

    case 'nvme1': {
      const disk = storage.m2_1;
      return {
        id: 'nvme1',
        title: disk.name,
        badge: `${disk.speedRead} • HEALTH: ${disk.healthPct}%`,
        icon: 'hard-drive',
        aiScore: `DRIVE HEALTH: ${disk.healthPct}%`,
        aiText_EN: `Primary drive ${disk.name} running on ${disk.lane} at ${disk.speedRead} sequential read speed. Drive operating at a cool ${disk.tempC}°C with ${disk.healthPct}% SMART health.`,
        aiText_VI: `Ổ đĩa chính ${disk.name} chạy qua giao thức ${disk.lane} đạt tốc độ đọc ${disk.speedRead}. Nhiệt độ duy trì ${disk.tempC}°C, tình trạng sức khỏe SMART đạt ${disk.healthPct}%.`,
        specs: [
          { label: 'Drive Model', val: disk.name },
          { label: 'Interface Protocol', val: disk.lane },
          { label: 'Sequential Read Speed', val: disk.speedRead },
          { label: 'Operating Temperature', val: `${disk.tempC} °C` },
          { label: 'SMART Health Rating', val: `${disk.healthPct} % (Healthy)` },
          { label: 'TRIM & Garbage Collection', val: 'Active Background Optimization' }
        ],
        arch_EN: 'Solid-state storage architecture with multi-channel flash controller and wear-leveling firmware for rapid OS boot and project loading.',
        arch_VI: 'Kiến trúc lưu trữ thể rắn với bộ điều khiển flash nhiều kênh và cơ chế dàn đều hao mòn wear-leveling giúp khởi động hệ điều hành tức thì.'
      };
    }

    case 'nvme2': {
      const disk = storage.m2_2;
      return {
        id: 'nvme2',
        title: disk.isPopulated ? disk.name : 'Secondary Storage Bay [Empty]',
        badge: disk.isPopulated ? `${disk.speedRead} • ${disk.tempC}°C` : 'BAY AVAILABLE FOR EXPANSION',
        icon: 'hard-drive',
        aiScore: disk.isPopulated ? `DRIVE HEALTH: ${disk.healthPct}%` : 'EXPANSION: READY',
        aiText_EN: disk.isPopulated
          ? `Secondary drive ${disk.name} running on ${disk.lane} at ${disk.speedRead}. Provides auxiliary storage for projects and media.`
          : 'Storage slot is currently unpopulated and ready for high-speed NVMe or SATA expansion.',
        aiText_VI: disk.isPopulated
          ? `Ổ đĩa thứ 2 ${disk.name} chạy trên giao tiếp ${disk.lane} với tốc độ ${disk.speedRead}. Đảm nhiệm lưu trữ dữ liệu dự án và backup.`
          : 'Khe cắm ổ đĩa đang để trống, sẵn sàng nâng cấp thêm ổ SSD NVMe hoặc SATA tốc độ cao.',
        specs: [
          { label: 'Drive Model', val: disk.isPopulated ? disk.name : 'No drive installed' },
          { label: 'Bus Interface', val: disk.lane },
          { label: 'Read Speed', val: disk.speedRead },
          { label: 'Operating Temperature', val: disk.isPopulated ? `${disk.tempC} °C` : '--' },
          { label: 'Drive Status', val: disk.isPopulated ? 'Active Storage Pool' : 'Empty Expansion Bay' }
        ],
        arch_EN: 'Auxiliary storage interface connected via PCH chipset or SATA bus lanes.',
        arch_VI: 'Giao tiếp lưu trữ phụ trợ kết nối trực tiếp qua chipset cầu nam PCH hoặc đường truyền SATA.'
      };
    }

    case 'cooler': {
      return {
        id: 'cooler',
        title: cooler.name,
        badge: `${cooler.type} • ${cooler.coolantTempC}°C`,
        icon: 'fan',
        aiScore: 'THERMAL HEADROOM: 98/100',
        aiText_EN: `${cooler.name} maintains CPU operating temperatures well below thermal limits. Fan speed currently at ${cooler.fanRpm} RPM for quiet operation.`,
        aiText_VI: `Hệ thống làm mát ${cooler.name} giữ nhiệt độ CPU luôn dưới ngưỡng an toàn. Tốc độ quạt đang ở mức ${cooler.fanRpm} RPM đảm bảo độ êm ái khi làm việc.`,
        specs: [
          { label: 'Cooler Model', val: cooler.name },
          { label: 'Cooling Technology', val: cooler.type },
          { label: 'Fan Rotation Speed', val: `${cooler.fanRpm} RPM (PWM Regulated)` },
          { label: 'Pump Speed', val: cooler.pumpRpm > 0 ? `${cooler.pumpRpm} RPM` : 'N/A (Air Tower)' },
          { label: 'Coolant / Heatsink Temp', val: `${cooler.coolantTempC} °C` }
        ],
        arch_EN: 'High surface area thermal dissipation fin stack with direct copper heatpipes or closed-loop liquid coolant circulation.',
        arch_VI: 'Khối lá tản nhiệt bề mặt lớn kết hợp ống đồng dẫn nhiệt trực tiếp giúp giải tỏa nhiệt lượng nhanh chóng.'
      };
    }

    case 'psu': {
      return {
        id: 'psu',
        title: psu.name,
        badge: `${psu.rating} • ${psu.ratedWattage}W`,
        icon: 'zap',
        aiScore: 'POWER DELIVERY: 99/100',
        aiText_EN: `Power supply operating at ${psu.currentLoadW}W (${psu.loadPct.toFixed(1)}% load), within its peak efficiency band. +12V rail voltage holds rock-solid at ${psu.rail12v.toFixed(2)}V.`,
        aiText_VI: `Bộ nguồn đang gánh tải ${psu.currentLoadW}W (${psu.loadPct.toFixed(1)}% tải định mức), nằm trong vùng hiệu suất tối ưu. Đường điện +12V duy trì ổn định tuyệt đối ở mức ${psu.rail12v.toFixed(2)}V.`,
        specs: [
          { label: 'Power Supply Unit', val: psu.name },
          { label: '80 PLUS Efficiency Rating', val: psu.rating },
          { label: 'Continuous Output Wattage', val: `${psu.ratedWattage} Watts` },
          { label: 'Real-Time System Draw', val: `${psu.currentLoadW} Watts (${psu.loadPct.toFixed(1)}% Load)` },
          { label: '+12V Main Rail Voltage', val: `${psu.rail12v.toFixed(2)} V (ATX Spec: 12.00V ±5%)` },
          { label: 'Thermal Fan Mode', val: psu.zeroRpm ? 'Zero-RPM Smart Silent Mode' : 'Continuous Silent Bearing Fan' }
        ],
        arch_EN: 'High-grade LLC resonant topology with DC-to-DC converters and Japanese solid capacitors for ripple suppression.',
        arch_VI: 'Kiến trúc nguồn cộng hưởng LLC kết hợp mạch chuyển đổi DC-DC và tụ điện chất lượng cao triệt tiêu độ gợn sóng điện áp.'
      };
    }

    case 'network': {
      return {
        id: 'network',
        title: network.name,
        badge: `${network.linkSpeedMbps.toLocaleString()} Mbps • ${network.pingMs}ms PING`,
        icon: 'wifi',
        aiScore: 'NETWORK LATENCY: 99/100',
        aiText_EN: `${network.name} connected at ${network.linkSpeedMbps.toLocaleString()} Mbps on ${network.band} with ${network.pingMs}ms ping. Packet transmission is lossless.`,
        aiText_VI: `Card mạng ${network.name} kết nối ở tốc độ ${network.linkSpeedMbps.toLocaleString()} Mbps băng tần ${network.band} với độ trễ ping ${network.pingMs}ms. Không có hiện tượng mất gói tin.`,
        specs: [
          { label: 'Network Controller', val: network.name },
          { label: 'Connection Band / Type', val: network.band },
          { label: 'Theoretical Link Speed', val: `${network.linkSpeedMbps.toLocaleString()} Mbps` },
          { label: 'Gateway Latency', val: `${network.pingMs} ms Ping` },
          { label: 'Signal / Medium', val: network.rssi },
          { label: 'Hardware Controller Chip', val: network.lanName }
        ],
        arch_EN: 'High-throughput network adapter with hardware checksum offloading, interrupt moderation, and low-latency packet scheduling.',
        arch_VI: 'Bộ điều khiển mạng hiệu năng cao hỗ trợ xử lý checksum phần cứng và giảm tải CPU khi truyền dữ liệu băng thông lớn.'
      };
    }

    default: {
      // Check peripherals
      const foundPeri = peripherals.find(p => p.id === id);
      if (foundPeri) {
        return {
          id: foundPeri.id,
          title: foundPeri.name,
          badge: foundPeri.spec,
          icon: foundPeri.icon,
          aiScore: 'PERIPHERAL: ACTIVE',
          aiText_EN: `${foundPeri.name} (${foundPeri.detail}) connected via high-speed USB interface with verified zero polling loss.`,
          aiText_VI: `Thiết bị ngoại vi ${foundPeri.name} (${foundPeri.detail}) kết nối trực tiếp qua cổng USB với tốc độ phản hồi tối ưu.`,
          specs: [
            { label: 'Device Name', val: foundPeri.name },
            { label: 'Hardware Spec', val: foundPeri.spec },
            { label: 'Interface & Detail', val: foundPeri.detail },
            { label: 'Device Status', val: 'Active & Responsive' }
          ],
          arch_EN: 'Direct USB human interface device (HID) with real-time polling.',
          arch_VI: 'Thiết bị ngoại vi chuẩn giao tiếp USB HID với tần số lấy mẫu tín hiệu trực tiếp.'
        };
      }

      // Default fallback to CPU
      return getDynamicInspectorItem('cpu', telemetry, _lang, _persona);
    }
  }
}
