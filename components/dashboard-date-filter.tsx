"use client"

import React from "react"
import { CalendarClock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDashboardPanorama } from "@/components/dashboard-panorama-provider"

function toMonthKey(value?: string | null) {
  if (!value) return null
  const cleaned = value.slice(0, 7)
  const [y, m] = cleaned.split("-").map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null
  const mm = String(m).padStart(2, "0")
  return `${String(y).padStart(4, "0")}-${mm}`
}

function lastDayOfMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null
  const date = new Date(y, m, 0)
  const yyyy = String(date.getFullYear()).padStart(4, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function formatDateLabel(date?: string | null) {
  if (!date) return null
  const normalized = date.length === 7 ? `${date}-01` : date
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

function formatRangeLabel(from?: string | null, to?: string | null) {
  const start = formatDateLabel(from)
  const end = formatDateLabel(to)
  if (start && end) return `${start} até ${end}`
  if (start) return `Desde ${start}`
  return end ?? "Ano atual"
}

function buildPresetRange(months: string[], count: number) {
  if (!months.length || count <= 0) return null
  const normalized = months.map(toMonthKey).filter(Boolean) as string[]
  if (!normalized.length) return null
  const sorted = Array.from(new Set(normalized)).sort(
    (a, b) => new Date(`${a}-01`).getTime() - new Date(`${b}-01`).getTime()
  )
  const slice = sorted.slice(Math.max(sorted.length - count, 0))
  if (!slice.length) return null
  const from = `${slice[0]}-01`
  const to = lastDayOfMonth(slice[slice.length - 1]!)
  if (!to) return null
  return { date_from: from, date_to: to }
}

export function DashboardDateFilter() {
  const { range, applyRange, availableMonths, loading, data, hasData } =
    useDashboardPanorama()

  const [from, setFrom] = React.useState(range.from ?? "")
  const [to, setTo] = React.useState(range.to ?? "")
  const [activePreset, setActivePreset] = React.useState<string | null>(null)

  React.useEffect(() => {
    setFrom(range.from ?? "")
    setTo(range.to ?? "")
  }, [range.from, range.to])

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await applyRange({
        date_from: from || null,
        date_to: to || null,
      })
    },
    [applyRange, from, to]
  )

  const handlePreset = React.useCallback(
    (monthsCount: number, key: string) => {
      const preset = buildPresetRange(availableMonths, monthsCount)
      if (!preset) {
        toast.info("Ainda não há meses suficientes para esse atalho.")
        return
      }
      setFrom(preset.date_from ?? "")
      setTo(preset.date_to ?? "")
      setActivePreset(key)
    },
    [availableMonths]
  )

  const rangeLabel = React.useMemo(
    () =>
      formatRangeLabel(
        range.from ?? data?.period?.from,
        range.to ?? data?.period?.to
      ),
    [data?.period?.from, data?.period?.to, range.from, range.to]
  )

  const hasMonths = availableMonths.length > 0

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          Período dos gráficos
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:justify-end">
          <div>
            Período carregado:{" "}
            <span className="font-medium text-foreground">{rangeLabel}</span>
          </div>
          {!hasData && !loading && (
            <span className="text-amber-600">
              Nenhum dado encontrado para o intervalo selecionado.
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          className="flex flex-col flex-wrap gap-3 md:flex-row md:items-end"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-1 w-full md:w-[180px]">
            <Label htmlFor="panorama-date-from" className="text-xs">Início</Label>
            <Input
              id="panorama-date-from"
              type="date"
              className="h-8 px-2 text-xs"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setActivePreset(null)
              }}
              max={to || undefined}
            />
          </div>

          <div className="grid gap-1 w-full md:w-[180px]">
            <Label htmlFor="panorama-date-to" className="text-xs">Fim</Label>
            <Input
              id="panorama-date-to"
              type="date"
              className="h-8 px-2 text-xs"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setActivePreset(null)
              }}
              min={from || undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={availableMonths.length < 3 || loading}
              onClick={() => handlePreset(3, "3m")}
              className={
                activePreset === "3m"
                  ? "border-primary/60 bg-primary/10 text-primary cursor-pointer disabled:cursor-not-allowed"
                  : "cursor-pointer disabled:cursor-not-allowed"
              }
            >
              Últimos 3 meses
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={availableMonths.length < 6 || loading}
              onClick={() => handlePreset(6, "6m")}
              className={
                activePreset === "6m"
                  ? "border-primary/60 bg-primary/10 text-primary cursor-pointer disabled:cursor-not-allowed"
                  : "cursor-pointer disabled:cursor-not-allowed"
              }
            >
              Últimos 6 meses
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!hasMonths || loading}
              onClick={() => handlePreset(availableMonths.length, "all")}
              className={
                activePreset === "all"
                  ? "border-primary/60 bg-primary/10 text-primary cursor-pointer disabled:cursor-not-allowed"
                  : "cursor-pointer disabled:cursor-not-allowed"
              }
            >
              Todos os meses
            </Button>
          </div>

          <div className="flex gap-2 pt-1 md:justify-end md:pt-0">
            <Button type="submit" size="sm" disabled={loading}>
              Aplicar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
