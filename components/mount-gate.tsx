'use client'

import { ReactNode } from 'react'
import { useIsMounted } from '@/hooks/useIsMounted'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renderiza children só após montar no client.
 * Use em locais pontuais (inputs controlados por localStorage/cookies, temas, etc).
 */
export default function MountGate({ children, fallback = null }: Props) {
  const mounted = useIsMounted()
  if (!mounted) return <>{fallback}</>
  return <>{children}</>
}
