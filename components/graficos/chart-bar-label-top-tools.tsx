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
  { tool: "Inserto BDMT", quantity: 150, mobile: 80 },
  { tool: "Bedame 4mm", quantity: 100, mobile: 200 },
  { tool: "Broca MD D10", quantity: 137, mobile: 120 },
  { tool: "Broca de 14", quantity: 84, mobile: 190 },
  { tool: "Macho ", quantity: 100, mobile: 130 },
]

const chartConfig = {
  quantity: {
    label: "quantity",
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

export function ChartBarLabelTopTools() {
  return (
      <Card>
        <CardHeader>
          <CardTitle>Top Consumo de Ferramentas</CardTitle>
          <CardDescription>5 Ferramentas mais consumistas</CardDescription>
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
                dataKey="tool"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis dataKey="quantity" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="quantity"
                layout="vertical"
                fill="var(--color-quantity)"
                radius={4}
              >
                <LabelList
                  dataKey="tool"
                  position="insideLeft"
                  offset={8}
                  className="fill-(--color-label)"
                  fontSize={12}
                />
                <LabelList
                  dataKey="quantity"
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
            Trending up by 5.2% this tool <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Showing total visitors for the last 6 tools
          </div> */}
        </CardFooter>
      </Card>
    )
  }
