import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SiliconMetrics } from './components/SiliconMetrics';
import { MotherboardSchematic } from './components/MotherboardSchematic';
import { PsuAndPeripherals } from './components/PsuAndPeripherals';
import { CopilotFooter } from './components/CopilotFooter';
import { DeepInspectorDrawer } from './components/DeepInspectorDrawer';
import { FlexCardModal } from './components/FlexCardModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import type { LanguageType, PersonaType, RigProfileType, ThemeType, HardwareTelemetryState } from './types/hardware';
import { liveRigTelemetry, fullRigTelemetry, missingRigTelemetry } from './data/mockData';
import { getDynamicInspectorItem } from './data/inspectorGenerator';
import { i18nData } from './data/i18nData';
import { soundFx } from './utils/soundFx';

export function App() {
  const [theme, setTheme] = useState<ThemeType>(() => (localStorage.getItem('aerospec_theme') as ThemeType) || 'arctic');
  const [lang, setLang] = useState<LanguageType>(() => (localStorage.getItem('aerospec_lang') as LanguageType) || 'VI');
  const [persona, setPersona] = useState<PersonaType>('dev');
  const [rigProfile, setRigProfile] = useState<RigProfileType>('live');
  const [activeInspectorId, setActiveInspectorId] = useState<string | null>(null);
  const [isFlexCardOpen, setIsFlexCardOpen] = useState<boolean>(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState<boolean>(false);
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

  // Update Theme Classes on Root & LocalStorage
  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${theme}`);
    if (theme === 'slate') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aerospec_theme', theme);
  }, [theme]);

  // Update Language in LocalStorage
  useEffect(() => {
    localStorage.setItem('aerospec_lang', lang);
  }, [lang]);

  const telemetry = rigProfile === 'live' ? liveData : (rigProfile === 'full' ? fullRigTelemetry : missingRigTelemetry);
  const dict = i18nData[lang];
  const currentInsight = dict.personas[rigProfile][persona];
  const activeInspectorItem = activeInspectorId ? getDynamicInspectorItem(activeInspectorId, telemetry, lang, persona) : null;

  const handleSelectTheme = (newTheme: ThemeType) => setTheme(newTheme);
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'VI' : 'EN');

  const handleInspect = (id: string) => {
    soundFx.playClick();
    setActiveInspectorId(id);
  };

  return (
    <div className="p-2.5 sm:p-3 xl:p-3.5 select-none flex flex-col gap-2.5 max-w-[1780px] mx-auto min-h-screen xl:h-screen xl:max-h-screen xl:overflow-hidden justify-between">
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
        onSelectTheme={handleSelectTheme}
        onSelectPersona={setPersona}
        onSelectRig={setRigProfile}
        onOpenFlexCard={() => setIsFlexCardOpen(true)}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
      />

      {/* 3-Column Core Telemetry Dashboard */}
      <main className="grid grid-cols-12 gap-2.5 xl:gap-3 flex-1 min-h-0 items-stretch">
        <SiliconMetrics 
          telemetry={telemetry}
          onInspect={handleInspect}
          perCoreLabel={dict.perCore}
        />

        <MotherboardSchematic 
          telemetry={telemetry}
          theme={theme}
          onInspect={handleInspect}
        />

        <PsuAndPeripherals 
          telemetry={telemetry}
          onInspect={handleInspect}
          peripheralsTitle={dict.peripheralsTitle}
        />
      </main>

      {/* Bottom Full-Width Neural Hardware Copilot */}
      <CopilotFooter 
        telemetry={telemetry}
        persona={persona}
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
        onClose={() => {
          soundFx.playClick();
          setActiveInspectorId(null);
        }}
      />

      {/* Holographic Flex Card Export Preview Modal */}
      <FlexCardModal 
        isOpen={isFlexCardOpen}
        telemetry={telemetry}
        lang={lang}
        persona={persona}
        onClose={() => {
          soundFx.playClick();
          setIsFlexCardOpen(false);
        }}
      />

      {/* AI Upgrade Advisor & Live Search Modal */}
      <AiAdvisorModal 
        isOpen={isAiAdvisorOpen}
        telemetry={telemetry}
        lang={lang}
        onClose={() => {
          soundFx.playClick();
          setIsAiAdvisorOpen(false);
        }}
      />
    </div>
  );
}

export default App;
