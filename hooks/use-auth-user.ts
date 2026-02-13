"use client"

import * as React from "react"
import { AuthenticatedUser } from "@/resources/Auth/authenticated-user.resource"
import { UserResource } from "@/resources/User/user.resource"


export type SidebarUser = {
  name: string
  email: string
  avatar: string
  role_id?: number | null
}

function normalizeRoleId(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const roleNum = Number(raw)
  return Number.isFinite(roleNum) ? roleNum : null
}

function extractRoleIdFromResponse(response: any): number | null {
  const data =
    response?.axiosResponse?.data ??
    response?.getData?.() ??
    response?.data ??
    response

  const relationshipCandidates = [
    data?.data?.relationships?.role?.data,
    data?.relationships?.role?.data,
  ]

  for (const rel of relationshipCandidates) {
    if (!rel || typeof rel !== "object") continue
    const roleId = normalizeRoleId((rel as any).id)
    if (roleId !== null) return roleId
  }

  const candidates = [
    data?.data?.attributes,
    data?.attributes,
    data?.data,
    data?.user,
    data?.data?.user,
    data?.data?.attributes?.user,
    data,
  ]

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue
    const raw = (candidate as any).role_id ?? (candidate as any).roleId
    const roleId = normalizeRoleId(raw)
    if (roleId !== null) return roleId
  }

  return null
}

function extractRoleIdFromLocalStorage(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("@user_response")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return extractRoleIdFromResponse(parsed)
  } catch {
    return null
  }
}


export function useAuthUser(fallback: SidebarUser): SidebarUser {
  const [state, setState] = React.useState<SidebarUser>(fallback)

  React.useEffect(() => {
    let active = true
    const patchState = (patch: Partial<SidebarUser>) => {
      if (!active) return
      setState((prev) => ({ ...prev, ...patch }))
    }

    const localRole = extractRoleIdFromLocalStorage()
    if (localRole !== null) {
      patchState({ role_id: localRole })
    }

    AuthenticatedUser.instance()
      .then((user: UserResource) => {
        if (!active || !user) return
        const name = String(user.getAttribute("name") ?? fallback.name ?? "")
        const email = String(user.getAttribute("email") ?? fallback.email ?? "")
        const rawRole = user.getAttribute("role_id") ?? fallback.role_id ?? null
        const role_id = normalizeRoleId(rawRole)
        const avatar = ""
        setState({ name, email, avatar, role_id })
        if (role_id === null) {
          UserResource.loadAuthenticated()
            .then((res) => {
              if (!active) return
              const resolvedRole = extractRoleIdFromResponse(res)
              if (resolvedRole !== null) {
                patchState({ role_id: resolvedRole })
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {
      })
    return () => {
      active = false
    }
  }, [])

  return state
}
