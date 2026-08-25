import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SiliconMetrics } from './components/SiliconMetrics';
import { MotherboardSchematic } from './components/MotherboardSchematic';
import { PsuAndPeripherals } from './components/PsuAndPeripherals';
import { CopilotFooter } from './components/CopilotFooter';
import { DeepInspectorDrawer } from './components/DeepInspectorDrawer';
import { FlexCardModal } from './components/FlexCardModal';
import type { LanguageType, PersonaType, RigProfileType, ThemeType, HardwareTelemetryState } from './types/hardware';
import { liveRigTelemetry, fullRigTelemetry, missingRigTelemetry } from './data/mockData';
import { getDynamicInspectorItem } from './data/inspectorGenerator';
import { i18nData } from './data/i18nData';

export function App() {
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [lang, setLang] = useState<LanguageType>('VI');
  const [persona, setPersona] = useState<PersonaType>('dev');
  const [rigProfile, setRigProfile] = useState<RigProfileType>('live');
  const [activeInspectorId, setActiveInspectorId] = useState<string | null>(null);
  const [isFlexCardOpen, setIsFlexCardOpen] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<HardwareTelemetryState>(liveRigTelemetry);

  // Attempt to invoke native Tauri hardware detection if running in Tauri
  useEffect(() => {
    async function fetchNativeTelemetry() {
      try {
        // @ts-ignore
        if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
          const { invoke } = await import('@tauri-apps/api/core');
          const res: any = await invoke('get_live_hardware_telemetry');
          if (res && res.cpu) {
            setLiveData(prev => ({
              ...prev,
              hostName: res.host_name || prev.hostName,
              uptime: res.uptime_formatted || prev.uptime,
              isLiveDetected: true,
              cpu: {
                ...prev.cpu,
                name: res.cpu.name || prev.cpu.name,
                cores: res.cpu.cores || prev.cpu.cores,
                threads: res.cpu.threads || prev.cpu.threads,
                maxClockMhz: res.cpu.max_clock_mhz || prev.cpu.maxClockMhz,
                perCoreLoads: res.cpu.per_core_loads && res.cpu.per_core_loads.length > 0 ? res.cpu.per_core_loads : prev.cpu.perCoreLoads,
              },
              ram: {
                ...prev.ram,
                totalGb: res.ram.total_gb || prev.ram.totalGb,
                channelMode: res.ram.channel_mode || prev.ram.channelMode,
                isSingleChannel: res.ram.is_single_channel !== undefined ? res.ram.is_single_channel : prev.ram.isSingleChannel,
                slots: res.ram.slots && res.ram.slots.length > 0 ? res.ram.slots.map((s: any) => ({
                  slot: s.slot,
                  size: s.size,
                  status: 'active',
                  label: 'DDR'
                })) : prev.ram.slots,
              },
              motherboard: {
                ...prev.motherboard,
                name: `${res.motherboard.manufacturer} ${res.motherboard.model}` || prev.motherboard.name,
                biosVendor: res.motherboard.bios_vendor || prev.motherboard.biosVendor,
                biosVersion: res.motherboard.bios_version || prev.motherboard.biosVersion,
                biosDate: res.motherboard.bios_date || prev.motherboard.biosDate,
              },
              gpu: {
                ...prev.gpu,
                name: res.gpu.name || prev.gpu.name,
                isDiscrete: res.gpu.is_discrete !== undefined ? res.gpu.is_discrete : prev.gpu.isDiscrete,
              },
              storage: {
                ...prev.storage,
                m2_1: res.disks && res.disks[0] ? {
                  ...prev.storage.m2_1,
                  name: `${res.disks[0].model} (${res.disks[0].size_gb}GB)`,
                  isPopulated: true,
                } : prev.storage.m2_1,
                m2_2: res.disks && res.disks[1] ? {
                  ...prev.storage.m2_2,
                  name: `${res.disks[1].model} (${res.disks[1].size_gb}GB)`,
                  isPopulated: true,
                } : prev.storage.m2_2,
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Native Tauri hardware probe unavailable, running live baseline telemetry:', err);
      }
    }
    fetchNativeTelemetry();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const telemetry = rigProfile === 'live' ? liveData : (rigProfile === 'full' ? fullRigTelemetry : missingRigTelemetry);
  const dict = i18nData[lang];
  const currentInsight = dict.personas[rigProfile][persona];
  const activeInspectorItem = activeInspectorId ? getDynamicInspectorItem(activeInspectorId, telemetry, lang, persona) : null;

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'VI' : 'EN');

  return (
    <div className="p-4 lg:p-6 select-none flex flex-col gap-4 max-w-[1720px] mx-auto min-h-screen">
      {/* Top Clean Studio Header */}
      <Header 
        hostName={telemetry.hostName}
        uptime={telemetry.uptime}
        isLiveDetected={telemetry.isLiveDetected}
        lang={lang}
        theme={theme}
        persona={persona}
        rigProfile={rigProfile}
        onToggleLang={toggleLang}
        onToggleTheme={toggleTheme}
        onSelectPersona={setPersona}
        onSelectRig={setRigProfile}
        onOpenFlexCard={() => setIsFlexCardOpen(true)}
      />

      {/* 3-Column Core Telemetry Dashboard */}
      <main className="grid grid-cols-12 gap-4">
        <SiliconMetrics 
          telemetry={telemetry}
          onInspect={setActiveInspectorId}
          perCoreLabel={dict.perCore}
        />

        <MotherboardSchematic 
          telemetry={telemetry}
          theme={theme}
          onInspect={setActiveInspectorId}
        />

        <PsuAndPeripherals 
          telemetry={telemetry}
          onInspect={setActiveInspectorId}
          peripheralsTitle={dict.peripheralsTitle}
        />
      </main>

      {/* Bottom Full-Width Neural Hardware Copilot */}
      <CopilotFooter 
        copilotTitle={dict.copilotTitle}
        copilotDesc={dict.copilotDesc}
        synergyLabel={dict.synergyLabel}
        diagnosisBtn={dict.diagnosisBtn}
        pillar1Header={dict.pillar1}
        pillar2Header={dict.pillar2}
        pillar3Header={dict.pillar3}
        insight={currentInsight}
      />

      {/* Slide-Over Deep Component Inspector Drawer */}
      <DeepInspectorDrawer 
        item={activeInspectorItem}
        lang={lang}
        lowLevelTitle={dict.lowLevelTitle}
        archTitle={dict.archTitle}
        onClose={() => setActiveInspectorId(null)}
      />

      {/* Holographic Flex Card Export Preview Modal */}
      <FlexCardModal 
        isOpen={isFlexCardOpen}
        telemetry={telemetry}
        lang={lang}
        persona={persona}
        onClose={() => setIsFlexCardOpen(false)}
      />
    </div>
  );
}

export default App;
