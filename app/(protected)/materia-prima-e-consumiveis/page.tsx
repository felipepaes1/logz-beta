"use client"

import * as React from "react"
import { IconAlertCircle } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getInventoryUnitDefinition } from "@/lib/inventory-unit-types"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
import {
  InventoryItemResource,
} from "@/resources/InventoryItem/inventory-item.resource"
import type {
  InventoryItemDto,
  InventoryItemParsed,
} from "@/resources/InventoryItem/inventory-item.dto"
import { MateriaPrimaConsumivelForm } from "@/components/materia-prima-e-consumiveis/form"
import { RowActions } from "@/components/materia-prima-e-consumiveis/row-actions"
import type { MateriaPrimaConsumivel } from "@/components/materia-prima-e-consumiveis/types"

const categoryLabelMap: Record<string, string> = {
  consumable: "Consumivel",
  raw_material: "Materia-prima",
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toStatus(active: boolean): "Ativo" | "Inativo" {
  return active ? "Ativo" : "Inativo"
}

function toItemDto(
  item: InventoryItemParsed,
  patch?: Partial<InventoryItemDto>
): InventoryItemDto {
  return {
    id: item.id,
    tenant_id: item.tenant_id ?? null,
    active: item.active,
    name: item.name,
    code: item.code ?? null,
    external_item_id_useall: item.external_item_id_useall ?? null,
    description: item.description ?? null,
    category: item.category,
    unit_type: item.unit_type,
    unit: item.unit,
    min_quantity: item.min_quantity ?? null,
    quantity: item.quantity ?? null,
    pre_ordered: Boolean(item.pre_ordered ?? false),
    observation: item.observation ?? null,
    ...patch,
  }
}

function toRow(item: InventoryItemParsed): MateriaPrimaConsumivel {
  const stockMin = toNumber(item.min_quantity)
  const stockCurrent = toNumber(item.quantity)
  const unitDefinition = getInventoryUnitDefinition(item.unit_type)

  return {
    id: item.id,
    nome: item.name ?? "",
    codigo: item.code ?? "",
    categoria: categoryLabelMap[item.category] ?? item.category ?? "-",
    tipoUnidade: unitDefinition?.label ?? item.unit_type ?? "-",
    unidade: unitDefinition?.unit ?? item.unit ?? "-",
    estoqueMinimo: stockMin,
    estoqueAtual: stockCurrent,
    externalKey: item.external_item_id_useall ?? "",
    status: toStatus(Boolean(item.active)),
    preOrdered: Boolean(item.pre_ordered ?? false),
    resource: item,
  }
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [items, setItems] = React.useState<InventoryItemParsed[]>([])
  const [rows, setRows] = React.useState<MateriaPrimaConsumivel[]>([])
  const [tab, setTab] = React.useState<"alertas" | "todos">("alertas")
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteRow, setDeleteRow] = React.useState<MateriaPrimaConsumivel | null>(null)
  const focusRestoreRef = React.useRef<HTMLButtonElement>(null)

  const reloadItems = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await InventoryItemResource.list({
        include: ["movements"],
        sort: "name",
        page: { limit: 1000, offset: 0 },
      })
      setItems(response.data)
    } catch {
      toast.error("Não foi possível carregar os itens de inventário.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    reloadItems()
  }, [reloadItems])

  React.useEffect(() => {
    setRows(items.map(toRow))
  }, [items])

  const sortedRows = React.useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const aActive = a.status === "Ativo" ? 1 : 0
      const bActive = b.status === "Ativo" ? 1 : 0
      if (aActive !== bActive) return bActive - aActive
      return String(a.nome).localeCompare(String(b.nome))
    })
    return copy
  }, [rows])

  const todosRows = React.useMemo(() => sortedRows, [sortedRows])

  const alertRows = React.useMemo(() => {
    return sortedRows.filter(
      (row) => row.status === "Ativo" && row.estoqueAtual < row.estoqueMinimo
    )
  }, [sortedRows])

  const requestDelete = React.useCallback((row: MateriaPrimaConsumivel) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (id: number) => {
      try {
        await InventoryItemResource.destroy(id)
        setItems((prev) => prev.filter((item) => item.id !== id))
        setRows((prev) => prev.filter((row) => row.id !== id))
        toast.success("Item excluido.")
        return true
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Não foi possível excluir o item."
        toast.error(message)
        return false
      }
    },
    []
  )

  const handleTogglePreOrdered = React.useCallback(
    async (row: MateriaPrimaConsumivel, checked: boolean) => {
      const previous = row.preOrdered
      setRows((prev) =>
        prev.map((entry) =>
          entry.id === row.id ? { ...entry, preOrdered: checked } : entry
        )
      )

      const source = row.resource ?? items.find((item) => item.id === row.id)
      if (!source) {
        await reloadItems()
        return
      }

      const dto = toItemDto(source, { pre_ordered: checked })

      try {
        const response = await InventoryItemResource.createOrUpdate(dto)
        if (response.data) {
          setItems((prev) =>
            prev.map((item) => (item.id === response.data!.id ? response.data! : item))
          )
          setRows((prev) =>
            prev.map((entry) =>
              entry.id === response.data!.id ? toRow(response.data!) : entry
            )
          )
        } else {
          await reloadItems()
        }
      } catch {
        setRows((prev) =>
          prev.map((entry) =>
            entry.id === row.id ? { ...entry, preOrdered: previous } : entry
          )
        )
        toast.error("Não foi possível atualizar o status do pedido.")
      }
    },
    [items, reloadItems]
  )

  const columns = React.useMemo<ColumnDef<MateriaPrimaConsumivel>[]>(
    () => {
      const cols: ColumnDef<MateriaPrimaConsumivel>[] = [
        {
          accessorKey: "nome",
          header: "Nome",
          meta: { className: "max-w-[240px]", truncate: true },
        },
        { accessorKey: "codigo", header: "Código" },
        {
          accessorKey: "categoria",
          header: "Categoria",
          meta: { className: "max-w-[160px]", truncate: true },
        },
        {
          accessorKey: "tipoUnidade",
          header: "Tipo unidade",
          meta: { className: "max-w-[160px]", truncate: true },
        },
        { accessorKey: "unidade", header: "Unidade" },
        {
          accessorKey: "estoqueMinimo",
          header: "Estoque mínimo",
          cell: ({ row }) => (
            <span className="tabular-nums text-center block">
              {row.original.estoqueMinimo}
            </span>
          ),
          meta: { className: "text-center" },
        },
        {
          accessorKey: "estoqueAtual",
          header: "Estoque atual",
          cell: ({ row }) => {
            const atual = Number(row.original.estoqueAtual)
            const minimo = Number(row.original.estoqueMinimo)

            let badgeClass = ""
            let useBadge = false
            let variant: "destructive" | "default" | undefined = undefined

            if (atual === 0) {
              useBadge = true
              variant = "destructive"
            } else if (atual < minimo) {
              useBadge = true
              badgeClass = "bg-orange-300 text-orange-800 dark:bg-orange-500 dark:text-white"
            } else if (atual === minimo) {
              useBadge = true
              badgeClass = "bg-yellow-300 text-yellow-900 dark:bg-yellow-500 dark:text-white"
            }

            return (
              <div className="flex justify-center">
                {useBadge ? (
                  <Badge variant={variant} className={cn("px-2 tabular-nums", badgeClass)}>
                    {atual}
                  </Badge>
                ) : (
                  <span className="tabular-nums">{atual}</span>
                )}
              </div>
            )
          },
          meta: { className: "text-center" },
        },
        ...(tab === "alertas"
          ? ([
              {
                id: "preOrdered",
                header: () => (
                  <div className="text-center w-full">Pedido de compra feito?</div>
                ),
                cell: ({ row }) => {
                  const value = !!row.original.preOrdered
                  return (
                    <div className="flex items-center justify-center gap-2 w-full">
                      <span className="text-xs text-muted-foreground">Não</span>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          handleTogglePreOrdered(row.original, checked)
                        }
                        aria-label="Marcar pedido de compra"
                      />
                      <span className="text-xs text-muted-foreground">Sim</span>
                    </div>
                  )
                },
                meta: { className: "text-center" },
              },
            ] as ColumnDef<MateriaPrimaConsumivel>[])
          : ([
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
            ] as ColumnDef<MateriaPrimaConsumivel>[])),
        {
          id: "actions",
          cell: ({ row }) => (
            <RowActions
              row={row.original}
              onRequestDelete={requestDelete}
              onSave={(updated) => {
                setItems((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item))
                )
                setRows((prev) =>
                  prev.map((entry) =>
                    entry.id === updated.id ? toRow(updated) : entry
                  )
                )
              }}
              onSaved={reloadItems}
            />
          ),
        },
      ]

      return cols
    },
    [tab, handleTogglePreOrdered, requestDelete, reloadItems]
  )

  const searchableColumns = React.useMemo(() => {
    const base = [
      { id: "nome", label: "Nome" },
      { id: "codigo", label: "Código" },
      { id: "categoria", label: "Categoria" },
      { id: "tipoUnidade", label: "Tipo unidade" },
      { id: "unidade", label: "Unidade" },
    ]

    if (tab === "alertas") return base

    return [...base, { id: "status", label: "Status" }]
  }, [tab])

  const form = React.useMemo(
    () => (
      <MateriaPrimaConsumivelForm
        title="Novo item"
        onSubmit={async (dto) => {
          const request = InventoryItemResource.createOrUpdate(dto)
          toast.promise(request, {
            loading: "Salvando item...",
            success: "Item cadastrado!",
            error: "Não foi possível salvar o item.",
          })

          const response = await request
          await reloadItems()
          return response
        }}
      />
    ),
    [reloadItems]
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <button ref={focusRestoreRef} tabIndex={-1} aria-hidden className="sr-only" />

          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
            <TabsList
              className="
                mx-auto w-full max-w-5xl
                grid grid-cols-1 gap-3 sm:grid-cols-2
                bg-transparent p-0
              "
            >
              <TabsTrigger
                value="alertas"
                className="
                  group
                  rounded-2xl border shadow-sm
                  h-16 px-6
                  text-base font-semibold
                  justify-between
                  bg-muted hover:bg-muted/80
                  data-[state=active]:bg-primary/10
                  data-[state=active]:border-primary/50
                  data-[state=active]:shadow
                  transition-colors
                "
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">ITENS EM ALERTA</span>
                  <IconAlertCircle className="text-red-500 dark:text-red-500/70" size={30} />
                </div>
                <Badge
                  className="
                    ml-3
                    group-data-[state=active]:bg-primary
                    group-data-[state=active]:text-primary-foreground
                    dark:text-white
                  "
                >
                  {alertRows.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="todos"
                className="
                  group
                  rounded-2xl border shadow-sm
                  h-16 px-6
                  text-base font-semibold
                  justify-between
                  bg-muted hover:bg-muted/80
                  data-[state=active]:bg-primary/10
                  data-[state=active]:border-primary/50
                  data-[state=active]:shadow
                  transition-colors
                "
              >
                <span className="truncate">TODOS</span>
                <Badge
                  variant="secondary"
                  className="
                    ml-3
                    group-data-[state=active]:bg-primary
                    group-data-[state=active]:text-primary-foreground
                    dark:text-white
                  "
                >
                  {todosRows.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alertas" className="mt-8">
              <DataTable
                key="alertas"
                data={alertRows}
                columns={columns}
                addButtonLabel="Novo item"
                renderAddForm={form}
                isLoading={isLoading}
                searchableColumns={searchableColumns}
                searchPlaceholder="Buscar por nome, código, categoria, tipo de unidade ou unidade"
              />
            </TabsContent>

            <TabsContent value="todos" className="mt-8">
              <DataTable
                key="todos"
                data={todosRows}
                onDataChange={setRows}
                columns={columns}
                addButtonLabel="Novo item"
                renderAddForm={form}
                isLoading={isLoading}
                searchableColumns={searchableColumns}
                searchPlaceholder="Buscar por nome, código, categoria, tipo de unidade, unidade ou status"
              />
            </TabsContent>
          </Tabs>

          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open)
              if (!open) setDeleteRow(null)
            }}
          >
            <AlertDialogContent
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso fará a exclusão lógica do item de inventário.
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
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteRow) return
                    setDeleting(true)
                    const ok = await handleDelete(deleteRow.id)
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
