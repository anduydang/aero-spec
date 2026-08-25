import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { SiliconMetrics } from './components/SiliconMetrics';
import { MotherboardSchematic } from './components/MotherboardSchematic';
import { PsuAndPeripherals } from './components/PsuAndPeripherals';
import { CopilotFooter } from './components/CopilotFooter';
import type { LanguageType, PersonaType, RigProfileType, ThemeType, HardwareTelemetryState, NativeHardwareTelemetryPayload } from './types/hardware';
import { fullRigTelemetry, missingRigTelemetry } from './data/mockData';
import { createLiveTelemetryBaseline, mergeNativeTelemetry } from './data/liveTelemetry';
import { getDynamicInspectorItem } from './data/inspectorGenerator';
import { i18nData } from './data/i18nData';
import { soundFx } from './utils/soundFx';
import { calculateHardwareSynergyScore } from './utils/scoreCalculator';

const DeepInspectorDrawer = lazy(() => import('./components/DeepInspectorDrawer').then((module) => ({ default: module.DeepInspectorDrawer })));
const FlexCardModal = lazy(() => import('./components/FlexCardModal').then((module) => ({ default: module.FlexCardModal })));
const AiAdvisorModal = lazy(() => import('./components/AiAdvisorModal').then((module) => ({ default: module.AiAdvisorModal })));

export function App() {
  const [theme, setTheme] = useState<ThemeType>(() => (localStorage.getItem('aerospec_theme') as ThemeType) || 'slate');
  const [lang, setLang] = useState<LanguageType>(() => (localStorage.getItem('aerospec_lang') as LanguageType) || 'VI');
  const [persona, setPersona] = useState<PersonaType>('dev');
  const [rigProfile, setRigProfile] = useState<RigProfileType>('live');
  const [activeInspectorId, setActiveInspectorId] = useState<string | null>(null);
  const [isFlexCardOpen, setIsFlexCardOpen] = useState<boolean>(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<HardwareTelemetryState>(() => createLiveTelemetryBaseline());

  // Attempt to invoke native Tauri hardware detection if running in Tauri
  useEffect(() => {
    let cancelled = false;

    async function fetchNativeTelemetry() {
      const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
      if (!isTauri) {
        setLiveData(prev => ({
          ...prev,
          telemetry: { ...prev.telemetry, status: 'unavailable' },
        }));
        return;
      }

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const response = await invoke<NativeHardwareTelemetryPayload>('get_live_hardware_telemetry');
        if (!cancelled) setLiveData(mergeNativeTelemetry(response));
      } catch (err) {
        console.warn('Native Tauri hardware probe unavailable:', err);
        if (!cancelled) {
          setLiveData(prev => ({
            ...prev,
            telemetry: {
              ...prev.telemetry,
              status: 'error',
              error: err instanceof Error ? err.message : String(err),
            },
          }));
        }
      }
    }
    fetchNativeTelemetry();
    return () => { cancelled = true; };
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
  const hardwareScore = useMemo(
    () => calculateHardwareSynergyScore(telemetry, persona),
    [telemetry, persona],
  );
  const dict = i18nData[lang];
  const activeInspectorItem = activeInspectorId ? getDynamicInspectorItem(activeInspectorId, telemetry, lang, persona) : null;

  const handleSelectTheme = (newTheme: ThemeType) => setTheme(newTheme);
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'VI' : 'EN');

  const handleInspect = (id: string) => {
    soundFx.playClick();
    setActiveInspectorId(id);
  };

  return (
    <div data-testid="app-shell" className="p-2.5 sm:p-3 xl:p-4 flex flex-col gap-3 max-w-[1780px] mx-auto min-h-screen">
      {/* Top Clean Studio Header */}
      <Header 
        hostName={telemetry.hostName}
        uptime={telemetry.uptime}
        telemetryStatus={telemetry.telemetry}
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
      <main className="grid grid-cols-1 xl:grid-cols-[minmax(250px,0.8fr)_minmax(520px,1.8fr)_minmax(250px,0.8fr)] gap-3 items-start">
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
        score={hardwareScore}
        copilotTitle={dict.copilotTitle}
        copilotDesc={dict.copilotDesc}
        synergyLabel={dict.synergyLabel}
        diagnosisBtn={dict.diagnosisBtn}
      />

      {/* Slide-Over Deep Component Inspector Drawer */}
      {activeInspectorItem && <Suspense fallback={null}>
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
      </Suspense>}

      {/* Holographic Flex Card Export Preview Modal */}
      {isFlexCardOpen && <Suspense fallback={null}>
        <FlexCardModal
          isOpen={isFlexCardOpen}
          telemetry={telemetry}
          lang={lang}
          persona={persona}
          score={hardwareScore}
          onClose={() => {
            soundFx.playClick();
            setIsFlexCardOpen(false);
          }}
        />
      </Suspense>}

      {/* AI Upgrade Advisor & Live Search Modal */}
      {isAiAdvisorOpen && <Suspense fallback={null}>
        <AiAdvisorModal
          isOpen={isAiAdvisorOpen}
          telemetry={telemetry}
          score={hardwareScore}
          lang={lang}
          onClose={() => {
            soundFx.playClick();
            setIsAiAdvisorOpen(false);
          }}
        />
      </Suspense>}
    </div>
  );
}

export default App;
