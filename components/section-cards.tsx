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
import { DashboardPanoramaResource, type DashboardPanoramaAttributes } from "@/resources/Dashboard/dashboard.resource"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

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
    .filter((point) => point.periodDate && point.periodDate < currentMonthStart && Number.isFinite(point.consumo) && Number.isFinite(point.compra))
    .sort((a, b) => (a.periodDate!.getTime() - b.periodDate!.getTime()))
}

type Props = { tenantId: number }
export function SectionCards({ tenantId }: Props) {
  const [data, setData] = React.useState<DashboardPanoramaAttributes | null>(null)
  const [value, setValue] = React.useState([0])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await DashboardPanoramaResource.panorama()
      if (!mounted) return
      setData(res)

      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const closedPoints = getClosedMonthsPoints(res?.series?.consumo_x_compras, currentMonthStart)
      if (closedPoints.length >= 3) {
        const lastThree = closedPoints.slice(-3)
        const totalConsumo = lastThree.reduce((acc, point) => acc + point.consumo, 0)
        const totalCompra = lastThree.reduce((acc, point) => acc + point.compra, 0)
        const pct = totalCompra > 0 ? (totalConsumo / totalCompra) * 100 : 0
        const rounded = Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0
        setValue([rounded])
      } else {
        setValue([0])
      }
    })()
    return () => { mounted = false }
  }, [tenantId])
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
    if (value > 100) return "Consumo maior que compra → risco de ruptura/estoque zerado"
    if (value >= 90) return "Alta eficiência, compras e consumo equilibrados"
    if (value >= 70) return "Média eficiência, há margem para otimizar"
    return "Baixa eficiência, compras excessivas em relação ao consumo"
  }

  const comprasTotal = data?.cards.compras.total ?? 0
  const consumosTotal = data?.cards.consumos.total ?? 0
  const saldoEstoque = data?.cards.estoque_sem_movimentacao.total ?? 0

  const alertas = (data?.cards.alertas_preview ?? []).map(a => ({
    id: a.item_id, nome: a.name, qtd_minima: a.min_qty, saldo: a.qty
  }))

  const hasSufficientData = React.useMemo(() => {
    if (!data) return false
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const closedPoints = getClosedMonthsPoints(data?.series?.consumo_x_compras, currentMonthStart)
    return closedPoints.length >= 3
  }, [data])

  const displayValue = hasSufficientData ? (value?.[0] ?? 0) : 0

  return (
      <div className="grid grid-cols-1 items-stretch gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

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
      {/* ESTOQUE SEM MOVIMENTAÇÃO */}
      <div
        role="group"
        aria-label="Saldo de estoque - indicadores"
        className="flex flex-1 h-full items-center gap-4 mt-4 rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-2 shadow-xs dark:border-rose-500/20 dark:bg-rose-950/40 cursor-help"
      >
        <IconAlertTriangle aria-hidden className="size-7 text-rose-600 dark:text-rose-400" />
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
            value={[displayValue]}
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
        monthLabel={new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date())}
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
    <CardDescription className="flex items-center gap-1.5">

    </CardDescription>
  </CardHeader>

  <CardContent className="px-6 pb-0">
    {/* Cabeçalho das colunas */}
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
