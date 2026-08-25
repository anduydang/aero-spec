export type PersonaType = 'dev' | 'creator' | 'esports' | 'silent';
export type RigProfileType = 'live' | 'full' | 'missing';
export type LanguageType = 'EN' | 'VI';
export type ThemeType = 'arctic' | 'latte' | 'matcha' | 'sakura' | 'slate';

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
  score: string;
  tag1: string;
  tag2: string;
  tag3: string;
  text1: string;
  text2: string;
  text3: string;
}

export interface HardwareTelemetryState {
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
    slots: { slot: string; size: string; status: 'active' | 'empty'; label?: string }[];
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
  };
  network: {
    name: string;
    band: string;
    linkSpeedMbps: number;
    pingMs: number;
    rssi: string;
    lanName: string;
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
