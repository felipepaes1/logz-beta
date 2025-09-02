"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart with a custom label"

const chartData = [
  { machine: "CNC 1", quantidade: 186, mobile: 80 },
  { machine: "Torno 2", quantidade: 275, mobile: 200 },
  { machine: "Torno 1", quantidade: 237, mobile: 120 },
  { machine: "Freasadora", quantidade: 73, mobile: 190 },
  { machine: "CNC 3", quantidade: 209, mobile: 130 },

]

const chartConfig = {
  quantidade: {
    label: "quantidade",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function ChartBarLabelTopMachines() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Consumo de Máquinas</CardTitle>
        <CardDescription>5 Máquinas mais consumistas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="machine"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="quantidade" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="quantidade"
              layout="vertical"
              fill="var(--color-quantidade)"
              radius={4}
            >
              <LabelList
                dataKey="machine"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
              />
              <LabelList
                dataKey="quantidade"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
    {/*    <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this machine <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 machines
        </div> */}
      </CardFooter>
    </Card>
  )
}
