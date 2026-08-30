import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from '../../src/components/Header'
import { fullRigTelemetry } from '../../src/data/mockData'
import { getDynamicInspectorItem } from '../../src/data/inspectorGenerator'
import { buildAdvisorContext } from '../../src/utils/advisorContext'
import { calculateHardwareSynergyScore } from '../../src/utils/scoreCalculator'
import type { HardwareStorageDevice, HardwareTelemetryState } from '../../src/types/hardware'

const storageDevices: HardwareStorageDevice[] = ['Alpha', 'Beta', 'Gamma'].map((name, index) => ({
  localId: `disk:${index}`,
  name: `Disk ${name}`,
  capacityBytes: (index + 1) * 500_000_000_000,
  capacityLabel: `${(index + 1) * 500}GB`,
  mediaType: 'ssd',
  busType: index === 1 ? 'NVMe' : 'SATA',
  health: 'healthy',
  operationalStatus: ['OK'],
  source: 'windows',
  status: 'ok',
  diagnostics: [],
}))

const completeStorageTelemetry: HardwareTelemetryState = {
  ...fullRigTelemetry,
  telemetry: {
    ...fullRigTelemetry.telemetry,
    mode: 'live',
    capabilities: { ...fullRigTelemetry.telemetry.capabilities, storageIdentity: true },
  },
  storage: { ...fullRigTelemetry.storage, devices: storageDevices },
}

describe('complete telemetry presentation', () => {
  it('includes every detected storage device in advisor context', () => {
    const context = buildAdvisorContext(
      completeStorageTelemetry,
      calculateHardwareSynergyScore(completeStorageTelemetry, 'dev'),
    )

    expect(context).toContain('Disk Alpha (500GB)')
    expect(context).toContain('Disk Beta (1000GB)')
    expect(context).toContain('Disk Gamma (1500GB)')
  })

  it('opens the matching inspector item for a dynamically detected disk', () => {
    const item = getDynamicInspectorItem('storage:disk:2', completeStorageTelemetry, 'EN', 'dev')

    expect(item.id).toBe('storage:disk:2')
    expect(item.title).toBe('Disk Gamma')
    expect(item.specs).toContainEqual({ label: 'Capacity', val: '1500GB' })
  })

  it('shows partial telemetry and its stale provider badge in the header', () => {
    render(
      <Header
        hostName="LOCAL-PC"
        uptime="1h"
        telemetryStatus={{
          ...fullRigTelemetry.telemetry,
          mode: 'live',
          status: 'partial',
          providers: {
            'windows-dynamic': {
              freshness: 'stale',
              ageSeconds: 11,
              source: 'windows',
              badge: 'Stale · 11s',
            },
          },
        }}
        lang="EN"
        theme="obsidian"
        persona="dev"
        rigProfile="live"
        onToggleLang={vi.fn()}
        onSelectTheme={vi.fn()}
        onSelectPersona={vi.fn()}
        onSelectRig={vi.fn()}
        onOpenFlexCard={vi.fn()}
        onOpenAiAdvisor={vi.fn()}
        onRefreshHardware={vi.fn()}
      />,
    )

    expect(screen.getByText('Live partial')).toBeVisible()
    expect(screen.getByText('Stale · 11s')).toBeVisible()
  })
})
