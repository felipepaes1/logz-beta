"use client"

import * as React from "react"
import { AuthenticatedUser } from "@/resources/Auth/authenticated-user.resource"
import type { UserResource } from "@/resources/User/user.resource"


export type SidebarUser = {
  name: string
  email: string
  avatar: string
}


export function useAuthUser(fallback: SidebarUser): SidebarUser {
  const [state, setState] = React.useState<SidebarUser>(fallback)

  React.useEffect(() => {
    let active = true
    AuthenticatedUser.instance()
      .then((user: UserResource) => {
        if (!active || !user) return
        const name = String(user.getAttribute("name") ?? fallback.name ?? "")
        const email = String(user.getAttribute("email") ?? fallback.email ?? "")
        const avatar = ""
        setState({ name, email, avatar })
      })
      .catch(() => {
      })
    return () => {
      active = false
    }
  }, [])

  return state
}