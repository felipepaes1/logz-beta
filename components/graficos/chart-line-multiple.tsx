"use client"

import React from "react"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { z } from "zod"

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

const TimeRangeOptionSchema = z.object({
  key: z.enum(["current_year", "last_semester", "all_years"]),
  label: z.string(),
  enabled: z.boolean(),
  from: z.string().nullable(),
  to: z.string().nullable(),
})
const FiltersSchema = z.object({
  time_ranges: z.array(TimeRangeOptionSchema),
  available_months: z.array(z.string()),
})
const SeriesPointSchema = z.object({
  period: z.string(), // YYYY-MM
  consumo: z.number(),
  compra: z.number(),
})
const PanoramaSchema = z.object({
  period: z.object({
    from: z.string().nullable().optional(),
    to: z.string().nullable().optional(),
    months: z.array(z.string()),
  }),
  filters: FiltersSchema.optional(), // backend antigo ainda funciona sem travar
  series: z.object({
    consumo_x_compras: z.array(SeriesPointSchema),
  }),
})


export function ChartLineMultiple() {
  const [timeRange, setTimeRange] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<{ month: string; Consumido: number; Comprado: number }[]>([])
  const [range, setRange] = React.useState<string>("")
  const [options, setOptions] = React.useState<Array<z.infer<typeof TimeRangeOptionSchema>>>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  const requestIdRef = React.useRef(0)

   const fetchData = React.useCallback(async (params?: { date_from?: string | null; date_to?: string | null }) => {
    const myId = ++requestIdRef.current
    setLoading(true)
    try {
      const res = await DashboardPanoramaResource.panorama(params)
      const parsed = PanoramaSchema.parse(res)

      const data = (parsed.series.consumo_x_compras ?? []).map(p => ({
        month: toMonthLabel(p.period),
        Consumido: p.consumo,
        Comprado: p.compra,
      }))
      if (myId !== requestIdRef.current) return
      setRows(data)
      const months = parsed.period.months
      setRange(months?.length ? `${months[0]} - ${months.at(-1)}` : "")

      const opts = parsed.filters?.time_ranges?.filter(o => o.enabled) ?? []
      setOptions(opts)
    } catch (e: any) {
      console.error(e)
      toast.error("Falha ao carregar panorama")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    if (timeRange) return
    if (!options.length) return
    const prefer = options.find(o => o.key === "current_year") ?? options[0]
    if (prefer) setTimeRange(prefer.key)
  }, [options, timeRange])

  // 3) Ao mudar o timeRange, refaz a busca com os from/to da opção
  React.useEffect(() => {
    if (!timeRange) return
    const chosen = options.find(o => o.key === timeRange)
    if (!chosen || !chosen.from || !chosen.to) return
    fetchData({ date_from: chosen.from, date_to: chosen.to })
  }, [timeRange, options, fetchData])

  // Handler do Select separado (apenas setState)
  const onChangeTimeRange = (val: string) => {
    setTimeRange(val)
  }
  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Histórico mensal de Consumido e Comprado</CardTitle>
            <CardDescription>{range}</CardDescription>
          </div>
          {options.length > 0 && (
            <Select value={timeRange ?? undefined} onValueChange={onChangeTimeRange}>
              <SelectTrigger
                className="w-[220px] rounded-lg"
                aria-label="Selecionar período"
              >
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {options.map(o => (
                  <SelectItem key={o.key} value={o.key} className="rounded-lg">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent valueFormatter={(v) => formatBRL(Number(v))} />}
            />

            <Line
              dataKey="Consumido"
              type="monotone"
              stroke="var(--color-Consumido)"
              strokeWidth={2}
              dot
              isAnimationActive={false}
            />
            <Line
              dataKey="Comprado"
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
