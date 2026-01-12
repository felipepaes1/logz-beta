"use client"

import React from "react"
import Link from "next/link"
import {
  IconShoppingCart,
  IconActivityHeartbeat,
  IconAlertTriangle,
} from "@tabler/icons-react"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ChartBarMonthlyBalance } from "@/components/graficos/chart-bar-monthly-balance"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useDashboardPanorama } from "@/components/dashboard-panorama-provider"

type ConsumoCompraPoint = { period?: string | null; consumo?: number; compra?: number }

function periodToMonthDate(value?: string | null) {
  if (!value) return null
  const sanitized = value.slice(0, 7)
  const [yearStr, monthStr] = sanitized.split("-")
  if (!yearStr || !monthStr) return null
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return new Date(year, month - 1, 1)
}

function getClosedMonthsPoints(series: ConsumoCompraPoint[] | undefined, currentMonthStart: Date) {
  return (Array.isArray(series) ? series : [])
    .map((point) => ({
      consumo: Number(point?.consumo ?? 0),
      compra: Number(point?.compra ?? 0),
      periodDate: periodToMonthDate(point?.period ?? null),
    }))
    .filter(
      (point) =>
        point.periodDate &&
        point.periodDate < currentMonthStart &&
        Number.isFinite(point.consumo) &&
        Number.isFinite(point.compra)
    )
    .sort((a, b) => a.periodDate!.getTime() - b.periodDate!.getTime())
}

function parseReferenceDate(value?: string | null) {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function SectionCards() {
  const { data, loading } = useDashboardPanorama()

  const referenceDate = React.useMemo(
    () => parseReferenceDate(data?.period?.to ?? null),
    [data?.period?.to]
  )

  const currentMonthStart = React.useMemo(
    () => new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
    [referenceDate]
  )

  const { displayValue, hasSufficientData } = React.useMemo(() => {
    const closedPoints = getClosedMonthsPoints(
      data?.series?.consumo_x_compras,
      currentMonthStart
    )
    if (closedPoints.length >= 3) {
      const lastThree = closedPoints.slice(-3)
      const totalConsumo = lastThree.reduce(
        (acc, point) => acc + point.consumo,
        0
      )
      const totalCompra = lastThree.reduce(
        (acc, point) => acc + point.compra,
        0
      )
      const pct = totalCompra > 0 ? (totalConsumo / totalCompra) * 100 : 0
      const rounded = Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0
      return { displayValue: rounded, hasSufficientData: true }
    }
    return { displayValue: 0, hasSufficientData: false }
  }, [currentMonthStart, data?.series?.consumo_x_compras])

  const getColor = (value: number) => {
    if (value > 100) return "bg-red-600"
    if (value >= 90) return "bg-green-600"
    if (value >= 70) return "bg-yellow-400"
    return "bg-red-600"
  }

  const getLabel = (value: number) => {
    if (value > 100) return "CRÍTICO"
    if (value >= 90) return "EFICIENTE"
    if (value >= 70) return "RAZOÁVEL"
    return "CRÍTICO"
  }

  const getLabelFooter = (value: number) => {
    if (value > 100) return "Consumo maior que compra -> risco de ruptura/estoque zerado"
    if (value >= 90) return "Alta eficiência, compras e consumo equilibrados"
    if (value >= 70) return "Média eficiência, há margem para otimizar"
    return "Baixa eficiência, compras excessivas em relação ao consumo"
  }

  const { comprasTotal, consumosTotal } = React.useMemo(() => {
    const fallback = {
      comprasTotal: data?.cards.compras.total ?? 0,
      consumosTotal: data?.cards.consumos.total ?? 0,
    }

    const series = Array.isArray(data?.series?.consumo_x_compras)
      ? data?.series?.consumo_x_compras
      : []
    if (!series.length) return fallback

    const monthsFromPeriod = (data?.period?.months ?? [])
      .map((m) => m?.slice(0, 7))
      .filter(Boolean) as string[]
    const monthSet = new Set(monthsFromPeriod)

    let comprasSum = 0
    let consumosSum = 0
    let hasPoint = false

    for (const point of series) {
      const monthKey = (point?.period ?? "").slice(0, 7)
      if (!monthKey) continue
      if (monthSet.size && !monthSet.has(monthKey)) continue
      const compraVal = Number(point?.compra ?? 0)
      const consumoVal = Number(point?.consumo ?? 0)
      if (Number.isFinite(compraVal)) comprasSum += compraVal
      if (Number.isFinite(consumoVal)) consumosSum += consumoVal
      hasPoint = true
    }

    if (!hasPoint) return fallback
    return { comprasTotal: comprasSum, consumosTotal: consumosSum }
  }, [data?.cards.compras.total, data?.cards.consumos.total, data?.period?.months, data?.series?.consumo_x_compras])
  const saldoEstoque = data?.cards.estoque_sem_movimentacao.total ?? 0

  const alertas = (data?.cards.alertas_preview ?? []).map((a) => ({
    id: a.item_id,
    nome: a.name,
    qtd_minima: a.min_qty,
    saldo: a.qty,
  }))

  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
        referenceDate
      ),
    [referenceDate]
  )

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4" aria-busy={loading}>
      <div className="h-full flex flex-col gap-[2px]">
        {/* COMPRAS */}
        <div
          role="group"
          aria-label="Compras - indicadores"
          className="
      flex flex-1 h-full items-center gap-4
      rounded-xl border px-4 py-2 shadow-xs
      border-gray-300 bg-gray-100 text-gray-700
      dark:border-gray-500/20 dark:bg-gray-900/40 dark:text-gray-200
    "
        >
          <IconShoppingCart
            aria-hidden
            className="size-7 text-gray-500 dark:text-gray-400"
          />
          <div className="flex w-full items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Valor Total Comprado
              </p>
              <p className="truncate text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                {comprasTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* CONSUMOS */}
        <div
          role="group"
          aria-label="Consumos - indicadores"
          className="
      mt-4 flex flex-1 h-full items-center gap-4
      rounded-xl border px-4 py-2 shadow-xs
      border-blue-300 bg-blue-100 text-blue-700
      dark:border-blue-500/20 dark:bg-blue-900/40 dark:text-blue-200
    "
        >
          <IconActivityHeartbeat
            aria-hidden
            className="size-7 text-blue-500 dark:text-blue-400"
          />
          <div className="flex w-full items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                Valor Total Consumido
              </p>
              <p className="truncate text-lg font-semibold tabular-nums text-blue-900 dark:text-blue-50">
                {consumosTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
        </div>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* ESTOQUE SEM MOVIMENTACAO */}
              <div
                role="group"
                aria-label="Saldo de estoque - indicadores"
                className="flex flex-1 h-full items-center gap-4 mt-4 rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-2 shadow-xs dark:border-rose-500/20 dark:bg-rose-950/40 cursor-help"
              >
                <IconAlertTriangle
                  aria-hidden
                  className="size-7 text-rose-600 dark:text-rose-400"
                />
                <div className="flex w-full items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-rose-800/80 dark:text-rose-200">
                      Estoque sem Movimentação
                    </p>
                    <p className="truncate text-lg font-semibold tabular-nums text-rose-950 dark:text-rose-50">
                      {saldoEstoque.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="text-sm dark:text-white">
              Itens sem movimentação de estoque nos últimos 6 meses
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Eficiência de Compra</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center pb-0">
          <div className="w-full max-w-md mx-auto">
            {/* Slider */}
            <Slider
              min={0}
              max={120}
              step={1}
              value={[hasSufficientData ? displayValue : 0]}
              disabled
              className="w-full"
              rangeClassName={getColor(displayValue)}
              showMarkLabels
              marks={[
                { value: 70, variant: "line", className: "bg-red-800", label: "70%" },
                { value: 90, variant: "line", className: "bg-yellow-400", label: "90%" },
                { value: 100, variant: "line", className: "bg-green-600", label: "100%" },
              ]}
              segments={[
                { from: 0, to: 70, className: "bg-red-800/25" },
                { from: 70, to: 90, className: "bg-yellow-400/25" },
                { from: 90, to: 100, className: "bg-green-600/25" },
                { from: 100, to: 120, className: "bg-red-600/25" },
              ]}
            />

            <div className="text-center mt-4">
              <span className="text-lg font-bold">{getLabel(displayValue)}</span>
              <span className="block text-sm">{displayValue}%</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-muted-foreground leading-none">
            {hasSufficientData
              ? getLabelFooter(displayValue)
              : "Sem dados suficientes para calcular eficiência de compra"}
          </div>
        </CardFooter>
      </Card>

      <ChartBarMonthlyBalance
        monthLabel={monthLabel}
        compras={data?.cards.acompanhamento_mes_atual.compras_mes_atual ?? 0}
        consumo={data?.cards.acompanhamento_mes_atual.consumo_mes_atual ?? 0}
        valuesInCents={false}
        avgCompras={data?.cards.acompanhamento_mes_atual.media_compras_3m ?? 0}
        avgConsumo={data?.cards.acompanhamento_mes_atual.media_consumo_3m ?? 0}
      />

      {/* ALERTAS */}
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="size-4 text-amber-500" />
            <CardTitle>Alertas (Estoque baixo)</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1.5"></CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-0">
          {/* Cabecalho das colunas */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center mb-2 text-xs font-medium text-muted-foreground">
            <span></span>
            <span className="text-center">Qtd atual</span>
          </div>

          <ul className="grid gap-2 text-sm">
            {alertas.slice(0, 4).map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-[1fr_auto_auto] items-center"
              >
                <span className="truncate">{a.nome}</span>
                <strong>{a.saldo}</strong>
              </li>
            ))}
            {!alertas.length && (
              <li className="text-sm text-muted-foreground">
                Nenhum alerta para o período selecionado.
              </li>
            )}
          </ul>
        </CardContent>

        <CardFooter className="justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href="/ferramentas">Ver todos</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
