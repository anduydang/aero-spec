import type { HardwareScore, HardwareTelemetryState } from '../types/hardware'

const known = (value: string) => Boolean(value && value !== 'Unknown' && value !== '--')

export function buildAdvisorContext(
  telemetry: HardwareTelemetryState,
  score: HardwareScore,
): string {
  const { capabilities } = telemetry.telemetry
  const lines = [
    `Data source: ${telemetry.telemetry.mode === 'simulated' ? 'SIMULATED PROFILE' : 'LIVE HARDWARE'}`,
    `Detection status: ${telemetry.telemetry.status}`,
    score.score === null
      ? `Hardware score: unavailable (${score.confidence} confidence)`
      : `Hardware score: ${score.score}/100 (Grade ${score.grade}, ${score.confidence} confidence)`,
  ]

  if (capabilities.cpuIdentity) {
    const topology = telemetry.cpu.cores > 0 && telemetry.cpu.threads > 0
      ? ` (${telemetry.cpu.cores}C/${telemetry.cpu.threads}T)`
      : ''
    lines.push(`CPU: ${telemetry.cpu.name}${topology}`)
  }
  if (capabilities.cpuLoad) {
    lines.push(`CPU load: ${telemetry.cpu.currentLoadPct}%`)
  }
  if (capabilities.cpuSensors) {
    lines.push(`CPU temperature: ${telemetry.cpu.tempC}°C`)
    lines.push(`CPU package power: ${telemetry.cpu.powerW}W`)
  }
  if (capabilities.ramIdentity) {
    lines.push(`RAM: ${telemetry.ram.totalGb}GB ${telemetry.ram.channelMode}`)
  }
  if (capabilities.ramTimings) {
    lines.push(`RAM configuration: ${telemetry.ram.config}; timings ${telemetry.ram.primaryTimings}`)
  }
  if (capabilities.motherboardIdentity) {
    const bios = known(telemetry.motherboard.biosVersion)
      ? `; BIOS ${telemetry.motherboard.biosVersion}`
      : ''
    lines.push(`Motherboard: ${telemetry.motherboard.name}${bios}`)
  }
  if (capabilities.motherboardSensors) {
    lines.push(`VRM temperature: ${telemetry.motherboard.vrm.tempC}°C`)
  }
  if (capabilities.gpuIdentity) {
    const vram = known(telemetry.gpu.vram) ? `${telemetry.gpu.vram}, ` : ''
    lines.push(`GPU: ${telemetry.gpu.name} (${vram}${telemetry.gpu.isDiscrete ? 'discrete' : 'integrated'})`)
  }
  if (capabilities.gpuSensors) {
    lines.push(`GPU temperature: ${telemetry.gpu.tempC}°C; power ${telemetry.gpu.powerW}W`)
  }
  if (capabilities.storageIdentity) {
    const drives = telemetry.storage.devices?.length
      ? telemetry.storage.devices
        .filter((drive) => known(drive.name))
        .map((drive) => `${drive.name} (${drive.capacityLabel})`)
      : [telemetry.storage.m2_1, telemetry.storage.m2_2]
        .filter((drive) => drive.isPopulated && known(drive.name))
        .map((drive) => known(drive.speedRead) ? `${drive.name} (${drive.speedRead})` : drive.name)
    if (drives.length > 0) lines.push(`Storage: ${drives.join('; ')}`)
  }
  if (capabilities.storageSensors && telemetry.storage.m2_1.isPopulated) {
    lines.push(`Primary storage temperature: ${telemetry.storage.m2_1.tempC}°C; health ${telemetry.storage.m2_1.healthPct}%`)
  }
  if (capabilities.psu) {
    lines.push(`PSU: ${telemetry.psu.name} (${telemetry.psu.ratedWattage}W)`)
  }
  if (capabilities.network) {
    lines.push(`Network: ${telemetry.network.name} (${telemetry.network.linkSpeedMbps}Mbps)`)
  }
  if (capabilities.peripherals && telemetry.peripherals.length > 0) {
    lines.push(`Peripherals: ${telemetry.peripherals.map((item) => item.name).join(', ')}`)
  }

  return lines.join('\n')
}
