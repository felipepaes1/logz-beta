"use client"

import {
  IconShoppingCart,
  IconActivityHeartbeat,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import React from "react"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

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
  const comprasMedia = 20_254.07
  const consumosTotal = 90_838.32
  const consumosMedia = 15_139.72

  const alertas = [
    { id: 1, nome: "INSERT RCGT 1204", saldo: 3 },
    { id: 2, nome: "BROCA Ø6 mm HSS", saldo: 5 },
    { id: 3, nome: "LIMA ROTATIVA P803", saldo: 2 },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 *:shadow-xs *:bg-gradient-to-t *:from-primary/5 *:to-card dark:*:bg-card @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* COMPRAS */}
<Card>
  <CardHeader className="items-start gap-2">
    <IconShoppingCart className="size-10 text-gray-400" />
    <div>
      <CardDescription className="flex flex-col text-lg mb-2">
        Compras | Valor Total
      </CardDescription>
      <CardTitle className="text-2xl tabular-nums">
        {comprasTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </CardTitle>
    </div>
  </CardHeader>

  <CardFooter className="flex-col items-start gap-1.5">
    <CardDescription className="flex flex-col text-lg mb-2">
      Média Mensal
    </CardDescription>
    <CardTitle className="text-2xl tabular-nums">
      {comprasMedia.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
    </CardTitle>
  </CardFooter>
</Card>

{/* CONSUMOS */}
<Card>
  <CardHeader className="items-start gap-2">
    <IconActivityHeartbeat className="size-10 text-sky-600" />
    <div>
      <CardDescription className="flex flex-col text-lg mb-2">
        Consumos | Valor Total
      </CardDescription>
      <CardTitle className="text-2xl tabular-nums">
        {consumosTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </CardTitle>
    </div>
  </CardHeader>

  <CardFooter className="flex-col items-start gap-1.5">
    <CardDescription className="flex flex-col text-lg mb-2">
      Média Mensal
    </CardDescription>
    <CardTitle className="text-2xl tabular-nums">
      {consumosMedia.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
    </CardTitle>
  </CardFooter>
</Card>

      {/* ALERTAS */}
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconAlertTriangle className="size-4 text-amber-500" />
            Alertas (Estoque baixo)
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-0">
          <ul className="grid gap-2 text-sm">
            {alertas.slice(0, 3).map((a) => (
              <li key={a.id} className="flex justify-between">
                <span className="truncate">{a.nome}</span>
                <Badge variant="destructive">{a.saldo}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="justify-end">
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Eficiência de Compra</CardTitle>
        <CardDescription>Últimos 3 meses</CardDescription>
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
    </div>
  )
}