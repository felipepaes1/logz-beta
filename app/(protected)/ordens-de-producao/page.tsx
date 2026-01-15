"use client"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import * as React from "react"
import { ProductionOrderResource } from "@/resources/ProductionOrders/production-orders.resource"
import { PluralResponse } from "coloquent"
import { OrdemProducaoForm } from "@/components/ordens-de-producao/form"
import { RowActions } from "@/components/ordens-de-producao/row-actions"
import { toast } from "sonner"
import type { OrdemProducao } from "@/components/ordens-de-producao/types"
import { ProductionOrderDto } from "@/resources/ProductionOrders/production-orders.dto"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<OrdemProducao[]>([])
  const [productionOrders, setProductionOrders] = React.useState<ProductionOrderResource[]>([])
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteRow, setDeleteRow] = React.useState<OrdemProducao | null>(null)
  const focusRestoreRef = React.useRef<HTMLButtonElement>(null)

  const reload = React.useCallback(() => {
    ProductionOrderResource.get().then(
      (response: PluralResponse<ProductionOrderResource>) => {
        setIsLoading(false)
        setProductionOrders(response.getData())
      }
    )
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  React.useEffect(() => {
    const formatted = productionOrders.map((o) => ({
      id: Number(o.getApiId()),
      descricao: o.getAttribute("description"),
      codigo: o.getAttribute("code"),
      status: Number(o.getAttribute("active")) === 1 ? "Ativo" : "Inativo",
      resource: o,
    }))
    const sorted = [...formatted].sort((a, b) => {
      const aActive = a.status === "Ativo" ? 1 : 0
      const bActive = b.status === "Ativo" ? 1 : 0
      if (aActive !== bActive) return bActive - aActive
      return String(a.descricao).localeCompare(String(b.descricao))
    })
    setRows(sorted)
  }, [productionOrders])

  const requestDelete = React.useCallback((row: OrdemProducao) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (row: OrdemProducao) => {
      const idNum = Number(row?.id)
      if (!Number.isFinite(idNum) || idNum <= 0) return false
      try {
        await ProductionOrderResource.destroy(idNum)
        toast.success("Ordem de produção excluída.")
        reload()
        return true
      } catch (err: any) {
        toast.error(err?.message ?? "Não foi possível excluir a ordem de produção.")
        return false
      }
    },
    [reload]
  )

  const columns = React.useMemo<ColumnDef<OrdemProducao>[]>(
    () => [
      { accessorKey: "descricao", header: "Descrição" },
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
            onRequestDelete={requestDelete}
            onSave={(_dto: ProductionOrderDto) => {
              reload()
            }}
          />
        ),
      },
    ],
    [reload, requestDelete]
  )

  const searchableColumns = React.useMemo(
    () => [
      { id: "descricao", label: "Descrição" },
      { id: "codigo", label: "Código" },
      { id: "status", label: "Status" },
    ],
    []
  )

  const form = (
    <OrdemProducaoForm
      title="Nova Ordem de Produção"
      onSubmit={(dto) =>
        toast.promise(
          ProductionOrderResource
            .inviteOrUpdate(dto.clone().bindToSave()).then(
            reload
          ),
          {
            loading: "Salvando ordem de produção...",
            success: "Ordem de produção cadastrada!",
            error: "Erro ao salvar ordem de produção.",
          }
        )
      }
    />
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <button
            ref={focusRestoreRef}
            tabIndex={-1}
            aria-hidden
            className="sr-only"
          />
          <DataTable
            data={rows}
            onDataChange={setRows}
            columns={columns}
            addButtonLabel="Nova Ordem de Produção"
            renderAddForm={form}
            isLoading={isLoading}
            emptyMessage="Nenhuma ordem de produção encontrada."
            searchableColumns={searchableColumns}
            searchPlaceholder="Buscar ordem de produção por descrição, código ou status"
          />
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open)
              if (!open) setDeleteRow(null)
            }}
          >
            <AlertDialogContent
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir ordem de produção?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso fará a exclusão. Confirma a remoção de <strong>{deleteRow?.descricao}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deleting}
                  onClick={() => {
                    setDeleteOpen(false)
                    setDeleteRow(null)
                    requestAnimationFrame(() => focusRestoreRef.current?.focus())
                  }}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="dark: text-white"
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteRow) return
                    setDeleting(true)
                    const ok = await handleDelete(deleteRow)
                    setDeleting(false)
                    if (ok !== false) {
                      setDeleteOpen(false)
                      setDeleteRow(null)
                      requestAnimationFrame(() => focusRestoreRef.current?.focus())
                    }
                  }}
                >
                  {deleting ? "Excluindo..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
