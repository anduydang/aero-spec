import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemePicker } from '../../src/components/ThemePicker'

describe('ThemePicker', () => {
  it('renders five localized native radios with preview colors', () => {
    render(<ThemePicker theme="obsidian" lang="EN" onSelectTheme={() => undefined} />)

    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('radio', { name: /Obsidian Signal/i })).toBeChecked()
    expect(screen.getByText('Premium signal deck')).toBeVisible()

    for (const theme of ['obsidian', 'blueprint', 'terminal', 'industrial', 'tokyo']) {
      expect(screen.getByTestId(`theme-swatches-${theme}`).children).toHaveLength(3)
    }
  })

  it('selects a theme by click', async () => {
    const user = userEvent.setup()
    const onSelectTheme = vi.fn()
    render(<ThemePicker theme="obsidian" lang="VI" onSelectTheme={onSelectTheme} />)

    await user.click(screen.getByRole('radio', { name: /Blueprint Lab/i }))

    expect(onSelectTheme).toHaveBeenCalledWith('blueprint')
    expect(screen.getByText('Phòng bản vẽ kỹ thuật')).toBeVisible()
  })

  it('uses native arrow-key radio navigation', async () => {
    const user = userEvent.setup()
    const onSelectTheme = vi.fn()
    render(<ThemePicker theme="obsidian" lang="EN" onSelectTheme={onSelectTheme} />)

    const obsidian = screen.getByRole('radio', { name: /Obsidian Signal/i })
    obsidian.focus()
    await user.keyboard('{ArrowDown}')

    expect(onSelectTheme).toHaveBeenLastCalledWith('blueprint')
  })
})
