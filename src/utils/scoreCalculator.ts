import type {
  HardwareScore,
  HardwareTelemetryState,
  PersonaType,
  ScoreFactor,
  ScoreFactorId,
} from '../types/hardware'

const PERSONA_WEIGHTS: Record<PersonaType, Record<ScoreFactorId, number>> = {
  dev: { cpu: 0.35, ram: 0.35, gpu: 0.15, storage: 0.15 },
  creator: { cpu: 0.3, ram: 0.15, gpu: 0.45, storage: 0.1 },
  esports: { cpu: 0.3, ram: 0.15, gpu: 0.5, storage: 0.05 },
  silent: { cpu: 0.25, ram: 0.15, gpu: 0.55, storage: 0.05 },
}

const unavailableFactor = (id: ScoreFactorId, weight: number, reason: string): ScoreFactor => ({
  id,
  score: null,
  weight,
  available: false,
  reason,
})

const availableFactor = (id: ScoreFactorId, weight: number, score: number, reason: string): ScoreFactor => ({
  id,
  score,
  weight,
  available: true,
  reason,
})

function scoreCpu(telemetry: HardwareTelemetryState, weight: number): ScoreFactor {
  const { cpu } = telemetry
  if (!telemetry.telemetry.capabilities.cpuIdentity || !cpu.name || cpu.name === 'Unknown') {
    return unavailableFactor('cpu', weight, 'CPU identity is not available from this telemetry source.')
  }

  const name = cpu.name.toLowerCase()
  if (['7800x3d', '9800x3d', '14900k', '9950x'].some((model) => name.includes(model))) {
    return availableFactor('cpu', weight, 99, 'Flagship desktop CPU matched the X3D / Core i9 performance tier.')
  }
  if (['13700', '14700', '7700x', '5800x3d'].some((model) => name.includes(model))) {
    return availableFactor('cpu', weight, 90, 'High-end desktop CPU matched the modern Core i7 / Ryzen 7 tier.')
  }
  if (['12400', '13400', '5600x', '7500f'].some((model) => name.includes(model))) {
    return availableFactor('cpu', weight, 78, 'Mainstream desktop CPU matched a modern six-core performance tier.')
  }
  if (['8400', '8500', '9400', '3600'].some((model) => name.includes(model))) {
    return availableFactor('cpu', weight, 52, 'Older six-core CPU matched the established midrange tier.')
  }
  if (name.includes('i3') || (cpu.cores > 0 && cpu.cores <= 4)) {
    return availableFactor('cpu', weight, 40, 'Entry CPU tier detected from its model or physical core count.')
  }
  return availableFactor('cpu', weight, 50, 'CPU identity was detected but did not match a calibrated model tier.')
}

function scoreRam(telemetry: HardwareTelemetryState, weight: number): ScoreFactor {
  const { ram } = telemetry
  const hasTopology = ram.channelMode !== 'Unknown' && ram.totalGb > 0
  if (!telemetry.telemetry.capabilities.ramIdentity || !hasTopology) {
    return unavailableFactor('ram', weight, 'RAM capacity and channel topology are not both available.')
  }

  if (ram.totalGb >= 32 && !ram.isSingleChannel) {
    return ram.frequencyMhz > 2500
      ? availableFactor('ram', weight, 98, 'At least 32GB of high-speed dual-channel memory is active.')
      : availableFactor('ram', weight, 88, 'At least 32GB of dual-channel memory is active.')
  }
  if (ram.totalGb >= 16 && !ram.isSingleChannel) {
    return ram.frequencyMhz > 2500
      ? availableFactor('ram', weight, 86, 'At least 16GB of high-speed dual-channel memory is active.')
      : availableFactor('ram', weight, 74, 'At least 16GB of dual-channel memory is active.')
  }
  if (ram.isSingleChannel) {
    return availableFactor('ram', weight, 42, 'Single-channel topology limits memory bandwidth.')
  }
  return availableFactor('ram', weight, 48, 'Detected memory capacity is below the calibrated 16GB tier.')
}

function scoreGpu(telemetry: HardwareTelemetryState, weight: number): ScoreFactor {
  const { gpu } = telemetry
  if (!telemetry.telemetry.capabilities.gpuIdentity || !gpu.name || gpu.name === 'Unknown') {
    return unavailableFactor('gpu', weight, 'GPU identity is not available from this telemetry source.')
  }
  if (!gpu.isDiscrete) {
    return availableFactor('gpu', weight, 25, 'Integrated graphics shares system memory and has no discrete GPU tier.')
  }

  const name = gpu.name.toLowerCase()
  if (['4090', '4080', '7900 xtx'].some((model) => name.includes(model))) {
    return availableFactor('gpu', weight, 100, 'Flagship discrete GPU matched the RTX 4080 / RX 7900 XTX tier.')
  }
  if (['4070 ti', '4070', '7800 xt'].some((model) => name.includes(model))) {
    return availableFactor('gpu', weight, 95, 'Enthusiast discrete GPU matched the RTX 4070 / RX 7800 tier.')
  }
  if (['3060', '4060', '6700 xt', '7600'].some((model) => name.includes(model))) {
    return availableFactor('gpu', weight, 75, 'Mainstream discrete GPU matched the RTX 3060 / RX 7600 tier.')
  }
  if (['1650', '1050', 'rx 6400'].some((model) => name.includes(model))) {
    return availableFactor('gpu', weight, 50, 'Entry discrete GPU matched an older 1080p tier.')
  }
  return availableFactor('gpu', weight, 65, 'Discrete GPU detected without a calibrated model-tier match.')
}

function readThroughput(value: string): number | null {
  if (!value || value === 'Unknown' || value === '--') return null
  const parsed = Number(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function scoreStorage(telemetry: HardwareTelemetryState, weight: number): ScoreFactor {
  const throughput = readThroughput(telemetry.storage.m2_1.speedRead)
  if (!telemetry.telemetry.capabilities.storageIdentity || !telemetry.storage.m2_1.isPopulated || throughput === null) {
    return unavailableFactor('storage', weight, 'Detected storage throughput is not available.')
  }
  if (throughput > 5000) {
    return availableFactor('storage', weight, 98, 'Primary storage throughput matches a high-end PCIe 4.0 NVMe drive.')
  }
  if (throughput > 2500) {
    return availableFactor('storage', weight, 82, 'Primary storage throughput matches a PCIe 3.0 NVMe drive.')
  }
  if (throughput > 1000) {
    return availableFactor('storage', weight, 68, 'Primary storage is faster than SATA but below the calibrated NVMe tier.')
  }
  return availableFactor('storage', weight, 45, 'Primary storage throughput is in the SATA-class tier.')
}

function gradeFor(score: number): HardwareScore['grade'] {
  if (score >= 90) return 'S'
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  if (score >= 45) return 'C'
  return 'D'
}

function verdictFor(score: number): string {
  if (score >= 90) return 'Excellent balance for demanding workloads.'
  if (score >= 75) return 'Strong balance for most advanced workloads.'
  if (score >= 60) return 'Balanced midrange hardware for everyday work.'
  if (score >= 45) return 'Usable baseline with clear upgrade opportunities.'
  return 'Major component bottlenecks should be addressed first.'
}

export function calculateHardwareSynergyScore(
  telemetry: HardwareTelemetryState,
  persona: PersonaType,
): HardwareScore {
  const weights = PERSONA_WEIGHTS[persona]
  const factors = [
    scoreCpu(telemetry, weights.cpu),
    scoreRam(telemetry, weights.ram),
    scoreGpu(telemetry, weights.gpu),
    scoreStorage(telemetry, weights.storage),
  ]
  const available = factors.filter(
    (factor): factor is ScoreFactor & { score: number } => factor.available && factor.score !== null,
  )
  const confidence: HardwareScore['confidence'] = available.length === 4
    ? 'high'
    : available.length === 3
      ? 'medium'
      : 'low'

  if (available.length < 2) {
    return {
      score: null,
      grade: '—',
      verdict: 'More detected data is required before AeroSpec can calculate a reliable score.',
      confidence,
      factors,
    }
  }

  const availableWeight = available.reduce((sum, factor) => sum + factor.weight, 0)
  const weightedScore = available.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / availableWeight
  const score = Math.min(99, Math.max(20, Math.round(weightedScore)))

  return {
    score,
    grade: gradeFor(score),
    verdict: verdictFor(score),
    confidence,
    factors,
  }
}

export function getPriorityFactors(score: HardwareScore): ScoreFactor[] {
  return score.factors
    .filter((factor): factor is ScoreFactor & { score: number } => factor.available && factor.score !== null)
    .toSorted((left, right) => {
      const rightOpportunity = (100 - right.score) * right.weight
      const leftOpportunity = (100 - left.score) * left.weight
      return rightOpportunity - leftOpportunity
    })
}
