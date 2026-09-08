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
import { useDashboardPanorama } from "@/components/dashboard-panorama-provider"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCollaboratorDisplayName,
  getCollaboratorInitials,
} from "@/lib/collaborator-display"

type Row = { id: string; nome: string; total: number }

export function TopColaboradoresCard() {
  const { data, loading } = useDashboardPanorama()

  const rows = React.useMemo<Row[]>(() => {
    const map = data?.tops_mes_atual.collaborators_top3 ?? []
    return map.map((r, index) => ({
      id: `${r.key}-${index}`,
      nome: getCollaboratorDisplayName(r),
      total: r.valor,
    }))
  }, [data])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="text-lg">Top 3 Colaboradores</CardTitle>
        <CardDescription>Top do Período</CardDescription>
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
                    <AvatarFallback>
                      {getCollaboratorInitials(c.nome)}
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
            {loading && rows.length === 0 && (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-sm text-muted-foreground">
                  Sem dados para o período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
