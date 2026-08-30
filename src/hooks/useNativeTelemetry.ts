import { useCallback, useEffect, useRef, useState } from 'react'

import {
  acceptDynamicResponse,
  acceptStaticResponse,
  beginDynamicRequest,
  beginStaticRequest,
  createNativeTelemetryState,
  markNativeError,
  markNativeUnavailable,
  toHardwareTelemetry,
  type NativeTelemetryState,
} from '../data/nativeTelemetry'
import type {
  DynamicSnapshotRequestV2,
  DynamicSnapshotResponseV2,
  StaticSnapshotRequestV2,
  StaticSnapshotResponseV2,
} from '../types/nativeTelemetry'

type InvokeArgs = { request: StaticSnapshotRequestV2 | DynamicSnapshotRequestV2 }
export type NativeInvoke = (command: string, args?: InvokeArgs) => Promise<unknown>

export interface UseNativeTelemetryOptions {
  invoke?: NativeInvoke
  isNative?: () => boolean
  now?: () => number
  pollIntervalMs?: number
}

const defaultNow = () => performance.now()

const defaultIsNative = () =>
  typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)

const defaultInvoke: NativeInvoke = async (command, args) => {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(command, args)
}

export function useNativeTelemetry(options: UseNativeTelemetryOptions = {}) {
  const invokeRef = useRef(options.invoke ?? defaultInvoke)
  const isNativeRef = useRef(options.isNative ?? defaultIsNative)
  const nowRef = useRef(options.now ?? defaultNow)
  const pollIntervalMs = options.pollIntervalMs ?? 3_000
  const initialStore = useState(createNativeTelemetryState)[0]
  const storeRef = useRef(initialStore)
  const [store, setStore] = useState(initialStore)
  const mountedRef = useRef(true)

  useEffect(() => {
    invokeRef.current = options.invoke ?? defaultInvoke
    isNativeRef.current = options.isNative ?? defaultIsNative
    nowRef.current = options.now ?? defaultNow
  }, [options.invoke, options.isNative, options.now])

  const commit = useCallback((next: NativeTelemetryState) => {
    storeRef.current = next
    if (mountedRef.current) setStore(next)
  }, [])

  const publishFreshness = useCallback(() => {
    if (mountedRef.current) setStore({ ...storeRef.current })
  }, [])

  const refreshDynamic = useCallback(async () => {
    const pending = beginDynamicRequest(storeRef.current)
    commit(pending.state)
    if (!pending.request) return

    try {
      const response = await invokeRef.current('get_dynamic_snapshot_v2', { request: pending.request }) as DynamicSnapshotResponseV2
      commit(acceptDynamicResponse(storeRef.current, response, nowRef.current()))
    } finally {
      publishFreshness()
    }
  }, [commit, publishFreshness])

  const refreshStatic = useCallback(async () => {
    const pending = beginStaticRequest(storeRef.current)
    commit(pending.state)
    try {
      const response = await invokeRef.current('get_static_snapshot_v2', { request: pending.request }) as StaticSnapshotResponseV2
      const next = acceptStaticResponse(storeRef.current, response, nowRef.current())
      const accepted = next !== storeRef.current
      commit(next)
      if (accepted) await refreshDynamic()
    } catch (error) {
      commit(markNativeError(storeRef.current, error))
    }
  }, [commit, refreshDynamic])

  useEffect(() => {
    mountedRef.current = true
    if (!isNativeRef.current()) {
      commit(markNativeUnavailable(storeRef.current))
      return () => { mountedRef.current = false }
    }
    void refreshStatic()
    return () => { mountedRef.current = false }
  }, [commit, refreshStatic])

  useEffect(() => {
    if (!isNativeRef.current()) return
    let intervalId: ReturnType<typeof setInterval> | undefined

    const stopPolling = () => {
      if (intervalId !== undefined) clearInterval(intervalId)
      intervalId = undefined
    }
    const startPolling = () => {
      stopPolling()
      if (!document.hidden) intervalId = setInterval(() => { void refreshDynamic() }, pollIntervalMs)
    }
    const onVisibilityChange = () => {
      stopPolling()
      if (!document.hidden) {
        void refreshDynamic()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [pollIntervalMs, refreshDynamic])

  return {
    telemetry: toHardwareTelemetry(store, (options.now ?? defaultNow)()),
    refreshStatic,
    refreshDynamic,
  }
}
