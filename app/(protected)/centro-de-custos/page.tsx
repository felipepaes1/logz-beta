"use client"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import * as React from "react"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { CentroCustoForm } from "@/components/centro-de-custos/form"
import { RowActions } from "@/components/centro-de-custos/row-actions"
import type { CentroCusto } from "@/components/centro-de-custos/types"
import { PluralResponse } from "coloquent"


export default function Page() {
  const [rows, setRows] = React.useState<CentroCusto[]>([])
  const [machines, setMachines] = React.useState<MachineResource[]>([])

  React.useEffect(() => {
    MachineResource.get().then((response: PluralResponse<MachineResource>) => {
      setMachines(response.getData())
    })
  }, [])

  React.useEffect(() => {
    const formatted = machines.map((m) => ({
      id: Number(m.getApiId()),
      descricao: m.getAttribute("description"),
      codigo: m.getAttribute("code"),
      status: m.getAttribute("active") ? "Ativo" : "Inativo",
      resource: m,
    }))
    setRows(formatted)
  }, [machines])

  const columns = React.useMemo<ColumnDef<CentroCusto>[]>(
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
      { accessorKey: "descricao", header: "Nome" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "px-2",
              row.original.status === "Ativo"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      { accessorKey: "codigo", header: "Código" },
      {
        id: "actions",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onDelete={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
            onSave={(dto) =>
              setRows((prev) =>
                prev.map((r) =>
                  r.id === Number(dto.id)
                    ? {
                        ...r,
                        descricao: dto.description,
                        codigo: dto.code,
                        status: dto.active ? "Ativo" : "Inativo",
                      }
                    : r
                )
              )
            }
          />
        ),
      },
    ],
    [setRows]
  )

  const form = (
    <CentroCustoForm
      title="Novo Centro de Custo"
      onSubmit={(dto) => {
        MachineResource.inviteOrUpdate(dto.clone().bindToSave())
        setRows((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            descricao: dto.description,
            codigo: dto.code,
            status: dto.active ? "Ativo" : "Inativo",
            resource: new MachineResource(),
          },
        ])
      }}
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
            addButtonLabel="Novo Centro de Custo"
            renderAddForm={form}
          />
        </div>
      </div>
    </div>
  )
}
