import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ShieldCheck, Lightbulb } from 'lucide-react';
import type { HardwareTelemetryState, PersonaInsight, PersonaType } from '../types/hardware';
import { calculateHardwareSynergyScore } from '../utils/scoreCalculator';
import { motion } from 'framer-motion';

interface CopilotFooterProps {
  telemetry: HardwareTelemetryState;
  persona: PersonaType;
  copilotTitle: string;
  copilotDesc: string;
  synergyLabel: string;
  diagnosisBtn: string;
  pillar1Header: string;
  pillar2Header: string;
  pillar3Header: string;
  insight: PersonaInsight;
}

export const CopilotFooter: React.FC<CopilotFooterProps> = ({
  telemetry,
  persona,
  copilotTitle,
  copilotDesc,
  synergyLabel,
  diagnosisBtn,
  pillar1Header,
  pillar2Header,
  pillar3Header,
  insight
}) => {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const calculated = calculateHardwareSynergyScore(telemetry, persona);

  const handleRunDiagnosis = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
    }, 600);
  };

  return (
    <footer className="studio-card rounded-2xl px-3.5 py-2.5 flex flex-col gap-2 shrink-0">
      
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl theme-btn-grad flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black theme-title leading-none">
                {copilotTitle}
              </h3>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-extrabold theme-badge-primary rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                gemini-3.7-flash (Hardware Engine)
              </span>
            </div>
            <p className="text-[11px] theme-muted font-medium leading-tight mt-0.5">
              {copilotDesc} • {calculated.verdict}
            </p>
          </div>
        </div>

        {/* Dynamic Synergy Score & Grade */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2 theme-chip-box px-3 py-1 rounded-xl shadow-sm">
            <span className="text-[11px] theme-muted font-bold">{synergyLabel}</span>
            <span className={`text-base font-black font-mono ${
              calculated.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : calculated.score >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isDiagnosing ? (
                <span className="animate-pulse theme-primary-text text-xs">Evaluating...</span>
              ) : (
                `${calculated.score} / 100 [Grade ${calculated.grade}]`
              )}
            </span>
          </div>

          <button 
            onClick={handleRunDiagnosis}
            className="px-3 py-1 rounded-xl theme-btn-primary text-white text-xs font-bold flex items-center gap-1.5 transition duration-150 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isDiagnosing ? 'animate-spin' : ''}`} /> 
            <span>{diagnosisBtn}</span>
          </button>
        </div>
      </div>

      {/* AI 3-Pillar Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
        
        {/* Pillar 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-chip-box rounded-xl p-2.5 shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {pillar1Header}
            </span>
            <span className="font-mono text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-extrabold">
              {insight.tag1}
            </span>
          </div>
          <p className="theme-sub leading-snug font-sans font-medium text-[11px]">
            {insight.text1}
          </p>
        </motion.div>

        {/* Pillar 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="theme-chip-box rounded-xl p-2.5 shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center justify-between theme-primary-text font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {pillar2Header}
            </span>
            <span className="font-mono text-[9px] theme-badge-primary px-1.5 py-0.2 rounded font-extrabold">
              {insight.tag2}
            </span>
          </div>
          <p className="theme-sub leading-snug font-sans font-medium text-[11px]">
            {insight.text2}
          </p>
        </motion.div>

        {/* Pillar 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="theme-chip-box rounded-xl p-2.5 shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> {pillar3Header}
            </span>
            <span className="font-mono text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-extrabold">
              {insight.tag3}
            </span>
          </div>
          <p className="theme-sub leading-snug font-sans font-medium text-[11px]">
            {insight.text3}
          </p>
        </motion.div>

      </div>

    </footer>
  );
};
