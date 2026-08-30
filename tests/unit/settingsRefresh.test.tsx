import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPopover } from '../../src/components/SettingsPopover'

describe('Settings hardware refresh', () => {
  it('invokes the explicit hardware refresh action', async () => {
    const user = userEvent.setup()
    const refresh = vi.fn()
    const triggerRef = createRef<HTMLButtonElement>()
    render(<><button ref={triggerRef}>Settings</button><SettingsPopover
      isOpen triggerRef={triggerRef} lang="EN" theme="obsidian" isMuted={false}
      onClose={vi.fn()} onToggleLang={vi.fn()} onSelectTheme={vi.fn()} onToggleSound={vi.fn()}
      onRefreshHardware={refresh}
    /></>)

    await user.click(screen.getByRole('button', { name: 'Refresh hardware' }))
    expect(refresh).toHaveBeenCalledOnce()
  })
})
