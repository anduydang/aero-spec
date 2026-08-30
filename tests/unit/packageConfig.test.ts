import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const packageConfig = JSON.parse(
  readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
)
const tauriConfig = JSON.parse(
  readFileSync(resolve(projectRoot, 'src-tauri/tauri.conf.json'), 'utf8'),
)

describe('Windows installer package configuration', () => {
  it('builds only an NSIS installer for the current user', () => {
    expect(tauriConfig.bundle.targets).toBe('nsis')
    expect(tauriConfig.bundle.windows?.nsis?.installMode).toBe('currentUser')
  })

  it('keeps the application version aligned at 2.6.1', () => {
    expect(packageConfig.version).toBe('2.6.1')
    expect(tauriConfig.version).toBe(packageConfig.version)
  })

  it('does not package sidecars, services, or drivers', () => {
    expect(tauriConfig.bundle.externalBin).toBeUndefined()
    expect(tauriConfig.bundle.resources).toBeUndefined()
  })
})
