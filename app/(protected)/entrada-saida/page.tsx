"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react"
import { PluralResponse } from "coloquent"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerTrigger } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { EntradaForm } from "@/components/entrada-saida/form-entrada"
import { SaidaForm } from "@/components/entrada-saida/form-saida"
import { RowActions } from "@/components/entrada-saida/row-actions"
import type { MovementFormPayload } from "@/components/entrada-saida/movement-form"
import type { Movimento, MovimentoSource } from "@/components/entrada-saida/types"
import type { ComponentDto } from "@/resources/Component/component.dto"
import { ComponentResource } from "@/resources/Component/component.resource"
import { ItemResource } from "@/resources/Item/item.resource"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { PcpResource } from "@/resources/Pcp/pcp.resource"
import { InventoryItemResource } from "@/resources/InventoryItem/inventory-item.resource"
import type { InventoryItemParsed } from "@/resources/InventoryItem/inventory-item.dto"
import type {
  InventoryMovementDto,
  InventoryMovementParsed,
} from "@/resources/InventoryMovement/inventory-movement.dto"
import { InventoryMovementResource } from "@/resources/InventoryMovement/inventory-movement.resource"

const sourceLabelMap: Record<MovimentoSource, string> = {
  component: "Ferramentas",
  inventory: "Matéria-prima e consumíveis",
}

function parseDateSafe(value?: string | null): number {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function toOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const normalized = String(value).trim()
  return normalized.length ? normalized : null
}

function readRelationText(
  relation: { attributes: Record<string, unknown> } | null | undefined,
  keys: string[]
): string {
  if (!relation) return ""
  for (const key of keys) {
    const value = relation.attributes[key]
    if (value !== undefined && value !== null && String(value).trim().length) {
      return String(value)
    }
  }
  return ""
}

function readRelationNumber(
  relation: { attributes: Record<string, unknown> } | null | undefined,
  keys: string[]
): number | null {
  if (!relation) return null
  for (const key of keys) {
    const raw = relation.attributes[key]
    const value = Number(raw)
    if (Number.isFinite(value)) return value
  }
  return null
}

type ResourceWithAttributes = {
  getAttribute?: (key: string) => unknown
  getApiId?: () => number | string | undefined
} | null | undefined

function readResourceText(resource: ResourceWithAttributes, keys: string[]): string {
  if (!resource?.getAttribute) return ""
  for (const key of keys) {
    const value = resource.getAttribute(key)
    if (value !== undefined && value !== null && String(value).trim().length) {
      return String(value)
    }
  }
  return ""
}

function readResourceNumber(resource: ResourceWithAttributes, keys: string[]): number | null {
  if (!resource?.getAttribute) return null
  for (const key of keys) {
    const value = Number(resource.getAttribute(key))
    if (Number.isFinite(value)) return value
  }
  return null
}

function componentResourceToRow(resource: ComponentResource, index: number): Movimento {
  const movementId = Number(resource.getApiId?.() ?? resource.getAttribute("id") ?? index + 1)
  const itemRelation = resource.getRelation("item") as ItemResource | undefined
  const machineRelation = resource.getRelation("machine") as MachineResource | undefined
  const collaboratorRelation = resource.getRelation("collaborator") as CollaboratorResource | undefined
  const typeRaw = String(resource.getAttribute("type") ?? "IN").toUpperCase()
  const movementType = typeRaw === "OUT" ? "OUT" : "IN"
  const quantityValue = Number(resource.getAttribute("quantity"))
  const quantity = Number.isFinite(quantityValue) ? quantityValue : 0
  const unitPriceValue = Number(resource.getAttribute("unit_price"))
  const unitPrice = Number.isFinite(unitPriceValue) ? unitPriceValue : null
  const totalPriceValue = Number(resource.getAttribute("total_price"))
  const totalPrice =
    Number.isFinite(totalPriceValue)
      ? totalPriceValue
      : unitPrice !== null
        ? Number((unitPrice * quantity).toFixed(2))
        : null
  const itemStock = readResourceNumber(itemRelation, [
    "available_quantity",
    "quantity",
    "stock",
    "available",
  ])
  const code = readResourceText(itemRelation, ["code"])
  const itemName = readResourceText(itemRelation, ["name", "description"])
  const machineName = readResourceText(machineRelation, ["description", "name"])
  const collaboratorName = readResourceText(collaboratorRelation, ["name"])

  return {
    id: movementId,
    movementId,
    source: "component",
    movementType,
    data: String(resource.getAttribute("created_at") ?? new Date(0).toISOString()),
    grupo: sourceLabelMap.component,
    codigo: code,
    item: itemName,
    maquina: machineName,
    responsavel: collaboratorName,
    operacao: movementType === "IN" ? "Entrada" : "Saida",
    precoUnitario: unitPrice,
    precoTotal: totalPrice,
    ordem: String(resource.getAttribute("order_number") ?? ""),
    quantidade: quantity,
    estoque: itemStock,
    itemId: Number(itemRelation?.getApiId?.() ?? resource.getAttribute("item_id") ?? 0) || null,
    inventoryItemId: null,
    collaboratorId:
      Number(
        collaboratorRelation?.getApiId?.() ?? resource.getAttribute("collaborator_id") ?? 0
      ) || null,
    machineId:
      Number(machineRelation?.getApiId?.() ?? resource.getAttribute("machine_id") ?? 0) || null,
    productionOrderId: Number(resource.getAttribute("production_order_id") ?? 0) || null,
    externalKey: toOptionalString(resource.getAttribute("external_key")),
    justification: toOptionalString(resource.getAttribute("justification")),
  }
}

function inventoryMovementToRow(entry: InventoryMovementParsed, index: number): Movimento {
  const movementId = Number(entry.id) > 0 ? Number(entry.id) : index + 1
  const quantity = Number(entry.quantity ?? 0)
  const unitPrice = entry.unit_price ?? null
  const totalPrice =
    entry.total_price ??
    (unitPrice !== null && Number.isFinite(quantity) ? Number((unitPrice * quantity).toFixed(2)) : null)
  const itemStock = readRelationNumber(entry.inventoryItem, ["quantity", "stock", "available_quantity"])

  return {
    id: movementId * -1,
    movementId,
    source: "inventory",
    movementType: entry.type === "OUT" ? "OUT" : "IN",
    data: entry.created_at ?? entry.updated_at ?? new Date(0).toISOString(),
    grupo: sourceLabelMap.inventory,
    codigo: readRelationText(entry.inventoryItem, ["code"]),
    item: readRelationText(entry.inventoryItem, ["name", "description"]),
    maquina: readRelationText(entry.machine, ["description", "name"]),
    responsavel: readRelationText(entry.collaborator, ["name"]),
    operacao: entry.type === "OUT" ? "Saida" : "Entrada",
    precoUnitario: unitPrice,
    precoTotal: totalPrice,
    ordem: entry.order_number ?? "",
    quantidade: quantity,
    estoque: itemStock ?? null,
    itemId: null,
    inventoryItemId: entry.inventory_item_id ?? entry.inventoryItem?.id ?? null,
    collaboratorId: entry.collaborator_id ?? entry.collaborator?.id ?? null,
    machineId: entry.machine_id ?? entry.machine?.id ?? null,
    productionOrderId: entry.production_order_id ?? entry.pcp?.id ?? null,
    externalKey: entry.external_key ?? null,
    justification: entry.justification ?? null,
  }
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim().length) return error
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>
    const candidates = [
      (err.response as Record<string, unknown> | undefined)?.data,
      err.data,
      (err.axiosResponse as Record<string, unknown> | undefined)?.data,
      err,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length) return candidate
      if (typeof candidate === "object" && candidate !== null) {
        const message = (candidate as Record<string, unknown>).message
        if (typeof message === "string" && message.trim().length) return message
      }
    }
  }
  return fallback
}

function buildSubmitRequest(payload: MovementFormPayload) {
  if (payload.source === "component") {
    return {
      source: "component" as const,
      body: {
        id: payload.id ?? null,
        quantity: Math.trunc(Number(payload.quantity)),
        type: payload.type,
        itemDto: {
          id: payload.selectedItemId,
          code: payload.selectedItemCode ?? "",
          name: payload.selectedItemName ?? "",
          active: true,
        },
        collaboratorDto: payload.collaboratorId
          ? {
              id: payload.collaboratorId,
              name: payload.selectedCollaboratorName ?? "",
              code: payload.selectedCollaboratorCode ?? "",
              active: payload.selectedCollaboratorActive ?? true,
            }
          : null,
        machineDto: payload.machineId
          ? {
              id: payload.machineId,
              description: payload.selectedMachineDescription ?? "",
              code: payload.selectedMachineCode ?? "",
              model: payload.selectedMachineModel ?? "",
              active: payload.selectedMachineActive ?? true,
            }
          : null,
        orderNumber: payload.orderNumber ?? null,
        unitPrice: payload.unitPrice ?? null,
        totalPrice: payload.totalPrice ?? null,
        production_order_id: payload.productionOrderId ?? null,
        justification: payload.justification ?? null,
      },
    }
  }

  const dto: InventoryMovementDto = {
    id: payload.id ?? null,
    quantity: Number(Number(payload.quantity).toFixed(6)),
    type: payload.type,
    inventory_item_id: payload.selectedItemId,
    collaborator_id: payload.collaboratorId ?? null,
    machine_id: payload.machineId ?? null,
    production_order_id: payload.productionOrderId ?? null,
    order_number: payload.orderNumber ?? null,
    unit_price: payload.unitPrice ?? null,
    total_price: payload.totalPrice ?? null,
    justification: payload.justification ?? null,
  }

  return {
    source: "inventory" as const,
    body: dto,
  }
}

const allColumns: Record<string, ColumnDef<Movimento>> = {
  data: {
    accessorKey: "data",
    header: "Data",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(row.original.data)
      ),
  },
  grupo: { accessorKey: "grupo", header: "Macrogrupo", meta: { className: "max-w-[220px]", truncate: true } },
  codigo: { accessorKey: "codigo", header: "Código" },
  item: { accessorKey: "item", header: "Item", meta: { className: "max-w-[260px]", truncate: true } },
  maquina: { accessorKey: "maquina", header: "Máquina", meta: { className: "max-w-[180px]", truncate: true } },
  responsavel: { accessorKey: "responsavel", header: "Responsável", meta: { className: "max-w-[180px]", truncate: true } },
  operacao: { accessorKey: "operacao", header: "Operação" },
  precoUnitario: {
    accessorKey: "precoUnitario",
    header: "Preço Unitário",
    cell: ({ row }) =>
      typeof row.original.precoUnitario === "number"
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            row.original.precoUnitario
          )
        : "",
  },
  precoTotal: {
    accessorKey: "precoTotal",
    header: "Preço Total",
    cell: ({ row }) =>
      typeof row.original.precoTotal === "number"
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            row.original.precoTotal
          )
        : "",
  },
  ordem: { accessorKey: "ordem", header: "Ordem" },
  quantidade: { accessorKey: "quantidade", header: "Quantidade" },
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<Movimento[]>([])
  const [tab, setTab] = React.useState<"todos" | "entradas" | "saidas">("todos")

  const [items, setItems] = React.useState<ItemResource[]>([])
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItemParsed[]>([])
  const [collaborators, setCollaborators] = React.useState<CollaboratorResource[]>([])
  const [machines, setMachines] = React.useState<MachineResource[]>([])
  const [pcps, setPcps] = React.useState<PcpResource[]>([])

  const [isEntradaOpen, setIsEntradaOpen] = React.useState(false)
  const [isSaidaOpen, setIsSaidaOpen] = React.useState(false)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteRow, setDeleteRow] = React.useState<Movimento | null>(null)
  const [justification, setJustification] = React.useState("")

  const focusRestoreRef = React.useRef<HTMLButtonElement>(null)
  const JUST_MIN = 12

  const dateFormatter = React.useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    []
  )

  const loadMovements = React.useCallback(async () => {
    const [componentsResult, inventoryResult] = await Promise.allSettled([
      ComponentResource.orderBy("created_at", "desc")
        .with(["item", "collaborator", "machine", "pcp"])
        .get(),
      InventoryMovementResource.list({
        include: ["inventoryItem", "collaborator", "machine", "pcp"],
        sort: "-created_at",
        page: { limit: 1000, offset: 0 },
      }),
    ])

    const componentRows =
      componentsResult.status === "fulfilled"
        ? (componentsResult.value as PluralResponse<ComponentResource>)
            .getData()
            .map((entry, index) => componentResourceToRow(entry, index))
        : []
    const inventoryRows =
      inventoryResult.status === "fulfilled"
        ? inventoryResult.value.data.map((entry, index) => inventoryMovementToRow(entry, index))
        : []

    if (
      componentsResult.status === "rejected" &&
      inventoryResult.status === "rejected"
    ) {
      throw componentsResult.reason
    }

    const merged = [...componentRows, ...inventoryRows]
    merged.sort((a, b) => parseDateSafe(b.data) - parseDateSafe(a.data))
    setRows(merged)
  }, [])

  const loadItems = React.useCallback(async () => {
    const response = await ItemResource.with(["itemGroup"]).orderBy("code", "asc").get()
    const parsed = (response as PluralResponse<ItemResource>).getData()
    setItems(parsed)
  }, [])

  const loadInventoryItems = React.useCallback(async () => {
    const response = await InventoryItemResource.list({
      sort: "code",
      page: { limit: 1000, offset: 0 },
    })
    setInventoryItems(response.data)
  }, [])

  const loadAuxiliary = React.useCallback(async () => {
    const [collaboratorResponse, machineResponse, pcpResponse] = await Promise.all([
      CollaboratorResource.get(),
      MachineResource.get(),
      PcpResource.get(),
    ])
    setCollaborators((collaboratorResponse as PluralResponse<CollaboratorResource>).getData())
    setMachines((machineResponse as PluralResponse<MachineResource>).getData())
    setPcps((pcpResponse as PluralResponse<PcpResource>).getData())
  }, [])

  const refreshRowsAndItems = React.useCallback(async () => {
    await Promise.all([loadMovements(), loadItems(), loadInventoryItems()])
  }, [loadInventoryItems, loadItems, loadMovements])

  React.useEffect(() => {
    setIsLoading(true)
    Promise.all([loadMovements(), loadItems(), loadInventoryItems(), loadAuxiliary()])
      .catch((error: unknown) => {
        toast.error(resolveErrorMessage(error, "Nao foi possivel carregar entradas e saidas."))
      })
      .finally(() => setIsLoading(false))
  }, [loadAuxiliary, loadInventoryItems, loadItems, loadMovements])

  const submitMovement = React.useCallback(async (payload: MovementFormPayload) => {
    const request = buildSubmitRequest(payload)
    if (request.source === "component") {
      await ComponentResource.createOrUpdate(request.body as unknown as ComponentDto)
      return
    }
    await InventoryMovementResource.createOrUpdate(request.body)
  }, [])

  const saveWithToast = React.useCallback(
    async (payload: MovementFormPayload) => {
      const toastId = "save-movement"
      toast.loading("Salvando registro...", { id: toastId })
      try {
        await submitMovement(payload)
        await refreshRowsAndItems()
        toast.success("Movimentação registrada!", { id: toastId })
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error, "Erro ao salvar movimentação."), { id: toastId })
        throw error
      }
    },
    [refreshRowsAndItems, submitMovement]
  )

  const todosRows = rows
  const entradasRows = React.useMemo(() => rows.filter((row) => row.movementType === "IN"), [rows])
  const saidasRows = React.useMemo(() => rows.filter((row) => row.movementType === "OUT"), [rows])

  const columns = React.useMemo<ColumnDef<Movimento>[]>(() => {
    const withActions = (baseColumns: ColumnDef<Movimento>[]) => [
      ...baseColumns,
      {
        id: "actions",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onRequestDelete={(entry) => {
              setDeleteRow(entry)
              setJustification("")
              setDeleteOpen(true)
            }}
            onSubmit={saveWithToast}
            items={items}
            inventoryItems={inventoryItems}
            collaborators={collaborators}
            machines={machines}
            pcps={pcps}
          />
        ),
      } as ColumnDef<Movimento>,
    ]

    if (tab === "entradas") {
      return withActions([
        allColumns.data,
        allColumns.grupo,
        allColumns.codigo,
        allColumns.item,
        allColumns.responsavel,
        allColumns.precoUnitario,
        allColumns.precoTotal,
        { ...allColumns.ordem, header: "Ordem" },
        allColumns.quantidade,
      ])
    }

    if (tab === "saidas") {
      return withActions([
        allColumns.data,
        allColumns.grupo,
        allColumns.codigo,
        allColumns.item,
        allColumns.responsavel,
        allColumns.maquina,
        allColumns.quantidade,
      ])
    }

    return withActions([
      allColumns.data,
      allColumns.grupo,
      allColumns.codigo,
      allColumns.item,
      allColumns.maquina,
      allColumns.responsavel,
      allColumns.operacao,
      allColumns.precoUnitario,
      allColumns.precoTotal,
      allColumns.quantidade,
    ])
  }, [collaborators, inventoryItems, items, machines, pcps, saveWithToast, tab])

  const searchColumnsTodos = React.useMemo(
    () => [
      {
        id: "data",
        label: "Data",
        getValue: (row: Movimento) => {
          try {
            return dateFormatter.format(new Date(row.data))
          } catch {
            return row.data
          }
        },
      },
      { id: "grupo", label: "Macrogrupo" },
      { id: "codigo", label: "Código" },
      { id: "item", label: "Item" },
      { id: "maquina", label: "Máquina" },
      { id: "responsavel", label: "Responsável" },
      { id: "operacao", label: "Operação" },
    ],
    [dateFormatter]
  )

  const searchColumnsEntradas = React.useMemo(
    () => [
      {
        id: "data",
        label: "Data",
        getValue: (row: Movimento) => {
          try {
            return dateFormatter.format(new Date(row.data))
          } catch {
            return row.data
          }
        },
      },
      { id: "grupo", label: "Macrogrupo" },
      { id: "codigo", label: "Código" },
      { id: "item", label: "Item" },
      { id: "responsavel", label: "Responsável" },
      { id: "ordem", label: "Ordem" },
      { id: "quantidade", label: "Quantidade" },
    ],
    [dateFormatter]
  )

  const searchColumnsSaidas = React.useMemo(
    () => [
      {
        id: "data",
        label: "Data",
        getValue: (row: Movimento) => {
          try {
            return dateFormatter.format(new Date(row.data))
          } catch {
            return row.data
          }
        },
      },
      { id: "grupo", label: "Macrogrupo" },
      { id: "codigo", label: "Código" },
      { id: "item", label: "Item" },
      { id: "responsavel", label: "Responsável" },
      { id: "maquina", label: "Máquina" },
      { id: "quantidade", label: "Quantidade" },
    ],
    [dateFormatter]
  )

  const headerActions = (
    <>
      <Drawer direction="right" open={isEntradaOpen} onOpenChange={setIsEntradaOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            Cadastrar Entrada
          </Button>
        </DrawerTrigger>
        {isEntradaOpen ? (
          <EntradaForm
            items={items}
            inventoryItems={inventoryItems}
            collaborators={collaborators}
            machines={machines}
            pcps={pcps}
            onSubmit={saveWithToast}
            onRequestClose={() => setIsEntradaOpen(false)}
          />
        ) : null}
      </Drawer>
      <Drawer direction="right" open={isSaidaOpen} onOpenChange={setIsSaidaOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            Cadastrar Saída
          </Button>
        </DrawerTrigger>
        {isSaidaOpen ? (
          <SaidaForm
            items={items}
            inventoryItems={inventoryItems}
            collaborators={collaborators}
            machines={machines}
            pcps={pcps}
            onSubmit={saveWithToast}
            onRequestClose={() => setIsSaidaOpen(false)}
          />
        ) : null}
      </Drawer>
    </>
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <button ref={focusRestoreRef} tabIndex={-1} aria-hidden className="sr-only" />
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
            <TabsList className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 bg-transparent p-0 sm:grid-cols-3">
              <TabsTrigger
                value="todos"
                className="group h-16 justify-between rounded-2xl border bg-muted px-6 text-base font-semibold shadow-sm transition-colors hover:bg-muted/80 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10 data-[state=active]:shadow"
              >
                <span className="truncate">TODOS</span>
              </TabsTrigger>
              <TabsTrigger
                value="entradas"
                className="group h-16 justify-between rounded-2xl border bg-muted px-6 text-base font-semibold shadow-sm transition-colors hover:bg-muted/80 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10 data-[state=active]:shadow"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">ENTRADAS</span>
                  <IconArrowUp size={20} className="text-green-600 dark:text-green-500/70" stroke={2} />
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="saidas"
                className="group h-16 justify-between rounded-2xl border bg-muted px-6 text-base font-semibold shadow-sm transition-colors hover:bg-muted/80 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10 data-[state=active]:shadow"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">SAÍDAS</span>
                  <IconArrowDown size={20} className="text-red-600 dark:text-red-500/70" stroke={2} />
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-8">
              <DataTable
                key="todos"
                data={todosRows}
                onDataChange={setRows}
                columns={columns}
                headerActions={headerActions}
                isLoading={isLoading}
                searchableColumns={searchColumnsTodos}
                searchPlaceholder="Buscar por data, macrogrupo, código, item, responsável ou máquina"
              />
            </TabsContent>

            <TabsContent value="entradas" className="mt-8">
              <DataTable
                key="entradas"
                data={entradasRows}
                onDataChange={setRows}
                columns={columns}
                headerActions={headerActions}
                isLoading={isLoading}
                searchableColumns={searchColumnsEntradas}
                searchPlaceholder="Buscar entrada por data, macrogrupo, código, item, responsável ou ordem"
              />
            </TabsContent>

            <TabsContent value="saidas" className="mt-8">
              <DataTable
                key="saidas"
                data={saidasRows}
                onDataChange={setRows}
                columns={columns}
                headerActions={headerActions}
                isLoading={isLoading}
                searchableColumns={searchColumnsSaidas}
                searchPlaceholder="Buscar saída por data, macrogrupo, código, item, responsável ou máquina"
              />
            </TabsContent>
          </Tabs>

          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open)
              if (!open) {
                setDeleteRow(null)
                setJustification("")
              }
            }}
          >
            <AlertDialogContent
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir {deleteRow?.operacao.toLowerCase()}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Informe o motivo da exclusão. A justificativa será salva no registro.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <label htmlFor="justification" className="text-sm font-medium">
                  Justificativa <span className="text-muted-foreground">(mínimo {JUST_MIN} caracteres)</span>
                </label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  placeholder="Ex.: Lançamento duplicado; corrigido pelo movimento..."
                  rows={4}
                />
                {justification.trim().length > 0 && justification.trim().length < JUST_MIN ? (
                  <p className="text-xs text-destructive">
                    A justificativa precisa ter pelo menos {JUST_MIN} caracteres.
                  </p>
                ) : null}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deleting}
                  onClick={() => {
                    setDeleteOpen(false)
                    setDeleteRow(null)
                    setJustification("")
                    requestAnimationFrame(() => focusRestoreRef.current?.focus())
                  }}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="dark:text-white"
                  disabled={deleting || justification.trim().length < JUST_MIN}
                  onClick={async () => {
                    if (!deleteRow) return
                    const toastId = "delete-movement"
                    setDeleting(true)
                    toast.loading("Excluindo registro...", { id: toastId })
                    try {
                      if (deleteRow.source === "component") {
                        await ComponentResource.deleteWithJustification(
                          deleteRow.movementId,
                          justification.trim()
                        )
                      } else {
                        await InventoryMovementResource.deleteWithJustification(
                          deleteRow.movementId,
                          justification.trim()
                        )
                      }
                      await refreshRowsAndItems()
                      toast.success("Registro excluído com justificativa.", { id: toastId })
                      setDeleteOpen(false)
                      setDeleteRow(null)
                      setJustification("")
                      requestAnimationFrame(() => focusRestoreRef.current?.focus())
                    } catch (error: unknown) {
                      toast.error(
                        resolveErrorMessage(error, "Não foi possível excluir o registro."),
                        { id: toastId }
                      )
                    } finally {
                      setDeleting(false)
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
