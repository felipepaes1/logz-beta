"use client"

import { IconLoader2 } from "@tabler/icons-react"

export function PageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <IconLoader2 className="size-10 animate-spin text-primary" />
    </div>
  )
}