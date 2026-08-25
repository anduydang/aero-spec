import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SiliconMetrics } from './components/SiliconMetrics';
import { MotherboardSchematic } from './components/MotherboardSchematic';
import { PsuAndPeripherals } from './components/PsuAndPeripherals';
import { CopilotFooter } from './components/CopilotFooter';
import { DeepInspectorDrawer } from './components/DeepInspectorDrawer';
import type { LanguageType, PersonaType, RigProfileType, ThemeType } from './types/hardware';
import { fullRigTelemetry, missingRigTelemetry, inspectorDatabase } from './data/mockData';
import { i18nData } from './data/i18nData';

export function App() {
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [lang, setLang] = useState<LanguageType>('EN');
  const [persona, setPersona] = useState<PersonaType>('dev');
  const [rigProfile, setRigProfile] = useState<RigProfileType>('full');
  const [activeInspectorId, setActiveInspectorId] = useState<string | null>(null);

  const telemetry = rigProfile === 'full' ? fullRigTelemetry : missingRigTelemetry;
  const dict = i18nData[lang];
  const currentInsight = dict.personas[rigProfile][persona];
  const activeInspectorItem = activeInspectorId ? inspectorDatabase[activeInspectorId] || inspectorDatabase['cpu'] : null;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'VI' : 'EN');

  return (
    <div className="p-4 lg:p-6 select-none flex flex-col gap-4 max-w-[1720px] mx-auto min-h-screen">
      {/* Top Clean Studio Header */}
      <Header 
        hostName={telemetry.hostName}
        uptime={telemetry.uptime}
        lang={lang}
        theme={theme}
        persona={persona}
        rigProfile={rigProfile}
        onToggleLang={toggleLang}
        onToggleTheme={toggleTheme}
        onSelectPersona={setPersona}
        onSelectRig={setRigProfile}
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
    </div>
  );
}

export default App;
