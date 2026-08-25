import type { HardwareTelemetryState, PersonaType } from '../types/hardware';

export function calculateHardwareSynergyScore(telemetry: HardwareTelemetryState, persona: PersonaType): {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  verdict: string;
} {
  const { cpu, ram, gpu, storage } = telemetry;

  // 1. CPU Score (0 - 100)
  let cpuScore = 50;
  const cpuLower = cpu.name.toLowerCase();
  if (cpuLower.includes('7800x3d') || cpuLower.includes('9800x3d') || cpuLower.includes('14900k') || cpuLower.includes('9950x')) {
    cpuScore = 99;
  } else if (cpuLower.includes('13700') || cpuLower.includes('14700') || cpuLower.includes('7700x') || cpuLower.includes('5800x3d')) {
    cpuScore = 90;
  } else if (cpuLower.includes('12400') || cpuLower.includes('13400') || cpuLower.includes('5600x') || cpuLower.includes('7500f')) {
    cpuScore = 78;
  } else if (cpuLower.includes('8400') || cpuLower.includes('8500') || cpuLower.includes('9400') || cpuLower.includes('3600')) {
    cpuScore = 52; // 6 Cores / 6 Threads 2018 architecture
  } else if (cpuLower.includes('i3') || cpu.cores <= 4) {
    cpuScore = 40;
  }

  // 2. GPU Score (0 - 100)
  let gpuScore = 25; // Default iGPU UHD / Shared
  if (gpu.isDiscrete) {
    const gpuLower = gpu.name.toLowerCase();
    if (gpuLower.includes('4090') || gpuLower.includes('4080') || gpuLower.includes('7900 xtx')) {
      gpuScore = 100;
    } else if (gpuLower.includes('4070 ti') || gpuLower.includes('4070') || gpuLower.includes('7800 xt')) {
      gpuScore = 95;
    } else if (gpuLower.includes('3060') || gpuLower.includes('4060') || gpuLower.includes('6700 xt') || gpuLower.includes('7600')) {
      gpuScore = 75;
    } else if (gpuLower.includes('1650') || gpuLower.includes('1050') || gpuLower.includes('rx 6400')) {
      gpuScore = 50;
    } else {
      gpuScore = 65;
    }
  }

  // 3. RAM Score (0 - 100)
  let ramScore = 70;
  if (ram.totalGb >= 32 && !ram.isSingleChannel) {
    ramScore = ram.frequencyMhz > 2500 ? 98 : 88;
  } else if (ram.totalGb >= 16 && !ram.isSingleChannel) {
    ramScore = ram.frequencyMhz > 2500 ? 86 : 74;
  } else if (ram.isSingleChannel) {
    ramScore = 42; // Heavy penalty for single channel
  } else {
    ramScore = 48;
  }

  // 4. Storage Score (0 - 100)
  let storageScore = 45;
  const speed = parseInt(storage.m2_1.speedRead.replace(/\\D/g, '')) || 540;
  if (speed > 5000) {
    storageScore = 98; // Gen4 NVMe
  } else if (speed > 2500) {
    storageScore = 82; // Gen3 NVMe
  } else if (speed > 1000) {
    storageScore = 68;
  } else {
    storageScore = 45; // SATA SSD (~540 MB/s)
  }

  // Weighted Persona Calculations
  let finalScore = 50;
  switch (persona) {
    case 'dev': {
      // Dev prioritizes CPU (35%) + RAM (35%) + Storage (15%) + GPU (15%)
      finalScore = cpuScore * 0.35 + ramScore * 0.35 + storageScore * 0.15 + gpuScore * 0.15;
      break;
    }
    case 'creator': {
      // Creator prioritizes GPU (45%) + CPU (30%) + RAM (15%) + Storage (10%)
      finalScore = gpuScore * 0.45 + cpuScore * 0.30 + ramScore * 0.15 + storageScore * 0.10;
      break;
    }
    case 'esports': {
      // Esports prioritizes GPU (50%) + CPU (30%) + RAM (15%) + Storage (5%)
      finalScore = gpuScore * 0.50 + cpuScore * 0.30 + ramScore * 0.15 + storageScore * 0.05;
      break;
    }
    case 'silent': {
      // AI Lab prioritizes GPU VRAM / Tensor (55%) + CPU (25%) + RAM (15%) + Storage (5%)
      finalScore = gpuScore * 0.55 + cpuScore * 0.25 + ramScore * 0.15 + storageScore * 0.05;
      break;
    }
  }

  const rounded = Math.min(99, Math.max(20, Math.round(finalScore)));
  let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
  let verdict = '';

  if (rounded >= 90) {
    grade = 'S';
    verdict = 'Cấu hình cao cấp Flagship, cân mượt mà 100% mọi tác vụ chuyên sâu.';
  } else if (rounded >= 75) {
    grade = 'A';
    verdict = 'Cấu hình cận cao cấp rất mạnh, đáp ứng xuất sắc đa số nhu cầu.';
  } else if (rounded >= 60) {
    grade = 'B';
    verdict = 'Cấu hình tầm trung đủ dùng, đáp ứng tốt tác vụ thường nhật.';
  } else if (rounded >= 45) {
    grade = 'C';
    verdict = 'Cấu hình phổ thông cơ bản (Đời cũ), phù hợp tác vụ văn phòng và code nhẹ.';
  } else {
    grade = 'D';
    verdict = 'Cấu hình bị nghẽn phần cứng rõ rệt, cần nâng cấp để cải thiện hiệu năng.';
  }

  return { score: rounded, grade, verdict };
}
