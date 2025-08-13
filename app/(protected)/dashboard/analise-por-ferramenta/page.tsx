"use client"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
} from "recharts"
import { DataTable } from "@/components/data-table"
import { tools, toolColumns, Ferramenta } from "./columns"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"

type MonthKey =
  | "jan" | "fev" | "mar" | "abr" | "mai" | "jun"
  | "jul" | "ago" | "set" | "out" | "nov" | "dez"

const monthKeys: MonthKey[] = [
  "jan","fev","mar","abr","mai","jun",
  "jul","ago","set","out","nov","dez"
]

const chartData = monthKeys.map((m) => ({
  mes: m,
  valor: tools.reduce((acc, t) => acc + t[m], 0),
}))

export default function FerramentasOverview() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard – Análise por Ferramenta</h1>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Soma de Valor Consumido Total 💵</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <div className="px-4 lg:px-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillMes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" />
            <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
            <Area dataKey="valor" type="natural" fill="url(#fillMes)" stroke="var(--primary)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <DataTable<Ferramenta> data={tools} columns={toolColumns} />
    </section>
  )
}