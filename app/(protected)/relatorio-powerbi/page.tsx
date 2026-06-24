"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

const POWERBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiZGJhOWJhMmMtMTk0Yy00OWM3LTkxMGUtOTY2N2ZmZGY5Y2U3IiwidCI6ImUwZmM5NjljLTU5MGEtNDY5NC04NTExLWZiNTQ3ZGQ4ZmMyZiJ9"

const ALLOWED_TENANT_IDS = [6]

export default function RelatorioPowerBIPage() {
  const router = useRouter()
  const [allowed, setAllowed] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const raw = localStorage.getItem("@tenancy_id")
    const parsed = raw ? Number(raw) : NaN
    const ok = Number.isFinite(parsed) && ALLOWED_TENANT_IDS.includes(parsed)
    setAllowed(ok)
    if (!ok) router.replace("/dashboard")
  }, [router])

  if (!allowed) return null

  return (
    <div className="flex-1 w-full h-[calc(100svh-var(--header-height)-1rem)]">
      <iframe
        title="Relatório PowerBI"
        src={POWERBI_URL}
        className="h-full w-full rounded-xl border-0"
        allowFullScreen
      />
    </div>
  )
}
