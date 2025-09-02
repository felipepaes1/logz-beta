"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from "recharts"

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

type Currency = "BRL" | "USD" | "EUR"

export interface PurchaseConsumptionBarProps {
  monthLabel?: string
  compras: number
  consumo: number
  valuesInCents?: boolean
  currency?: Currency
  title?: string
  description?: string
  avgCompras?: number
  avgConsumo?: number
}

const mkCurrency = (currency: Currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency })

const chartConfig: ChartConfig = {
  value: {
    label: "Valor",
    color: "var(--chart-1)",
  },
  comprasAvg: {
    label: "Média Compras",
    color: "var(--chart-3)",
  },
  consumoAvg: {
    label: "Média Consumo",
    color: "var(--chart-4)",
  },
}

export function ChartBarMonthlyBalance({
  compras,
  consumo,
  valuesInCents = false,
  currency = "BRL",
  title = "Acompanhamento mês atual",
  description,
  avgCompras = 60000,
  avgConsumo = 55000,
}: PurchaseConsumptionBarProps) {
  const nf = React.useMemo(() => mkCurrency(currency), [currency])

  const factor = valuesInCents ? 0.01 : 1
  const comprasVal = (compras ?? 0) * factor
  const consumoVal = (consumo ?? 0) * factor

  const isEmpty = comprasVal === 0 && consumoVal === 0

  const chartData = [
    { tipo: "Compras", value: comprasVal },
    { tipo: "Consumo", value: consumoVal },
  ]

  // calcula o topo do eixo Y considerando as médias
  const computeMax = React.useMemo(() => {
    const dataMax = Math.max(comprasVal, consumoVal)
    const lineMax = Math.max(avgCompras, avgConsumo)
    // pequeno headroom para o label da linha
    return Math.max(dataMax, lineMax) * 1.1
  }, [comprasVal, consumoVal, avgCompras, avgConsumo])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {title}
        </CardTitle>
        <CardDescription>
          {description ?? "Média comparativa (Últ. 3 meses)"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            accessibilityLayer
            margin={{ top: 8, left: 8, right: 64, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="tipo"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={{ opacity: 0.08 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => nf.format(Number(value))}
                />
              }
            />

            {/* Barras (mais finas) com cores por item */}
            <Bar dataKey="value" name="Valor" radius={8} barSize={60}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    entry.tipo === "Consumo"
                      ? "var(--color-desktop, var(--chart-1))" // consumo
                      : "var(--muted-foreground)" // compras
                  }
                />
              ))}
            </Bar>

            {/* Linhas de referência (médias) - ficam acima pois vêm DEPOIS das barras */}
            <ReferenceLine
              y={avgCompras}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeWidth={1.25}
              ifOverflow="extendDomain"
              label={{
                value: nf.format(avgCompras),
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 11,
                dx: -5,
              }}
            />
            <ReferenceLine
              y={avgConsumo}
              stroke="var(--color-desktop, var(--chart-1))"
              strokeDasharray="3 3"
              strokeWidth={1.25}
              ifOverflow="extendDomain"
              label={{
                value: nf.format(avgConsumo),
                position: "right",
                fill: "var(--color-desktop, var(--chart-1))",
                fontSize: 11,
                dx: -5,
              }}
            />
          </BarChart>
        </ChartContainer>

        {isEmpty ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 text-sm text-muted-foreground"
          >
            Sem dados para exibir neste mês.
          </div>
        ) : (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Compras</dt>
              <dd className="font-medium">{nf.format(comprasVal)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Consumo</dt>
              <dd className="font-medium">{nf.format(consumoVal)}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}

export default ChartBarMonthlyBalance
