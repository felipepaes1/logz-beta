"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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

const chartData = [
  { month: "January", Consumido: "R$ 15.230", Comprado: "R$ 19.840" },
  { month: "February", Consumido: "R$ 28.950", Comprado: "R$ 17.560" },
  { month: "March", Consumido: "R$ 17.420", Comprado: "R$ 23.110" },
  { month: "April", Consumido: "R$ 26.400", Comprado: "R$ 11.890" },
  { month: "May", Consumido: "R$ 19.570", Comprado: "R$ 24.320" },
  { month: "June", Consumido: "R$ 22.890", Comprado: "R$ 16.740" },
]

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

export function ChartLineMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico mensal de Consumido e Consumos</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => String(v).slice(0, 3)}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="Consumido"
              type="monotone"
              stroke="var(--color-Consumido)"
              strokeWidth={2}
              dot={true}
            />
            <Line
              dataKey="Comprado"
              type="monotone"
              stroke="var(--color-Comprado)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
