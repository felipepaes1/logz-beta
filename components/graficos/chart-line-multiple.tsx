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
  { month: "January", quantity: 186, quantidade: 80 },
  { month: "February", quantity: 305, quantidade: 200 },
  { month: "March", quantity: 237, quantidade: 120 },
  { month: "April", quantity: 73, quantidade: 190 },
  { month: "May", quantity: 209, quantidade: 130 },
  { month: "June", quantity: 214, quantidade: 140 },
]

const chartConfig = {
  quantity: {
    label: "quantity",
    color: "var(--chart-1)",
  },
  quantidade: {
    label: "quantidade",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

export function ChartLineMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico mensal de Compras e Consumos</CardTitle>
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
              dataKey="quantity"
              type="monotone"
              stroke="var(--color-quantity)"
              strokeWidth={2}
              dot={true}
            />
            <Line
              dataKey="quantidade"
              type="monotone"
              stroke="var(--color-quantidade)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
