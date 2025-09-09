"use client"

import React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DashboardPanoramaResource } from "@/resources/Dashboard/dashboard.resource"

type Row = { id: string; nome: string; total: number }
type Props = { tenantId: number }

export function TopColaboradoresCard({ tenantId }: Props) {
  const [rows, setRows] = React.useState<Row[]>([])
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await DashboardPanoramaResource.panorama()
      if (!mounted) return
      const map = res.tops_mes_atual.collaborators_top3 ?? []
      setRows(map.map(r => ({ id: r.key, nome: r.name ?? r.key, total: r.valor })))
    })()
    return () => { mounted = false }
  }, [tenantId])
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="text-lg">Top 3 colaboradores</CardTitle>
        <CardDescription>Consumo no último mês</CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Colaborador</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Avatar className="size-8">
                    {/* Sem AvatarImage → usa apenas o fallback padrão */}
                    <AvatarFallback>
                      {c.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                <TableCell>{c.nome}</TableCell>

                <TableCell className="text-right font-medium">
                  {c.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}