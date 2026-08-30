export type ProviderId =
  | 'windows-inventory'
  | 'windows-storage'
  | 'windows-pnp'
  | 'windows-dynamic'
  | 'nvidia'

export type LeafStatus = 'ok' | 'unsupported' | 'permission-required' | 'error'
export type SectionStatus = 'ok' | 'partial' | 'unsupported' | 'permission-required' | 'error'
export type SnapshotStatus = 'ready' | 'partial' | 'unavailable' | 'error'
export type DataSource = 'windows' | 'nvidia' | 'manual' | 'simulator'

export interface ProviderDiagnostic {
  provider: ProviderId
  status: SectionStatus
  capturedAt: string
  durationMs: number
  code?: string
  message?: string
}

export interface Section<T> {
  status: SectionStatus
  capturedAt: string
  durationMs: number
  data: T | null
  diagnostic?: ProviderDiagnostic
}

export interface QueryResult<T> {
  status: LeafStatus
  data: T | null
  diagnostic?: ProviderDiagnostic
}

export interface SystemDevice {
  localId: string
  hostName?: string
  osName?: string
  osVersion?: string
  uptimeSeconds?: number
}

export interface CpuDevice {
  localId: string
  name: string
  manufacturer?: string
  physicalCores?: number
  logicalProcessors?: number
  maxClockMhz?: number
  l2CacheKib?: number
  l3CacheKib?: number
}

export interface MotherboardDevice {
  localId: string
  manufacturer?: string
  product?: string
  version?: string
  biosVendor?: string
  biosVersion?: string
  biosReleaseDate?: string
}

export interface MemoryModule {
  localId: string
  bankLabel?: string
  deviceLocator?: string
  capacityBytes: number
  configuredSpeedMtps?: number
  manufacturer?: string
  partNumber?: string
  serialNumber?: string
}

export interface DisplayAdapter {
  localId: string
  pnpInstanceId?: string
  name: string
  vendorId?: string
  deviceId?: string
  subsystemId?: string
  pciBusId?: string
  driverVersion?: string
}

export interface StorageDevice {
  localId: string
  deviceNumber?: number
  pnpInstanceId?: string
  model: string
  serialNumber?: string
  capacityBytes: number
  mediaType?: 'ssd' | 'hdd' | 'unspecified'
  busType?: string
  health?: 'healthy' | 'warning' | 'unhealthy' | 'unknown'
  operationalStatus?: string[]
}

export interface NetworkDevice {
  localId: string
  name: string
  interfaceName?: string
  linkSpeedBps?: number
  mediaType?: string
  macAddress?: string
  connected: boolean
}

export interface PnpDevice {
  localId: string
  instanceId?: string
  name: string
  category: 'display' | 'keyboard' | 'pointing' | 'audio'
  manufacturer?: string
  status?: string
}

export interface NvidiaGpu {
  localId: string
  uuid?: string
  pciBusId?: string
  name: string
  driverVersion?: string
  memoryTotalMib?: number
  temperatureC?: number
  utilizationPercent?: number
  powerDrawW?: number
  powerLimitW?: number
  graphicsClockMhz?: number
  fanSpeedPercent?: number
}

export interface InventoryData {
  system: QueryResult<SystemDevice>
  cpu: QueryResult<CpuDevice>
  motherboard: QueryResult<MotherboardDevice>
  memoryModules: QueryResult<MemoryModule[]>
  displayAdapters: QueryResult<DisplayAdapter[]>
}

export interface StorageData {
  devices: QueryResult<StorageDevice[]>
}

export interface PnpData {
  networks: QueryResult<NetworkDevice[]>
  displays: QueryResult<PnpDevice[]>
  inputDevices: QueryResult<PnpDevice[]>
  audioDevices: QueryResult<PnpDevice[]>
}

export interface DynamicData {
  cpuLoadPercent?: number
}

export interface NvidiaData {
  gpus: NvidiaGpu[]
}

export interface NativeSnapshotV2 {
  schemaVersion: 2
  snapshotId: string
  inventoryGeneration: number
  capturedAt: string
  status: SnapshotStatus
  inventory: Section<InventoryData>
  storage: Section<StorageData>
  pnp: Section<PnpData>
  dynamic: Section<DynamicData>
  nvidia: Section<NvidiaData>
}

export interface StaticSnapshotRequestV2 {
  schemaVersion: 2
  generation: number
}

export interface StaticSnapshotResponseV2 {
  schemaVersion: 2
  generation: number
  snapshotId: string
  capturedAt: string
  inventory: Section<InventoryData>
  storage: Section<StorageData>
  pnp: Section<PnpData>
}

export interface DynamicSnapshotRequestV2 {
  schemaVersion: 2
  generation: number
  inventoryGeneration: number
}

export interface DynamicSnapshotResponseV2 {
  schemaVersion: 2
  generation: number
  inventoryGeneration: number
  capturedAt: string
  dynamic: Section<DynamicData>
  nvidia: Section<NvidiaData>
}
