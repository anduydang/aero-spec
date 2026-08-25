import { describe, expect, it } from 'vitest'

import { fullRigTelemetry } from '../../src/data/mockData'
import { calculateHardwareSynergyScore, getPriorityFactors } from '../../src/utils/scoreCalculator'
import type { HardwareTelemetryState, TelemetryCapabilities } from '../../src/types/hardware'

const withCapabilities = (capabilities: Partial<TelemetryCapabilities>): HardwareTelemetryState => ({
  ...fullRigTelemetry,
  telemetry: {
    ...fullRigTelemetry.telemetry,
    capabilities: {
      ...fullRigTelemetry.telemetry.capabilities,
      ...capabilities,
    },
  },
})

describe('calculateHardwareSynergyScore', () => {
  it('returns all explainable factors with high confidence for complete simulator data', () => {
    const result = calculateHardwareSynergyScore(fullRigTelemetry, 'dev')

    expect(result).toMatchObject({ score: 98, grade: 'S', confidence: 'high' })
    expect(result.factors.map((factor) => factor.id)).toEqual(['cpu', 'ram', 'gpu', 'storage'])
    expect(result.factors.every((factor) => factor.available && factor.score !== null)).toBe(true)
    expect(result.factors.every((factor) => factor.reason.length > 10)).toBe(true)
  })

  it('renormalizes three available persona weights and reports medium confidence', () => {
    const telemetry = withCapabilities({ storageIdentity: false })
    const result = calculateHardwareSynergyScore(telemetry, 'dev')

    expect(result.score).toBe(98)
    expect(result.confidence).toBe('medium')
    expect(result.factors.find((factor) => factor.id === 'storage')).toMatchObject({
      score: null,
      available: false,
    })
  })

  it('renormalizes two available factors and reports low confidence', () => {
    const telemetry = withCapabilities({
      ramIdentity: false,
      storageIdentity: false,
    })
    const result = calculateHardwareSynergyScore(telemetry, 'esports')

    expect(result.score).toBe(97)
    expect(result.confidence).toBe('low')
  })

  it('returns an insufficient-data result with fewer than two factors', () => {
    const telemetry = withCapabilities({
      ramIdentity: false,
      gpuIdentity: false,
      storageIdentity: false,
    })
    const result = calculateHardwareSynergyScore(telemetry, 'creator')

    expect(result.score).toBeNull()
    expect(result.grade).toBe('—')
    expect(result.confidence).toBe('low')
    expect(result.verdict).toMatch(/more detected data/i)
  })

  it('uses the unchanged persona weights and deterministic factor reasons', () => {
    const result = calculateHardwareSynergyScore(fullRigTelemetry, 'creator')
    const weights = Object.fromEntries(result.factors.map(({ id, weight }) => [id, weight]))

    expect(weights).toEqual({ cpu: 0.3, ram: 0.15, gpu: 0.45, storage: 0.1 })
    expect(result.factors.find((factor) => factor.id === 'gpu')?.reason).toBe(
      'Enthusiast discrete GPU matched the RTX 4070 / RX 7800 tier.',
    )
  })

  it('sorts priorities by weighted improvement opportunity', () => {
    const result = calculateHardwareSynergyScore(fullRigTelemetry, 'dev')
    const priorities = getPriorityFactors(result)

    expect(priorities.slice(0, 2).map((factor) => factor.id)).toEqual(['gpu', 'ram'])
  })
})
