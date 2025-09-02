"use client"

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

type Colab = { id: number; nome: string; total: number }

const mock: Colab[] = [
  { id: 1, nome: "Fernando Ribeiro",      total: 8230 },
  { id: 2, nome: "Bruno Carvalho",   total: 7990 },
  { id: 3, nome: "Carlos Fernandes",  total: 7560 },
]

export function TopColaboradoresCard() {
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
            {mock.map((c) => (
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