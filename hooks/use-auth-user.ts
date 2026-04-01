"use client"

import * as React from "react"
import { AuthenticatedUser } from "@/resources/Auth/authenticated-user.resource"
import { UserResource } from "@/resources/User/user.resource"


export type SidebarUser = {
  name: string
  email: string
  avatar: string
  role_id?: number | null
  tenant_id?: number | null
}

type LooseRecord = Record<string, unknown>

function normalizeNumericId(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const numericId = Number(raw)
  return Number.isFinite(numericId) ? numericId : null
}

function isRecord(value: unknown): value is LooseRecord {
  return typeof value === "object" && value !== null
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source

  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }

  return current
}

function getResponseData(response: unknown): unknown {
  if (!isRecord(response)) return response

  const axiosData = getPath(response, ["axiosResponse", "data"])
  if (axiosData !== undefined) return axiosData

  const getData = response.getData
  if (typeof getData === "function") {
    return getData.call(response)
  }

  return "data" in response ? response.data : response
}

function readNumericField(source: unknown, keys: string[]): number | null {
  if (!isRecord(source)) return null

  for (const key of keys) {
    const numericId = normalizeNumericId(source[key])
    if (numericId !== null) return numericId
  }

  return null
}

function extractNumericIdFromResponse(
  response: unknown,
  relationshipPaths: string[][],
  attributeKeys: string[]
): number | null {
  const data = getResponseData(response)

  const candidates = [
    getPath(data, ["data", "attributes"]),
    getPath(data, ["attributes"]),
    getPath(data, ["data"]),
    getPath(data, ["user"]),
    getPath(data, ["data", "user"]),
    getPath(data, ["data", "attributes", "user"]),
    data,
  ]

  for (const path of relationshipPaths) {
    const relationshipId = readNumericField(getPath(data, path), ["id"])
    if (relationshipId !== null) return relationshipId
  }

  for (const candidate of candidates) {
    const numericId = readNumericField(candidate, attributeKeys)
    if (numericId !== null) return numericId
  }

  return null
}

function extractRoleIdFromResponse(response: unknown): number | null {
  return extractNumericIdFromResponse(
    response,
    [
      ["data", "relationships", "role", "data"],
      ["relationships", "role", "data"],
    ],
    ["role_id", "roleId"]
  )
}

function extractTenantIdFromResponse(response: unknown): number | null {
  return extractNumericIdFromResponse(
    response,
    [
      ["data", "relationships", "selectedTenancy", "data"],
      ["relationships", "selectedTenancy", "data"],
      ["data", "relationships", "tenant", "data"],
      ["relationships", "tenant", "data"],
    ],
    ["tenant_id", "tenantId"]
  )
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

function extractTenantIdFromLocalStorage(): number | null {
  if (typeof window === "undefined") return null
  try {
    const rawTenancyId = localStorage.getItem("@tenancy_id")
    const tenancyId = normalizeNumericId(rawTenancyId)
    if (tenancyId !== null) return tenancyId

    const raw = localStorage.getItem("@user_response")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return extractTenantIdFromResponse(parsed)
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

    const localTenant = extractTenantIdFromLocalStorage()
    if (localTenant !== null) {
      patchState({ tenant_id: localTenant })
    }

    AuthenticatedUser.instance()
      .then((user: UserResource) => {
        if (!active || !user) return
        const name = String(user.getAttribute("name") ?? fallback.name ?? "")
        const email = String(user.getAttribute("email") ?? fallback.email ?? "")
        const rawRole = user.getAttribute("role_id") ?? fallback.role_id ?? null
        const rawTenant = user.getAttribute("tenant_id") ?? fallback.tenant_id ?? null
        const role_id = normalizeNumericId(rawRole)
        const tenant_id = normalizeNumericId(rawTenant)
        const avatar = ""
        setState({ name, email, avatar, role_id, tenant_id })
        if (role_id === null || tenant_id === null) {
          UserResource.loadAuthenticated()
            .then((res) => {
              if (!active) return
              const resolvedRole = extractRoleIdFromResponse(res)
              const resolvedTenant = extractTenantIdFromResponse(res)
              const patch: Partial<SidebarUser> = {}

              if (resolvedRole !== null) {
                patch.role_id = resolvedRole
              }
              if (resolvedTenant !== null) {
                patch.tenant_id = resolvedTenant
              }

              if (Object.keys(patch).length > 0) {
                patchState(patch)
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
  }, [fallback.email, fallback.name, fallback.role_id, fallback.tenant_id])

  return state
}
