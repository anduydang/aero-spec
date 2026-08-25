import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { useAccessibleDialog } from '../../src/hooks/useAccessibleDialog'

function DialogHarness() {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useAccessibleDialog<HTMLDivElement>({
    isOpen,
    onClose: () => setIsOpen(false),
  })

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open dialog</button>
      {isOpen && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Accessible test dialog</h2>
          <button>First action</button>
          <button>Last action</button>
        </div>
      )}
    </>
  )
}

describe('useAccessibleDialog', () => {
  it('provides labelled modal semantics and focuses the first action', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = screen.getByRole('dialog', { name: 'Accessible test dialog' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus())
  })

  it('contains forward and backward Tab navigation', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const first = screen.getByRole('button', { name: 'First action' })
    const last = screen.getByRole('button', { name: 'Last action' })
    await waitFor(() => expect(first).toHaveFocus())

    await user.tab()
    expect(last).toHaveFocus()
    await user.tab()
    expect(first).toHaveFocus()
    await user.tab({ shift: true })
    expect(last).toHaveFocus()
  })

  it('closes on Escape and restores focus to the opener', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    const opener = screen.getByRole('button', { name: 'Open dialog' })

    await user.click(opener)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
  })
})
