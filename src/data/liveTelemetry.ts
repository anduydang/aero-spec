import type {
  HardwareTelemetryState,
  NativeHardwareTelemetryPayload,
  TelemetryCapabilities,
} from '../types/hardware'

export const unavailableCapabilities = (): TelemetryCapabilities => ({
  cpuIdentity: false,
  cpuLoad: false,
  cpuSensors: false,
  ramIdentity: false,
  ramTimings: false,
  motherboardIdentity: false,
  motherboardSensors: false,
  gpuIdentity: false,
  gpuSensors: false,
  storageIdentity: false,
  storageSensors: false,
  psu: false,
  network: false,
  peripherals: false,
})

export const simulatedCapabilities = (): TelemetryCapabilities => ({
  cpuIdentity: true,
  cpuLoad: true,
  cpuSensors: true,
  ramIdentity: true,
  ramTimings: true,
  motherboardIdentity: true,
  motherboardSensors: true,
  gpuIdentity: true,
  gpuSensors: true,
  storageIdentity: true,
  storageSensors: true,
  psu: true,
  network: true,
  peripherals: true,
})

export function createLiveTelemetryBaseline(): HardwareTelemetryState {
  return {
    telemetry: {
      mode: 'live',
      status: 'scanning',
      capabilities: unavailableCapabilities(),
    },
    hostName: 'This PC',
    uptime: 'Unknown',
    busFrequencyHz: 0,
    isLiveDetected: false,
    cpu: {
      name: 'Unknown',
      cores: 0,
      threads: 0,
      cache: 'Unknown',
      avgClockMhz: 0,
      maxClockMhz: 0,
      currentLoadPct: 0,
      tempC: 0,
      tjMaxC: 0,
      vcoreV: 0,
      curveOptimizer: 'Unknown',
      powerW: 0,
      tdpLimitW: 0,
      perCoreLoads: [],
    },
    ram: {
      totalGb: 0,
      channelMode: 'Unknown',
      config: 'Unknown',
      model: 'Unknown',
      die: 'Unknown',
      frequencyMhz: 0,
      fclkMhz: 0,
      primaryTimings: 'Unknown',
      voltageV: 0,
      slotTopology: 'Unknown',
      isSingleChannel: false,
      slots: [],
    },
    motherboard: {
      name: 'Unknown',
      chipset: 'Unknown',
      pcbLayers: 'Unknown',
      agesaVersion: 'Unknown',
      biosVendor: 'Unknown',
      biosVersion: 'Unknown',
      biosDate: 'Unknown',
      vrm: {
        phases: 'Unknown',
        spsAmp: 'Unknown',
        tempC: 0,
        mosfetLoadPct: 0,
      },
    },
    storage: {
      m2_1: {
        name: 'Unknown',
        lane: 'Unknown',
        speedRead: 'Unknown',
        tempC: 0,
        healthPct: 0,
        isPopulated: false,
      },
      m2_2: {
        name: 'Unknown',
        lane: 'Unknown',
        speedRead: 'Unknown',
        tempC: 0,
        healthPct: 0,
        isPopulated: false,
      },
      m2_3: { isPopulated: false },
    },
    gpu: {
      name: 'Unknown',
      isDiscrete: false,
      vram: 'Unknown',
      busWidth: 'Unknown',
      pcieLink: 'Unknown',
      rebarActive: false,
      tempC: 0,
      powerW: 0,
      driverVersion: 'Unknown',
    },
    cooler: {
      name: 'Unknown',
      type: 'Unknown',
      pumpRpm: 0,
      fanRpm: 0,
      coolantTempC: 0,
    },
    psu: {
      name: 'Unknown',
      rating: 'Unknown',
      ratedWattage: 0,
      currentLoadW: 0,
      loadPct: 0,
      rail12v: 0,
      zeroRpm: false,
    },
    network: {
      name: 'Unknown',
      band: 'Unknown',
      linkSpeedMbps: 0,
      pingMs: 0,
      rssi: 'Unknown',
      lanName: 'Unknown',
    },
    peripherals: [],
  }
}

const hasText = (value: string | undefined): value is string => Boolean(value?.trim())

const formatVram = (vramMb: number | undefined) => {
  if (!vramMb) return 'Unknown'
  return vramMb >= 1024 && vramMb % 1024 === 0 ? `${vramMb / 1024}GB` : `${vramMb}MB`
}

export function mergeNativeTelemetry(payload: NativeHardwareTelemetryPayload): HardwareTelemetryState {
  const baseline = createLiveTelemetryBaseline()
  const cpu = payload.cpu
  const ram = payload.ram
  const board = payload.motherboard
  const gpu = payload.gpu
  const disks = payload.disks ?? []
  const cpuIdentity = Boolean(cpu && (hasText(cpu.name) || cpu.cores || cpu.threads))
  const cpuLoad = Boolean(cpu && (
    typeof cpu.current_load_pct === 'number'
    || (cpu.per_core_loads?.length ?? 0) > 0
  ))
  const ramIdentity = Boolean(ram && (
    ram.total_gb
    || ram.speed_mhz
    || (ram.slots?.length ?? 0) > 0
  ))
  const motherboardIdentity = Boolean(board && (
    hasText(board.manufacturer)
    || hasText(board.model)
    || hasText(board.bios_version)
  ))
  const gpuIdentity = Boolean(gpu && hasText(gpu.name))
  const storageIdentity = disks.some((disk) => hasText(disk.model))
  const boardName = [board?.manufacturer, board?.model]
    .filter(hasText)
    .join(' ')
  const boardLabel = boardName && hasText(board?.version)
    ? `${boardName} (${board.version.trim()})`
    : boardName

  const mappedDisks = disks.filter((disk) => hasText(disk.model)).slice(0, 2)
  const mapDisk = (index: number, fallback: typeof baseline.storage.m2_1) => {
    const disk = mappedDisks[index]
    if (!disk?.model) return fallback
    const size = disk.size_gb ? ` (${disk.size_gb}GB)` : ''
    return {
      ...fallback,
      name: `${disk.model.trim()}${size}`,
      lane: hasText(disk.media_type) ? disk.media_type.trim() : 'Detected drive',
      isPopulated: true,
    }
  }

  return {
    ...baseline,
    telemetry: {
      mode: 'live',
      status: 'ready',
      capabilities: {
        ...unavailableCapabilities(),
        cpuIdentity,
        cpuLoad,
        ramIdentity,
        motherboardIdentity,
        gpuIdentity,
        storageIdentity,
      },
    },
    hostName: hasText(payload.host_name) ? payload.host_name.trim() : baseline.hostName,
    uptime: hasText(payload.uptime_formatted) ? payload.uptime_formatted.trim() : baseline.uptime,
    isLiveDetected: true,
    cpu: {
      ...baseline.cpu,
      name: hasText(cpu?.name) ? cpu.name.trim() : baseline.cpu.name,
      cores: cpu?.cores ?? baseline.cpu.cores,
      threads: cpu?.threads ?? baseline.cpu.threads,
      avgClockMhz: cpu?.current_clock_mhz ?? baseline.cpu.avgClockMhz,
      maxClockMhz: cpu?.max_clock_mhz ?? baseline.cpu.maxClockMhz,
      currentLoadPct: cpu?.current_load_pct ?? baseline.cpu.currentLoadPct,
      perCoreLoads: cpu?.per_core_loads ?? baseline.cpu.perCoreLoads,
    },
    ram: {
      ...baseline.ram,
      totalGb: ram?.total_gb ?? baseline.ram.totalGb,
      channelMode: hasText(ram?.channel_mode) ? ram.channel_mode.trim() : baseline.ram.channelMode,
      config: ram?.total_gb && ram?.speed_mhz
        ? `${ram.total_gb}GB DDR @ ${ram.speed_mhz} MT/s`
        : baseline.ram.config,
      frequencyMhz: ram?.speed_mhz ? ram.speed_mhz / 2 : baseline.ram.frequencyMhz,
      isSingleChannel: ram?.is_single_channel ?? baseline.ram.isSingleChannel,
      slots: ram?.slots?.map((slot, index) => ({
        slot: hasText(slot.slot) ? slot.slot.trim() : `DIMM ${index + 1}`,
        size: hasText(slot.size) ? slot.size.trim() : 'Unknown',
        status: slot.status === 'empty' ? 'empty' as const : 'active' as const,
        label: hasText(slot.manufacturer) ? slot.manufacturer.trim() : undefined,
      })) ?? baseline.ram.slots,
    },
    motherboard: {
      ...baseline.motherboard,
      name: boardLabel || baseline.motherboard.name,
      biosVendor: hasText(board?.bios_vendor) ? board.bios_vendor.trim() : baseline.motherboard.biosVendor,
      biosVersion: hasText(board?.bios_version) ? board.bios_version.trim() : baseline.motherboard.biosVersion,
      biosDate: hasText(board?.bios_date) ? board.bios_date.trim() : baseline.motherboard.biosDate,
    },
    gpu: {
      ...baseline.gpu,
      name: hasText(gpu?.name) ? gpu.name.trim() : baseline.gpu.name,
      isDiscrete: gpu?.is_discrete ?? baseline.gpu.isDiscrete,
      vram: formatVram(gpu?.vram_mb),
      driverVersion: hasText(gpu?.driver_version) ? gpu.driver_version.trim() : baseline.gpu.driverVersion,
    },
    storage: {
      ...baseline.storage,
      m2_1: mapDisk(0, baseline.storage.m2_1),
      m2_2: mapDisk(1, baseline.storage.m2_2),
    },
  }
}
