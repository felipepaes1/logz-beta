"use client"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import * as React from "react"
import { FornecedorForm } from "@/components/fornecedores/form"
import { RowActions } from "@/components/fornecedores/row-actions"
import type { Fornecedor } from "@/components/fornecedores/types"
import initialData from "./data.json"

export default function Page() {
  const [rows, setRows] = React.useState<Fornecedor[]>(initialData)

  const columns = React.useMemo<ColumnDef<Fornecedor>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      { accessorKey: "empresa", header: "Empresa" },
      { accessorKey: "vendedor", header: "Vendedor" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "telefone", header: "Telefone" },
      { accessorKey: "prazo", header: "Prazo em dias (Lead Time)" },
      { accessorKey: "observacoes", header: "Observações" },
      {
        id: "actions",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onDelete={(id) =>
              setRows((prev) => prev.filter((r) => r.id !== id))
            }
            onSave={(id, f) =>
              setRows((prev) =>
                prev.map((r) => (r.id === id ? { ...r, ...f } : r))
              )
            }
          />
        ),
      },
    ],
    [setRows]
  )

  const form = (
    <FornecedorForm
      title="Novo Fornecedor"
      onSubmit={(f) =>
        setRows((prev) => [...prev, { id: prev.length + 1, ...f }])
      }
    />
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DataTable
            data={rows}
            onDataChange={setRows}
            columns={columns}
            addButtonLabel="Novo Fornecedor"
            renderAddForm={form}
          />
        </div>
      </div>
    </div>
  )
}
