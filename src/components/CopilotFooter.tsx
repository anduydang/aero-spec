import React, { useState } from 'react'
import { ChevronDown, Gauge, Sparkles } from 'lucide-react'

import type { HardwareScore, ScoreFactorId } from '../types/hardware'
import { getPriorityFactors } from '../utils/scoreCalculator'

interface CopilotFooterProps {
  score: HardwareScore
  copilotTitle: string
  copilotDesc: string
  synergyLabel: string
  diagnosisBtn: string
}

const factorLabels: Record<ScoreFactorId, string> = {
  cpu: 'CPU',
  ram: 'Memory',
  gpu: 'Graphics',
  storage: 'Storage',
}

export const CopilotFooter: React.FC<CopilotFooterProps> = ({
  score,
  copilotTitle,
  copilotDesc,
  synergyLabel,
  diagnosisBtn,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const priorities = getPriorityFactors(score)
  const factorsToShow = isDetailsOpen ? priorities : priorities.slice(0, 2)
  const isEnglish = diagnosisBtn === 'View details'

  return (
    <footer className="studio-card rounded-2xl p-3.5 flex flex-col gap-3 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl theme-btn-grad flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black theme-title leading-none">{copilotTitle}</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold theme-badge-primary rounded-full">
                Local compatibility analysis
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold theme-badge-secondary rounded-full uppercase">
                {score.confidence} confidence
              </span>
            </div>
            <p className="text-xs theme-muted font-medium leading-relaxed mt-1">
              {copilotDesc} • {score.verdict}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-baseline gap-2 theme-chip-box px-3 py-2 rounded-xl shadow-sm">
            <span className="text-xs theme-muted font-bold">{synergyLabel}</span>
            <span
              data-testid="footer-score"
              className={`text-base font-black font-mono ${
                score.score !== null && score.score >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : score.score !== null && score.score >= 55
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {score.score ?? '—'} / 100 [Grade {score.grade}]
            </span>
          </div>
          {priorities.length > 2 && (
            <button
              type="button"
              onClick={() => setIsDetailsOpen((open) => !open)}
              aria-expanded={isDetailsOpen}
              className="px-3 py-2 rounded-xl theme-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
              <span>{isDetailsOpen ? (isEnglish ? 'Collapse' : 'Thu gọn') : diagnosisBtn}</span>
            </button>
          )}
        </div>
      </div>

      {factorsToShow.length > 0 ? (
        <div className={`grid gap-2.5 ${factorsToShow.length > 2 ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
          {factorsToShow.map((factor) => (
            <div key={factor.id} className="theme-chip-box rounded-xl p-3 flex gap-2.5 shadow-sm">
              <Gauge className="w-4 h-4 theme-primary-text shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black theme-title">{factorLabels[factor.id]}</span>
                  <span className="text-xs font-black font-mono theme-primary-text">{factor.score}/100</span>
                </div>
                <p className="text-xs theme-muted leading-relaxed mt-1">{factor.reason}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="theme-chip-box rounded-xl p-3 text-xs theme-muted">
          {isEnglish
            ? 'At least two detected factors are required before AeroSpec can calculate upgrade priorities.'
            : 'AeroSpec cần phát hiện ít nhất hai nhóm linh kiện trước khi tính ưu tiên nâng cấp.'}
        </div>
      )}
    </footer>
  )
}
