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
import { toast } from "sonner"


export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<CentroCusto[]>([])
  const [machines, setMachines] = React.useState<MachineResource[]>([])

  function reload() {
    MachineResource.get().then((response: PluralResponse<MachineResource>) => {
      setMachines(response.getData())
      setIsLoading(false)
    })
  }

  React.useEffect(() => {
      reload()
    }, [])

  React.useEffect(() => {
    const formatted = machines.map((m) => ({
      id: Number(m.getApiId()),
      descricao: m.getAttribute("description"),
      codigo: m.getAttribute("code"),
      modelo: m.getAttribute("model"),
      status: m.getAttribute("active") ? "Ativo" : "Inativo",
      resource: m,
    }))
    setRows(formatted)
  }, [machines])

  const columns = React.useMemo<ColumnDef<CentroCusto>[]>(
    () => [
      { accessorKey: "descricao", header: "Nome" },
      { accessorKey: "modelo", header: "Modelo"},
      { accessorKey: "codigo", header: "Código" },
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
      {
        id: "actions",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onDelete={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
            onSave={(dto) => {
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
              if (typeof window !== "undefined") window.location.reload()
            }}
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
      const promise = MachineResource
        .inviteOrUpdate(dto.clone().bindToSave())
        .then(reload)

      toast.promise(promise, {
        loading: "Salvando centro de custo...",
        success: "Centro de custo cadastrado!",
        error: "Erro ao salvar centro de custo.",
      })

      return promise
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
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
