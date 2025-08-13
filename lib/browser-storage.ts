'use client'

const isBrowser = typeof window !== 'undefined'

/** LOCAL STORAGE (SSR-safe) */
export function lsGet<T = string>(key: string, fallback: T | null = null): T | null {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    // tenta JSON, senão devolve string
    try {
      return JSON.parse(raw) as T
    } catch {
      return (raw as unknown) as T
    }
  } catch {
    return fallback
  }
}

export function lsSet<T = unknown>(key: string, value: T): void {
  if (!isBrowser) return
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    window.localStorage.setItem(key, serialized)
  } catch {
    // silencioso por segurança (quota, modo privado, etc)
  }
}

export function lsRemove(key: string): void {
  if (!isBrowser) return
  try {
    window.localStorage.removeItem(key)
  } catch {}
}

/** COOKIES (client-only) */
type SameSiteOpt = 'Lax' | 'Strict' | 'None'
export function getCookie(name: string): string {
  if (!isBrowser) return ''
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

export function setCookie(
  name: string,
  value: string,
  opts: { maxAge?: number; path?: string; sameSite?: SameSiteOpt; secure?: boolean } = {}
): void {
  if (!isBrowser) return
  const path = `; Path=${opts.path ?? '/'}`
  const maxAge = opts.maxAge != null ? `; Max-Age=${opts.maxAge}` : ''
  const sameSite = `; SameSite=${opts.sameSite ?? 'Lax'}`
  const secure = opts.secure ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}${path}${maxAge}${sameSite}${secure}`
}

export function deleteCookie(name: string): void {
  if (!isBrowser) return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}