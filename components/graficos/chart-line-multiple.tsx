"use client"

import React from "react"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DashboardPanoramaResource } from "@/resources/Dashboard/dashboard.resource"
import { toast } from "sonner"

export const description = "A multiple line chart"

function toMonthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  const d = new Date(y, (m - 1), 1)
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d)
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
  maximumFractionDigits: 0,
})
const formatBRL = (v: number) => brl.format(v ?? 0)

type SeriesPoint = { period: string; consumo: number; compra: number }
type PanoramaLite = {
  period: { from?: string | null; to?: string | null; months: string[] }
  series: { consumo_x_compras: SeriesPoint[] }
}


export function ChartLineMultiple() {
  const [rows, setRows] = React.useState<{ month: string; Consumido: number; Comprado: number }[]>([])
  const [range, setRange] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(false)
  const requestIdRef = React.useRef(0)

   const yearParams = React.useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const from = `${y}-01-01`
    const to = `${y}-12-31`
    return { date_from: from, date_to: to }
  }, [])

  const fetchData = React.useCallback(async (params: { date_from?: string | null; date_to?: string | null }) => {
    const myId = ++requestIdRef.current
    setLoading(true)
    try {
      const res = await DashboardPanoramaResource.panorama(params)
      const parsed = res as unknown as PanoramaLite

      const data = (parsed.series.consumo_x_compras ?? []).map(p => ({
        month: toMonthLabel(p.period),
        Consumido: p.consumo,
        Comprado: p.compra,
      }))
      if (myId !== requestIdRef.current) return
      setRows(data)
      const months = parsed.period.months
      setRange(months?.length ? `${months[0]} - ${months.at(-1)}` : "")
    } catch (e: any) {
      console.error(e)
      if (myId === requestIdRef.current) toast.error("Falha ao carregar panorama")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData(yearParams)
  }, [fetchData, yearParams])

  const CustomTooltip = React.useCallback(
  ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-md border bg-popover/95 p-3 text-xs shadow-md backdrop-blur-sm dark:bg-popover/80">
        <div className="mb-2 font-medium">{label}</div>
        <div className="space-y-3">
          {payload.map((item: any) => (
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
              tickFormatter={(v) => formatBRL(Number(v))}
            />

            <Tooltip cursor={false} content={<CustomTooltip />} />

            <Line
              dataKey="Consumido"
              name="Consumido"
              type="monotone"
              stroke="var(--color-Consumido)"
              strokeWidth={2}
              dot
              isAnimationActive={false}
            />
            <Line
              dataKey="Comprado"
              name="Comprado"
              type="monotone"
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
