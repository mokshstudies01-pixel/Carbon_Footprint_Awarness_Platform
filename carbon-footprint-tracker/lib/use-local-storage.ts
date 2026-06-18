"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * useLocalStorage
 * ----------------------------------------------------------------------------
 * A small, typed wrapper around localStorage that keeps React state in sync
 * with the browser so questionnaire answers and committed actions survive a
 * refresh without any backend. It hydrates safely (no SSR mismatch) by reading
 * storage only after mount, and reports a `ready` flag so consumers can avoid
 * rendering stale defaults before hydration completes.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [ready, setReady] = useState(false)

  // Hydrate from storage once on mount (client-only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) setValue(JSON.parse(raw) as T)
    } catch {
      // Corrupt/unavailable storage: fall back to the initial value.
    }
    setReady(true)
  }, [key])

  // Persist on every change after hydration.
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // Ignore quota/availability errors; state still updates in-memory.
        }
        return resolved
      })
    },
    [key],
  )

  return [value, update, ready] as const
}
