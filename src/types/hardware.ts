import type { DataSource, ProviderDiagnostic, ProviderId, SectionStatus } from './nativeTelemetry'

export type PersonaType = 'dev' | 'creator' | 'esports' | 'silent';
export type RigProfileType = 'live' | 'full' | 'missing';
export type LanguageType = 'EN' | 'VI';
export type ThemeType = 'obsidian' | 'blueprint' | 'terminal' | 'industrial' | 'tokyo';
export type TelemetryMode = 'live' | 'simulated';
export type DetectionStatus = 'scanning' | 'ready' | 'partial' | 'unavailable' | 'error';
export type TelemetryFreshness = 'fresh' | 'stale' | 'unavailable';

export interface TelemetryProviderState {
  freshness: TelemetryFreshness;
  ageSeconds: number;
  source: DataSource;
  badge?: string;
  diagnostic?: ProviderDiagnostic;
}

export interface TelemetryCapabilities {
  cpuIdentity: boolean;
  cpuLoad: boolean;
  cpuSensors: boolean;
  ramIdentity: boolean;
  ramTimings: boolean;
  motherboardIdentity: boolean;
  motherboardSensors: boolean;
  gpuIdentity: boolean;
  gpuSensors: boolean;
  storageIdentity: boolean;
  storageSensors: boolean;
  psu: boolean;
  network: boolean;
  peripherals: boolean;
}

export interface TelemetryMetadata {
  mode: TelemetryMode;
  status: DetectionStatus;
  capabilities: TelemetryCapabilities;
  error?: string;
  diagnostics?: ProviderDiagnostic[];
  providers?: Partial<Record<ProviderId, TelemetryProviderState>>;
}

export interface SourcedHardwareItem {
  source: DataSource;
  status: SectionStatus;
  diagnostics: ProviderDiagnostic[];
}

export interface HardwareStorageDevice extends SourcedHardwareItem {
  localId: string;
  name: string;
  capacityBytes: number;
  capacityLabel: string;
  mediaType: 'ssd' | 'hdd' | 'unspecified';
  busType: string;
  health: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
  operationalStatus: string[];
}

export interface HardwareNetworkDevice extends SourcedHardwareItem {
  localId: string;
  name: string;
  interfaceName?: string;
  linkSpeedBps?: number;
  mediaType?: string;
  connected: boolean;
}

export interface HardwareConnectedDevice extends SourcedHardwareItem {
  localId: string;
  name: string;
  type: 'display' | 'mouse' | 'keyboard' | 'audio';
  manufacturer?: string;
  deviceStatus?: string;
}

export interface NativeHardwareTelemetryPayload {
  host_name?: string;
  os_name?: string;
  uptime_formatted?: string;
  cpu?: {
    name?: string;
    cores?: number;
    threads?: number;
    max_clock_mhz?: number;
    current_clock_mhz?: number;
    current_load_pct?: number;
    per_core_loads?: number[];
  };
  ram?: {
    total_gb?: number;
    channel_mode?: string;
    speed_mhz?: number;
    slots?: {
      slot?: string;
      size?: string;
      speed_mhz?: number;
      manufacturer?: string;
      status?: string;
    }[];
    is_single_channel?: boolean;
  };
  motherboard?: {
    manufacturer?: string;
    model?: string;
    version?: string;
    bios_vendor?: string;
    bios_version?: string;
    bios_date?: string;
  };
  gpu?: {
    name?: string;
    is_discrete?: boolean;
    vram_mb?: number;
    driver_version?: string;
  };
  disks?: {
    model?: string;
    size_gb?: number;
    media_type?: string;
  }[];
}

export interface MicroSpec {
  label: string;
  val: string;
}

export interface InspectorItem {
  id: string;
  title: string;
  badge: string;
  icon: string;
  aiScore: string;
  aiText_EN: string;
  aiText_VI: string;
  specs: MicroSpec[];
  arch_EN: string;
  arch_VI: string;
}

export interface PersonaInsight {
  tag1: string;
  tag2: string;
  tag3: string;
  text1: string;
  text2: string;
  text3: string;
}

export type ScoreFactorId = 'cpu' | 'ram' | 'gpu' | 'storage';

export interface ScoreFactor {
  id: ScoreFactorId;
  score: number | null;
  weight: number;
  available: boolean;
  reason: string;
}

export interface HardwareScore {
  score: number | null;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | '—';
  verdict: string;
  confidence: 'high' | 'medium' | 'low';
  factors: ScoreFactor[];
}

export interface HardwareTelemetryState {
  telemetry: TelemetryMetadata;
  hostName: string;
  uptime: string;
  busFrequencyHz: number;
  isLiveDetected?: boolean;
  cpu: {
    name: string;
    cores: number;
    threads: number;
    cache: string;
    avgClockMhz: number;
    maxClockMhz: number;
    currentLoadPct: number;
    tempC: number;
    tjMaxC: number;
    vcoreV: number;
    curveOptimizer: string;
    powerW: number;
    tdpLimitW: number;
    perCoreLoads: number[];
  };
  ram: {
    totalGb: number;
    channelMode: string;
    config: string;
    model: string;
    die: string;
    frequencyMhz: number;
    fclkMhz: number;
    primaryTimings: string;
    voltageV: number;
    slotTopology: string;
    isSingleChannel: boolean;
    slots: { slot: string; size: string; status: 'active' | 'empty'; label?: string; partNumber?: string; source?: DataSource }[];
  };
  motherboard: {
    name: string;
    chipset: string;
    pcbLayers: string;
    agesaVersion: string;
    biosVendor?: string;
    biosVersion: string;
    biosDate: string;
    vrm: {
      phases: string;
      spsAmp: string;
      tempC: number;
      mosfetLoadPct: number;
    };
  };
  storage: {
    devices?: HardwareStorageDevice[];
    m2_1: {
      name: string;
      lane: string;
      speedRead: string;
      tempC: number;
      healthPct: number;
      isPopulated: boolean;
    };
    m2_2: {
      name: string;
      lane: string;
      speedRead: string;
      tempC: number;
      healthPct: number;
      isPopulated: boolean;
    };
    m2_3: {
      isPopulated: boolean;
    };
  };
  gpu: {
    name: string;
    isDiscrete: boolean;
    vram: string;
    busWidth: string;
    pcieLink: string;
    rebarActive: boolean;
    tempC: number;
    powerW: number;
    driverVersion: string;
  };
  cooler: {
    name: string;
    type: string;
    pumpRpm: number;
    fanRpm: number;
    coolantTempC: number;
  };
  psu: {
    name: string;
    rating: string;
    ratedWattage: number;
    currentLoadW: number;
    loadPct: number;
    rail12v: number;
    zeroRpm: boolean;
    provenance?: 'manual' | 'simulator' | 'unavailable';
  };
  network: {
    name: string;
    band: string;
    linkSpeedMbps: number;
    pingMs: number;
    rssi: string;
    lanName: string;
  };
  networks?: HardwareNetworkDevice[];
  connectedDevices?: {
    display: HardwareConnectedDevice[];
    input: HardwareConnectedDevice[];
    audio: HardwareConnectedDevice[];
  };
  peripherals: {
    id: string;
    name: string;
    type: 'display' | 'mouse' | 'keyboard' | 'audio';
    spec: string;
    detail: string;
    icon: string;
    active: boolean;
  }[];
}
