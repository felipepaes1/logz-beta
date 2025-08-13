'use client'

import { useEffect, useState } from 'react'

export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function useMountedEffect(effect: () => void | (() => void)) {
  const mounted = useIsMounted()
  useEffect(() => {
    if (mounted) return effect()
  }, [mounted]) 
}