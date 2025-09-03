"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, LineProps } from "recharts"

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

export const description = "A multiple line chart"

// 1) Use números puros
const chartData = [
  { month: "January", Consumido: 15230, Comprado: 19840 },
  { month: "February", Consumido: 28950, Comprado: 17560 },
  { month: "March", Consumido: 17420, Comprado: 23110 },
  { month: "April", Consumido: 26400, Comprado: 11890 },
  { month: "May", Consumido: 19570, Comprado: 24320 },
  { month: "June", Consumido: 22890, Comprado: 16740 },
]

// 2) Configura cores; o ChartContainer cria --color-Consumido e --color-Comprado
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

// 3) Formatador BRL para ticks/tooltip
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})
const formatBRL = (v: number) => brl.format(v ?? 0)

export function ChartLineMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico mensal de Consumido e Comprado</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        {/* use uma altura real do Tailwind (ex.: h-64 ou h-[260px]) */}
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
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

            {/* 4) Adicione YAxis com formatação BRL */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={64}
              tickFormatter={(v) => formatBRL(Number(v))}
            />

            {/* Tooltip com valores em BRL */}
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
      </CardContent>
    </Card>
  )
}
