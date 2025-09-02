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

export function SectionCards() {
  const [value] = React.useState([60])
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

  const comprasTotal = 121_524.39
  const consumosTotal = 90_838.32
  const saldoEstoque = 2_345

  const alertas = [
    { id: 1, nome: "INSERT RCGT 1204", qtd_minima: 4, saldo: 3 },
    { id: 2, nome: "BROCA Ø6 mm HSS", qtd_minima: 6, saldo: 5 },
    { id: 3, nome: "LIMA ROTATIVA P803", qtd_minima: 4, saldo: 2 },
    { id: 4, nome: "LIMA DO FREIO", qtd_minima: 3, saldo: 2 },
  ]

  return (
      <div className="grid grid-cols-1 items-stretch gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* === 3 STRIPS — sem Card, gap mínimo entre eles === */}
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

  {/* ESTOQUE SEM MOVIMENTAÇÃO */}
  <div
    role="group"
    aria-label="Saldo de estoque - indicadores"
    className="flex flex-1 h-full items-center gap-4 mt-4 rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-2 shadow-xs dark:border-rose-500/20 dark:bg-rose-950/40"
  >
    <IconAlertTriangle aria-hidden className="size-7 text-rose-600 dark:text-rose-400" />
    <div className="flex w-full items-center gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-rose-800/80 d  ark:text-rose-200">Estoque sem Movimentação</p>
        <p className="truncate text-lg font-semibold tabular-nums text-rose-950 dark:text-rose-50">
           {saldoEstoque.toLocaleString("pt-BR",{
            style: "currency",
            currency: "BRL",
          })}
         </p>
      </div>
    </div>
  </div>
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
            value={value}
            disabled
            className="w-full"
            rangeClassName={getColor(value[0])}
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
            <span className="text-lg font-bold">{getLabel(value[0])}</span>
            <span className="block text-sm">{value[0]}%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
      <div className="text-muted-foreground leading-none">
          {getLabelFooter(value[0])}
        </div>
      </CardFooter>
    </Card>

      <ChartBarMonthlyBalance
      monthLabel="Setembro/2025"
      compras={5182300}
      consumo={4721000}
      valuesInCents
      avgCompras={60000} 
      avgConsumo={35000}
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