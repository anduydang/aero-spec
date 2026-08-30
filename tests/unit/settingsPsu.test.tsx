import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsPopover } from '../../src/components/SettingsPopover'
import { PSU_PROFILE_STORAGE_KEY } from '../../src/hooks/usePsuProfile'

describe('SettingsPopover manual PSU', () => {
  beforeEach(() => localStorage.clear())

  it('stores a clearly manual PSU profile without synthetic telemetry', async () => {
    const user = userEvent.setup()
    const triggerRef = createRef<HTMLButtonElement>()
    render(
      <>
        <button ref={triggerRef}>Settings</button>
        <SettingsPopover
          isOpen
          triggerRef={triggerRef}
          lang="EN"
          theme="obsidian"
          isMuted={false}
          onClose={vi.fn()}
          onToggleLang={vi.fn()}
          onSelectTheme={vi.fn()}
          onToggleSound={vi.fn()}
        />
      </>,
    )

    await user.type(screen.getByLabelText('Power supply model'), 'Corsair RM850x')
    await user.type(screen.getByLabelText('Rated wattage'), '850')
    await user.type(screen.getByLabelText('Efficiency'), '80 Plus Gold')
    await user.click(screen.getByRole('button', { name: 'Save manual PSU' }))

    const stored = JSON.parse(localStorage.getItem(PSU_PROFILE_STORAGE_KEY) ?? '{}')
    expect(stored).toEqual({
      brandModel: 'Corsair RM850x',
      ratedWattage: 850,
      efficiency: '80 Plus Gold',
      note: '',
    })
    expect(JSON.stringify(stored)).not.toContain('currentLoad')
  })
})
