import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ShieldCheck, Lightbulb } from 'lucide-react';
import type { PersonaInsight } from '../types/hardware';
import { motion } from 'framer-motion';

interface CopilotFooterProps {
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

  const handleRunDiagnosis = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
    }, 600);
  };

  return (
    <footer className="studio-card rounded-2xl px-3.5 py-2.5 flex flex-col gap-2 shrink-0">
      
      <div className="flex flex-wrap items-center justify-between gap-2 border-b dark:border-slate-800 border-slate-200 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black dark:text-white text-slate-900 leading-none">
                {copilotTitle}
              </h3>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-extrabold dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 border border-sky-300 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                gemini-3.7-flash
              </span>
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 font-medium leading-tight mt-0.5">
              {copilotDesc}
            </p>
          </div>
        </div>

        {/* Synergy Score & Run Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2 dark:bg-slate-900 bg-white px-3 py-1 rounded-xl border dark:border-slate-800 border-slate-300 shadow-sm">
            <span className="text-[11px] dark:text-slate-300 text-slate-600 font-bold">{synergyLabel}</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {isDiagnosing ? (
                <span className="animate-pulse text-sky-500 text-xs">Evaluating...</span>
              ) : (
                `${insight.score} / 100`
              )}
            </span>
          </div>

          <button 
            onClick={handleRunDiagnosis}
            className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/25 transition duration-150 cursor-pointer"
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
          className="dark:bg-slate-900 bg-white rounded-xl p-2.5 border dark:border-slate-800 border-slate-300 shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {pillar1Header}
            </span>
            <span className="font-mono text-[9px] dark:bg-emerald-950 dark:text-emerald-300 bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-extrabold">
              {insight.tag1}
            </span>
          </div>
          <p className="dark:text-slate-200 text-slate-700 leading-snug font-sans font-medium text-[11px]">
            {insight.text1}
          </p>
        </motion.div>

        {/* Pillar 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="dark:bg-slate-900 bg-white rounded-xl p-2.5 border dark:border-slate-800 border-slate-300 shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {pillar2Header}
            </span>
            <span className="font-mono text-[9px] dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 rounded font-extrabold">
              {insight.tag2}
            </span>
          </div>
          <p className="dark:text-slate-200 text-slate-700 leading-snug font-sans font-medium text-[11px]">
            {insight.text2}
          </p>
        </motion.div>

        {/* Pillar 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="dark:bg-slate-900 bg-white rounded-xl p-2.5 border dark:border-slate-800 border-slate-300 shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> {pillar3Header}
            </span>
            <span className="font-mono text-[9px] dark:bg-amber-950 dark:text-amber-300 bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-extrabold">
              {insight.tag3}
            </span>
          </div>
          <p className="dark:text-slate-200 text-slate-700 leading-snug font-sans font-medium text-[11px]">
            {insight.text3}
          </p>
        </motion.div>

      </div>

    </footer>
  );
};
