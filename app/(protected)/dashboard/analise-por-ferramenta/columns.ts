import { ColumnDef, CellContext } from "@tanstack/react-table"
import rawData from "./data.json"

export type Ferramenta = {
  id: number
  codigo: number
  nome: string
  jan: number
  fev: number
  mar: number
  abr: number
  mai: number
  jun: number
  jul: number
  ago: number
  set: number
  out: number
  nov: number
  dez: number
  qtd: number
  total: number
}

export const tools: Ferramenta[] = rawData.map((item) => ({
  id: item.id,
  codigo: item["Cod."],
  nome: item["Nome da Ferramenta"],
  jan: item["Custo Jan"],
  fev: item["Custo Fev"],
  mar: item["Custo Mar"],
  abr: item["Custo Abr"],
  mai: item["Custo Mai"],
  jun: item["Custo Jun"],
  jul: item["Custo Jul"],
  ago: item["Custo Ago"],
  set: item["Custo Set"],
  out: item["Custo Out"],
  nov: item["Custo Nov"],
  dez: item["Custo Dez"],
  qtd: item["Qtd."],
  total: item["Total"],
}))

const toBRL = ({ getValue }: CellContext<Ferramenta, number>) =>
  getValue().toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

export const toolColumns: ColumnDef<Ferramenta>[] = [
  { accessorKey: "codigo", header: "Cód." },
  { accessorKey: "nome", header: "Nome da Ferramenta" },
  { accessorKey: "jan", header: "Custo Jan", cell: toBRL },
  { accessorKey: "fev", header: "Custo Fev", cell: toBRL },
  { accessorKey: "mar", header: "Custo Mar", cell: toBRL },
  { accessorKey: "abr", header: "Custo Abr", cell: toBRL },
  { accessorKey: "mai", header: "Custo Mai", cell: toBRL },
  { accessorKey: "jun", header: "Custo Jun", cell: toBRL },
  { accessorKey: "jul", header: "Custo Jul", cell: toBRL },
  { accessorKey: "ago", header: "Custo Ago", cell: toBRL },
  { accessorKey: "set", header: "Custo Set", cell: toBRL },
  { accessorKey: "out", header: "Custo Out", cell: toBRL },
  { accessorKey: "nov", header: "Custo Nov", cell: toBRL },
  { accessorKey: "dez", header: "Custo Dez", cell: toBRL },
  { accessorKey: "qtd", header: "Qtd." },
  { accessorKey: "total", header: "Total", cell: toBRL },
]   