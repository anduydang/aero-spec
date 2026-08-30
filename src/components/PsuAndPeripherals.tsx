import type { ReactNode } from 'react'
import { Headphones, Keyboard, Mouse, Plug2, Tv, Wifi, Zap } from 'lucide-react'
import type { HardwareTelemetryState } from '../types/hardware'
import { usePsuProfile } from '../hooks/usePsuProfile'

interface Props { telemetry: HardwareTelemetryState; onInspect: (id: string) => void; peripheralsTitle: string }

const speedLabel = (value?: number) => !value
  ? 'Link speed unavailable'
  : value >= 1_000_000_000
    ? `${Math.round(value / 100_000_000) / 10} Gbps`
    : `${Math.round(value / 1_000_000)} Mbps`

const deviceIcon = (icon: string): ReactNode => {
  if (icon === 'tv') return <Tv className="w-3.5 h-3.5" />
  if (icon === 'mouse') return <Mouse className="w-3.5 h-3.5" />
  if (icon === 'keyboard') return <Keyboard className="w-3.5 h-3.5" />
  if (icon === 'headphones') return <Headphones className="w-3.5 h-3.5" />
  return <Plug2 className="w-3.5 h-3.5" />
}

export function PsuAndPeripherals({ telemetry, onInspect, peripheralsTitle }: Props) {
  const { profile } = usePsuProfile()
  const live = telemetry.telemetry.mode === 'live'
  const networks = telemetry.networks?.length ? telemetry.networks : telemetry.telemetry.capabilities.network ? [{
    localId: 'network:legacy', name: telemetry.network.name, interfaceName: telemetry.network.lanName,
    linkSpeedBps: telemetry.network.linkSpeedMbps * 1_000_000, mediaType: telemetry.network.band,
    connected: true, source: live ? 'windows' as const : 'simulator' as const,
    status: 'ok' as const, diagnostics: [],
  }] : []
  const manualPsu = live ? profile : null
  const showSimulatedPsu = !live && telemetry.telemetry.capabilities.psu
  const truncationNotices = (telemetry.telemetry.diagnostics ?? []).filter((item) => item.code === 'ITEM_LIMIT_EXCEEDED')

  return <section className="order-3 flex flex-col gap-3 min-w-0">
    <div className="studio-card rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-600"><Zap className="w-3.5 h-3.5" /></span><span className="font-bold text-xs theme-title">Power Delivery</span></div>
        {manualPsu && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded theme-badge-primary">Manual</span>}
        {showSimulatedPsu && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-600">Simulator</span>}
      </div>
      {manualPsu ? <div><h4 className="font-bold theme-title text-xs break-words">{manualPsu.brandModel || 'Manual PSU'}</h4><p className="text-[11px] theme-muted mt-1">{[manualPsu.ratedWattage && `${manualPsu.ratedWattage}W`, manualPsu.efficiency].filter(Boolean).join(' · ') || 'Manual details only'}</p>{manualPsu.note && <p className="text-[11px] theme-muted mt-1">{manualPsu.note}</p>}</div>
        : showSimulatedPsu ? <button type="button" onClick={() => onInspect('psu')} className="text-left"><h4 className="font-bold theme-title text-xs">{telemetry.psu.name}</h4><p className="text-[11px] theme-muted mt-1">{telemetry.psu.rating} · {telemetry.psu.ratedWattage}W · simulated sensors</p></button>
          : <div><h4 className="font-bold theme-title text-xs">PSU not detected</h4><p className="text-[11px] theme-muted mt-1">Windows does not expose reliable PSU identity. Add an optional Manual PSU profile in Settings.</p></div>}
    </div>

    <div className="studio-card rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5"><div className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-600"><Wifi className="w-3.5 h-3.5" /></span><span className="font-bold text-xs theme-title">Network Interfaces</span></div><span className="text-[10px] font-mono font-bold theme-muted">{networks.length}</span></div>
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
        {networks.length === 0 && <p className="text-[11px] theme-muted">No physical network adapter was reported.</p>}
        {networks.map((network) => <div key={network.localId} className="theme-chip-box p-2 rounded-xl flex items-center justify-between gap-2 min-w-0"><div className="min-w-0"><h4 className="text-[11px] font-bold theme-title break-words">{network.name}</h4><p className="text-[10px] font-mono theme-muted truncate">{network.interfaceName || network.mediaType || 'Windows network adapter'}</p></div><div className="text-right shrink-0"><span className="text-[10px] font-bold theme-primary-text">{speedLabel(network.linkSpeedBps)}</span><span className={`block text-[9px] font-bold ${network.connected ? 'text-emerald-500' : 'theme-muted'}`}>{network.connected ? 'Connected' : 'Disconnected'}</span></div></div>)}
      </div>
    </div>

    <div className="studio-card rounded-2xl p-3 flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5"><div className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-md theme-badge-primary flex items-center justify-center"><Plug2 className="w-3.5 h-3.5" /></span><span className="font-bold text-xs theme-title">{peripheralsTitle}</span></div><span className="text-[10px] font-mono font-bold theme-muted">{telemetry.peripherals.length}</span></div>
      {truncationNotices.map((item, index) => <p key={`${item.code}-${index}`} className="text-[10px] text-amber-600">{item.message || 'Device list was truncated by the provider.'}</p>)}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[240px] pr-1">
        {telemetry.peripherals.length === 0 && <p className="text-[11px] theme-muted">No present display, input, or audio device was reported.</p>}
        {telemetry.peripherals.map((device) => <button type="button" key={device.id} onClick={() => onInspect(device.id)} className="theme-chip-box p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer text-left min-w-0"><span className="flex items-center gap-2 min-w-0"><span className="w-5 h-5 rounded-md theme-badge-primary flex items-center justify-center shrink-0">{deviceIcon(device.icon)}</span><span className="min-w-0"><span className="block text-[11px] font-bold theme-title break-words">{device.name}</span><span className="block text-[9px] font-mono theme-muted truncate">{device.detail}</span></span></span><span className="text-[10px] font-mono theme-primary-text font-bold shrink-0 max-w-24 truncate">{device.spec}</span></button>)}
      </div>
    </div>
  </section>
}
