import { describe, expect, it } from 'vitest'

import { fullRigTelemetry } from '../../src/data/mockData'
import { buildAdvisorContext } from '../../src/utils/advisorContext'
import { calculateHardwareSynergyScore } from '../../src/utils/scoreCalculator'

describe('telemetry privacy boundary', () => {
  it('never sends the local hostname to the advisor', () => {
    const telemetry = {
      ...fullRigTelemetry,
      hostName: '<PRIVATE_HOSTNAME>',
      telemetry: {
        ...fullRigTelemetry.telemetry,
        mode: 'live' as const,
      },
    }

    const context = buildAdvisorContext(
      telemetry,
      calculateHardwareSynergyScore(telemetry, 'dev'),
    )

    expect(context).not.toContain('<PRIVATE_HOSTNAME>')
    expect(context).not.toContain('Host:')
  })
})
