"use client"

import React from "react"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"
import type { TooltipProps } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useDashboardPanorama } from "@/components/dashboard-panorama-provider"

export const description = "A multiple line chart"

function toMonthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  const d = new Date(y, (m - 1), 1)
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d)
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

const chartConfig = {
  Consumido: {
    label: "Consumido",
    color: "var(--chart-1)",
  },
  Comprado: {
    label: "Comprado",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
})
const formatBRL = (v: number) => brl.format(v ?? 0)

const formatBRLCompact = (v: number) => {
  const valueInThousands = v / 1000
  return `R$ ${valueInThousands.toLocaleString("pt-BR", {
    maximumFractionDigits: valueInThousands % 1 === 0 ? 0 : 1, // arredonda se for inteiro
  })} mil`
}

type SeriesPoint = { period: string; consumo: number; compra: number }
type PanoramaLite = {
  period: { from?: string | null; to?: string | null; months: string[] }
  series: { consumo_x_compras: SeriesPoint[] }
}


export function ChartLineMultiple() {
  const { data, loading } = useDashboardPanorama()

  const rows = React.useMemo(() => {
    const parsed = data as unknown as PanoramaLite | null
    if (!parsed) return []
    const monthsFromPeriod = (parsed.period?.months ?? [])
      .map((m) => m?.slice(0, 7))
      .filter(Boolean) as string[]
    const monthSet = new Set(monthsFromPeriod)

    return (parsed.series?.consumo_x_compras ?? [])
      .map((point) => ({
        ...point,
        monthKey: (point.period ?? "").slice(0, 7),
      }))
      .filter((point) => {
        if (!point.monthKey) return false
        if (!monthSet.size) return true
        return monthSet.has(point.monthKey)
      })
      .sort(
        (a, b) =>
          new Date(`${a.monthKey}-01`).getTime() -
          new Date(`${b.monthKey}-01`).getTime()
      )
      .map((p) => ({
        month: toMonthLabel(p.monthKey),
        Consumido: p.consumo,
        Comprado: p.compra,
      }))
  }, [data])

  const range = React.useMemo(() => {
    const from = formatDateLabel(data?.period?.from ?? null)
    const to = formatDateLabel(data?.period?.to ?? null)
    if (from && to) return `${from} até ${to}`
    if (from) return `Desde ${from}`
    if (to) return `Até ${to}`
    return "Ano atual"
  }, [data?.period?.from, data?.period?.to])

  const CustomTooltip = React.useCallback(
    ({ active, payload, label }: TooltipProps<number, string>) => {
      if (!active || !payload?.length) return null
      return (
        <div className="rounded-md border bg-popover/95 p-3 text-xs shadow-md backdrop-blur-sm dark:bg-popover/80">
          <div className="mb-2 font-medium">{label}</div>
          <div className="space-y-3">
            {payload.map((item) => (
              <div
                key={item.dataKey}
                className="flex items-center gap-x-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block size-2 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span>{item.name ?? item.dataKey}</span>
                </div>
                <span className="tabular-nums font-semibold ml-auto">
                  {formatBRL(Number(item.value))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    []
  )

  return (
    <Card>
      <CardHeader className="gap-1">
        <div>
          <CardTitle>Histórico mensal de Consumido e Comprado</CardTitle>
          <CardDescription>{range}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full" aria-busy={loading}>
          <LineChart
            accessibilityLayer
            data={rows}
            margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => String(v).slice(0, 3)}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={64}
              tickFormatter={(v) => formatBRLCompact(Number(v))}
            />

            <Tooltip cursor={false} content={<CustomTooltip />} />

            <Line
              dataKey="Consumido"
              name="Consumido"
              type="linear"
              stroke="var(--color-Consumido)"
              strokeWidth={2}
              dot
              isAnimationActive={false}
            />
            <Line
              dataKey="Comprado"
              name="Comprado"
              type="linear"
              stroke="var(--color-Comprado)"
              strokeWidth={2}
              dot
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
        {(!loading && rows.length === 0) && (
          <p role="status" className="mt-2 text-sm text-muted-foreground">
            Sem dados para o período selecionado.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
