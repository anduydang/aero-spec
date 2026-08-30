import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsPopover } from '../../src/components/SettingsPopover'

function Harness() {
  const [open, setOpen] = useState(false)
  const triggerRef = createRef<HTMLButtonElement>()

  return (
    <div data-testid="owner">
      <button ref={triggerRef} onClick={() => setOpen(true)}>Settings</button>
      <SettingsPopover
        isOpen={open}
        triggerRef={triggerRef}
        lang="EN"
        theme="obsidian"
        isMuted={false}
        onClose={() => setOpen(false)}
        onToggleLang={vi.fn()}
        onSelectTheme={vi.fn()}
        onToggleSound={vi.fn()}
      />
    </div>
  )
}

describe('SettingsPopover', () => {
  it('renders in a body portal without participating in header layout', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const dialog = screen.getByRole('dialog', { name: 'Display and app settings' })

    expect(dialog.parentElement).toBe(document.body)
    expect(dialog).toHaveClass('fixed')
  })

  it('closes on Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Settings' })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByTestId('settings-backdrop'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
