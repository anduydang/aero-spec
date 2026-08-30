import { useCallback, useEffect, useState } from 'react'

export const PSU_PROFILE_STORAGE_KEY = 'aerospec.psu-profile.v1'
const PSU_PROFILE_EVENT = 'aerospec:psu-profile-changed'

export interface ManualPsuProfile {
  brandModel: string
  ratedWattage: number
  efficiency: string
  note: string
}

const cleanText = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 160) : ''

function normalizeProfile(value: unknown): ManualPsuProfile | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  const brandModel = cleanText(candidate.brandModel)
  const efficiency = cleanText(candidate.efficiency)
  const note = cleanText(candidate.note)
  const wattage = typeof candidate.ratedWattage === 'number' ? candidate.ratedWattage : Number(candidate.ratedWattage)
  const ratedWattage = Number.isFinite(wattage) && wattage >= 1 && wattage <= 10_000
    ? Math.round(wattage)
    : 0

  if (!brandModel && ratedWattage === 0 && !efficiency && !note) return null
  return { brandModel, ratedWattage, efficiency, note }
}

function readStoredProfile(): ManualPsuProfile | null {
  try {
    const stored = localStorage.getItem(PSU_PROFILE_STORAGE_KEY)
    return stored ? normalizeProfile(JSON.parse(stored)) : null
  } catch {
    return null
  }
}

export function usePsuProfile() {
  const [profile, setProfile] = useState<ManualPsuProfile | null>(readStoredProfile)

  useEffect(() => {
    const refresh = () => setProfile(readStoredProfile())
    window.addEventListener(PSU_PROFILE_EVENT, refresh)
    return () => window.removeEventListener(PSU_PROFILE_EVENT, refresh)
  }, [])

  const save = useCallback((value: ManualPsuProfile) => {
    const normalized = normalizeProfile(value)
    if (!normalized) {
      localStorage.removeItem(PSU_PROFILE_STORAGE_KEY)
      setProfile(null)
      window.dispatchEvent(new Event(PSU_PROFILE_EVENT))
      return
    }
    localStorage.setItem(PSU_PROFILE_STORAGE_KEY, JSON.stringify(normalized))
    setProfile(normalized)
    window.dispatchEvent(new Event(PSU_PROFILE_EVENT))
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(PSU_PROFILE_STORAGE_KEY)
    setProfile(null)
    window.dispatchEvent(new Event(PSU_PROFILE_EVENT))
  }, [])

  return { profile, save, clear }
}
