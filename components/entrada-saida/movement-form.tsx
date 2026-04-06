"use client"

import * as React from "react"
import { ArrowLeft, X } from "lucide-react"
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ItemResource } from "@/resources/Item/item.resource"
import type { MovementType } from "@/resources/InventoryMovement/inventory-movement.dto"
import type { InventoryItemParsed } from "@/resources/InventoryItem/inventory-item.dto"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { PcpResource } from "@/resources/Pcp/pcp.resource"
import { SelectDisplay, SelectSearchInput, isResourceActive, normalizeSearchValue } from "./form-utils"
import type { Movimento } from "./types"

export type MovementFormSource = "component" | "inventory"

export interface MovementFormPayload {
  id?: number | null
  source: MovementFormSource
  type: MovementType
  quantity: number
  selectedItemId: number
  selectedItemCode: string
  selectedItemName: string
  collaboratorId?: number | null
  selectedCollaboratorName?: string | null
  selectedCollaboratorCode?: string | null
  selectedCollaboratorActive?: boolean | null
  machineId?: number | null
  selectedMachineDescription?: string | null
  selectedMachineCode?: string | null
  selectedMachineModel?: string | null
  selectedMachineActive?: boolean | null
  productionOrderId?: number | null
  orderNumber?: string | null
  unitPrice?: number | null
  totalPrice?: number | null
  justification?: string | null
}

interface FormErrors {
  source?: string
  item?: string
  collaborator?: string
  machine?: string
  quantity?: string
  unitPrice?: string
}

export interface MovementFormProps {
  movementType: MovementType
  title: string
  onSubmit: (payload: MovementFormPayload) => Promise<unknown>
  movement?: Movimento
  items: ItemResource[]
  inventoryItems: InventoryItemParsed[]
  collaborators: CollaboratorResource[]
  machines: MachineResource[]
  pcps: PcpResource[]
  disableEdition?: boolean
  onRequestClose?: () => void
}

function toOptionalString(value: string): string | null {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

function parseLocalizedNumber(value: string): number | null {
  const trimmed = value.trim()
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed.replace(/,/g, "")
  if (!normalized.length) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function resolveComponentStock(item?: ItemResource): number | null {
  if (!item) return null
  const candidates = ["available_quantity", "available", "stock", "quantity"] as const
  for (const key of candidates) {
    const value = Number(item.getAttribute?.(key))
    if (Number.isFinite(value)) return Math.max(0, value)
  }
  return null
}

function resolveInventoryStock(item?: InventoryItemParsed): number | null {
  if (!item) return null
  const withStock = item as InventoryItemParsed & { stock?: unknown }
  const candidates = [item.quantity, withStock.stock]
  for (const raw of candidates) {
    const value = Number(raw)
    if (Number.isFinite(value)) return Math.max(0, value)
  }
  return null
}

function componentLabel(item?: ItemResource): string {
  if (!item) return ""
  const code = String(item.getAttribute?.("code") ?? "").trim()
  const name = String(item.getAttribute?.("name") ?? "").trim()
  if (code && name) return `${code} - ${name}`
  return name || code
}

function inventoryLabel(item?: InventoryItemParsed): string {
  if (!item) return ""
  const code = String(item.code ?? "").trim()
  const name = String(item.name ?? "").trim()
  if (code && name) return `${code} - ${name}`
  return name || code
}

function movementItemLabel(movement?: Movimento): string {
  if (!movement) return ""
  const code = String(movement.codigo ?? "").trim()
  const name = String(movement.item ?? "").trim()
  if (code && name) return `${code} - ${name}`
  return name || code
}

function movimentoSourceToFormSource(source?: Movimento["source"]): MovementFormSource | null {
  if (source === "component") return "component"
  if (source === "inventory") return "inventory"
  return null
}

function normalizeQuantityInput(value: string, source: MovementFormSource | null): string {
  if (!value.trim().length) return ""

  if (source === "component") {
    let next = value.replace(/\D/g, "")
    next = next.replace(/^0+(?=\d)/, "")
    return next || "0"
  }

  let next = value.replace(",", ".").replace(/[^0-9.]/g, "")
  const separatorIndex = next.indexOf(".")

  if (separatorIndex >= 0) {
    const integerPart = next.slice(0, separatorIndex).replace(/\./g, "")
    const decimalPart = next.slice(separatorIndex + 1).replace(/\./g, "").slice(0, 6)
    next = `${integerPart || "0"}.${decimalPart}`
  } else {
    next = next.replace(/^0+(?=\d)/, "") || "0"
  }

  if (next.startsWith(".")) next = `0${next}`
  return next
}

function normalizeMoneyInput(value: string): string {
  const sanitized = value.replace(/[^0-9.,]/g, "")
  if (!sanitized.length) return ""

  const separatorIndex = Math.max(sanitized.lastIndexOf(","), sanitized.lastIndexOf("."))
  if (separatorIndex < 0) {
    const integerPart = sanitized.replace(/^0+(?=\d)/, "")
    return integerPart || "0"
  }

  const integerPartRaw = sanitized.slice(0, separatorIndex).replace(/[.,]/g, "")
  const decimalPart = sanitized.slice(separatorIndex + 1).replace(/[.,]/g, "").slice(0, 2)
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, "") || "0"

  return `${integerPart},${decimalPart}`
}

function formatMoneyInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  if (!Number.isFinite(value)) return ""
  return value.toFixed(2).replace(".", ",")
}

function truncateText(value: string, max = 70): string {
  const normalized = String(value ?? "")
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}...`
}

export function MovementForm({
  movementType,
  title,
  onSubmit,
  movement,
  items,
  inventoryItems,
  collaborators,
  machines,
  pcps,
  disableEdition,
  onRequestClose,
}: MovementFormProps): React.ReactElement {
  const [source, setSource] = React.useState<MovementFormSource | null>(() =>
    movimentoSourceToFormSource(movement?.source)
  )
  const [itemId, setItemId] = React.useState("")
  const [collaboratorId, setCollaboratorId] = React.useState("")
  const [machineId, setMachineId] = React.useState("")
  const [pcpId, setPcpId] = React.useState("")
  const [quantity, setQuantity] = React.useState("0")
  const [unitPrice, setUnitPrice] = React.useState("")
  const [orderNumber, setOrderNumber] = React.useState("")
  const [justification, setJustification] = React.useState("")
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [submitting, setSubmitting] = React.useState(false)

  const [itemSearch, setItemSearch] = React.useState("")
  const [collaboratorSearch, setCollaboratorSearch] = React.useState("")
  const [machineSearch, setMachineSearch] = React.useState("")
  const [pcpSearch, setPcpSearch] = React.useState("")
  const hasUnitPriceField = movementType === "IN"

  const isEdition = Boolean(movement)
  const sourceLocked = Boolean(disableEdition) || isEdition
  const normalizedItemSearch = React.useMemo(() => normalizeSearchValue(itemSearch), [itemSearch])
  const normalizedCollaboratorSearch = React.useMemo(
    () => normalizeSearchValue(collaboratorSearch),
    [collaboratorSearch]
  )
  const normalizedMachineSearch = React.useMemo(
    () => normalizeSearchValue(machineSearch),
    [machineSearch]
  )
  const normalizedPcpSearch = React.useMemo(() => normalizeSearchValue(pcpSearch), [pcpSearch])

  const activeComponents = React.useMemo(() => items.filter(isResourceActive), [items])
  const activeInventoryItems = React.useMemo(
    () => inventoryItems.filter((entry) => Boolean(entry.active)),
    [inventoryItems]
  )
  const activeCollaborators = React.useMemo(
    () => collaborators.filter(isResourceActive),
    [collaborators]
  )
  const activeMachines = React.useMemo(() => machines.filter(isResourceActive), [machines])

  const selectedComponent = React.useMemo(
    () =>
      source === "component" && itemId
        ? items.find((entry) => entry.getApiId()?.toString() === itemId)
        : undefined,
    [itemId, items, source]
  )
  const selectedInventoryItem = React.useMemo(
    () =>
      source === "inventory" && itemId
        ? inventoryItems.find((entry) => String(entry.id) === itemId)
        : undefined,
    [inventoryItems, itemId, source]
  )
  const selectedCollaborator = React.useMemo(
    () =>
      collaboratorId
        ? collaborators.find((entry) => entry.getApiId()?.toString() === collaboratorId)
        : undefined,
    [collaboratorId, collaborators]
  )
  const selectedMachine = React.useMemo(
    () => (machineId ? machines.find((entry) => entry.getApiId()?.toString() === machineId) : undefined),
    [machineId, machines]
  )
  const selectedPcp = React.useMemo(
    () => (pcpId ? pcps.find((entry) => entry.getApiId()?.toString() === pcpId) : undefined),
    [pcpId, pcps]
  )

  const componentOptions = React.useMemo(() => {
    const sorted = [...activeComponents].sort((a, b) => {
      const aLabel = componentLabel(a)
      const bLabel = componentLabel(b)
      return aLabel.localeCompare(bLabel)
    })
    if (!normalizedItemSearch) return sorted
    return sorted.filter((entry) =>
      normalizeSearchValue(componentLabel(entry)).includes(normalizedItemSearch)
    )
  }, [activeComponents, normalizedItemSearch])

  const inventoryOptions = React.useMemo(() => {
    const sorted = [...activeInventoryItems].sort((a, b) =>
      inventoryLabel(a).localeCompare(inventoryLabel(b))
    )
    if (!normalizedItemSearch) return sorted
    return sorted.filter((entry) =>
      normalizeSearchValue(inventoryLabel(entry)).includes(normalizedItemSearch)
    )
  }, [activeInventoryItems, normalizedItemSearch])

  const collaboratorOptions = React.useMemo(() => {
    if (!normalizedCollaboratorSearch) return activeCollaborators
    return activeCollaborators.filter((entry) =>
      normalizeSearchValue(String(entry.getAttribute("name") ?? "")).includes(
        normalizedCollaboratorSearch
      )
    )
  }, [activeCollaborators, normalizedCollaboratorSearch])

  const machineOptions = React.useMemo(() => {
    if (!normalizedMachineSearch) return activeMachines
    return activeMachines.filter((entry) =>
      normalizeSearchValue(String(entry.getAttribute("description") ?? "")).includes(
        normalizedMachineSearch
      )
    )
  }, [activeMachines, normalizedMachineSearch])

  const pcpOptions = React.useMemo(() => {
    if (!normalizedPcpSearch) return pcps
    return pcps.filter((entry) =>
      normalizeSearchValue(String(entry.getAttribute("description") ?? "")).includes(
        normalizedPcpSearch
      )
    )
  }, [normalizedPcpSearch, pcps])

  const availableStock = React.useMemo(() => {
    if (source === "component") return resolveComponentStock(selectedComponent)
    if (source === "inventory") return resolveInventoryStock(selectedInventoryItem)
    return null
  }, [selectedComponent, selectedInventoryItem, source])

  const quantityValue = React.useMemo(() => parseLocalizedNumber(quantity) ?? 0, [quantity])
  const unitPriceValue = React.useMemo(
    () => (hasUnitPriceField ? parseLocalizedNumber(unitPrice) ?? 0 : 0),
    [hasUnitPriceField, unitPrice]
  )
  const totalValue = React.useMemo(
    () => (hasUnitPriceField ? quantityValue * unitPriceValue : 0),
    [hasUnitPriceField, quantityValue, unitPriceValue]
  )

  const stockFormatter = React.useMemo(
    () => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 }),
    []
  )

  React.useEffect(() => {
    const initialSource = movimentoSourceToFormSource(movement?.source)
    const selectedMovementItemId =
      initialSource === "component"
        ? movement?.itemId
        : initialSource === "inventory"
          ? movement?.inventoryItemId
          : undefined

    setSource(initialSource)
    setItemId(selectedMovementItemId ? String(selectedMovementItemId) : "")
    setCollaboratorId(movement?.collaboratorId ? String(movement.collaboratorId) : "")
    setMachineId(movement?.machineId ? String(movement.machineId) : "")
    setPcpId(movement?.productionOrderId ? String(movement.productionOrderId) : "")
    setQuantity(
      movement?.quantidade !== undefined && movement?.quantidade !== null
        ? String(movement.quantidade)
        : "0"
    )
    setUnitPrice(
      hasUnitPriceField ? formatMoneyInput(movement?.precoUnitario ?? null) : ""
    )
    setOrderNumber(movement?.ordem ?? "")
    setJustification(movement?.justification ?? "")
    setErrors({})
  }, [hasUnitPriceField, movement])

  React.useEffect(() => {
    if (!source || isEdition) return
    if (source === "component" && !activeComponents.some((entry) => entry.getApiId()?.toString() === itemId)) {
      setItemId("")
    }
    if (source === "inventory" && !activeInventoryItems.some((entry) => String(entry.id) === itemId)) {
      setItemId("")
    }
  }, [activeComponents, activeInventoryItems, isEdition, itemId, source])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const nextErrors: FormErrors = {}

    if (!source) nextErrors.source = "Selecione o macrogrupo"
    if (!itemId) nextErrors.item = "Campo obrigatório"
    if (!collaboratorId) nextErrors.collaborator = "Campo obrigatório"
    if (movementType === "OUT" && !machineId) nextErrors.machine = "Campo obrigatório"

    const parsedQuantity = parseLocalizedNumber(quantity)
    if (!parsedQuantity || parsedQuantity <= 0) {
      nextErrors.quantity = "Informe uma quantidade válida"
    }

    if (
      source === "component" &&
      parsedQuantity !== null &&
      parsedQuantity > 0 &&
      !Number.isInteger(parsedQuantity)
    ) {
      nextErrors.quantity = "Ferramentas aceitam somente quantidade inteira"
    }

    if (
      movementType === "OUT" &&
      parsedQuantity !== null &&
      typeof availableStock === "number" &&
      parsedQuantity > availableStock
    ) {
      nextErrors.quantity = `Quantidade maior que disponível (${stockFormatter.format(availableStock)})`
    }

    const parsedUnitPrice =
      hasUnitPriceField && unitPrice.trim().length
        ? parseLocalizedNumber(unitPrice)
        : null
    if (hasUnitPriceField && unitPrice.trim().length && parsedUnitPrice === null) {
      nextErrors.unitPrice = "Preço unitário inválido"
    }
    if (hasUnitPriceField && parsedUnitPrice !== null && parsedUnitPrice < 0) {
      nextErrors.unitPrice = "Preço unitário inválido"
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const normalizedSource = source as MovementFormSource
    const normalizedQuantity =
      normalizedSource === "component"
        ? Math.trunc(parsedQuantity as number)
        : Number((parsedQuantity as number).toFixed(6))
    const totalPrice =
      !hasUnitPriceField || parsedUnitPrice === null
        ? null
        : Number((parsedUnitPrice * normalizedQuantity).toFixed(2))

    const selectedCode =
      normalizedSource === "component"
        ? String(selectedComponent?.getAttribute("code") ?? movement?.codigo ?? "")
        : String(selectedInventoryItem?.code ?? movement?.codigo ?? "")
    const selectedName =
      normalizedSource === "component"
        ? String(selectedComponent?.getAttribute("name") ?? movement?.item ?? "")
        : String(selectedInventoryItem?.name ?? movement?.item ?? "")

    const payload: MovementFormPayload = {
      id: movement?.movementId ?? null,
      source: normalizedSource,
      type: movementType,
      quantity: normalizedQuantity,
      selectedItemId: Number(itemId),
      selectedItemCode: selectedCode,
      selectedItemName: selectedName,
      collaboratorId: collaboratorId ? Number(collaboratorId) : null,
      selectedCollaboratorName: toOptionalString(
        String(selectedCollaborator?.getAttribute("name") ?? "")
      ),
      selectedCollaboratorCode: toOptionalString(
        String(selectedCollaborator?.getAttribute("code") ?? "")
      ),
      selectedCollaboratorActive: selectedCollaborator
        ? Boolean(selectedCollaborator.getAttribute("active"))
        : true,
      machineId: machineId ? Number(machineId) : null,
      selectedMachineDescription: toOptionalString(
        String(selectedMachine?.getAttribute("description") ?? movement?.maquina ?? "")
      ),
      selectedMachineCode: toOptionalString(String(selectedMachine?.getAttribute("code") ?? "")),
      selectedMachineModel: toOptionalString(String(selectedMachine?.getAttribute("model") ?? "")),
      selectedMachineActive: selectedMachine ? Boolean(selectedMachine.getAttribute("active")) : true,
      productionOrderId: pcpId ? Number(pcpId) : null,
      orderNumber: toOptionalString(orderNumber),
      unitPrice: hasUnitPriceField ? parsedUnitPrice : null,
      totalPrice,
      justification: toOptionalString(justification),
    }

    try {
      setSubmitting(true)
      await onSubmit(payload)
      onRequestClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  const itemLabel = truncateText(
    source === "component"
      ? componentLabel(selectedComponent) || movementItemLabel(movement)
      : source === "inventory"
        ? inventoryLabel(selectedInventoryItem) || movementItemLabel(movement)
        : ""
  )
  const collaboratorLabel = truncateText(
    String(selectedCollaborator?.getAttribute("name") ?? movement?.responsavel ?? "")
  )
  const machineLabel = truncateText(
    String(selectedMachine?.getAttribute("description") ?? movement?.maquina ?? "")
  )
  const pcpLabel = truncateText(String(selectedPcp?.getAttribute("description") ?? ""))

  return (
    <DrawerContent
      onPointerDownOutside={(event) => event.preventDefault()}
      onEscapeKeyDown={(event) => event.preventDefault()}
    >
      <DrawerHeader>
        <div className="flex items-center justify-between gap-2">
          <DrawerTitle>{title}</DrawerTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar formulário"
            onClick={() => onRequestClose?.()}
          >
            <X className="size-4" />
          </Button>
        </div>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
        {!source ? (
          <div className="grid gap-3">
            <p className="text-muted-foreground">Selecione a categoria</p>
            <button
              type="button"
              className="rounded-lg border bg-background px-3 py-3 text-sm font-medium text-left transition-colors hover:bg-muted"
              onClick={() => setSource("component")}
              disabled={submitting}
            >
              Ferramentas
            </button>
            <button
              type="button"
              className="rounded-lg border bg-background px-3 py-3 text-sm font-medium text-left transition-colors hover:bg-muted"
              onClick={() => setSource("inventory")}
              disabled={submitting}
            >
              Matéria-prima e consumíveis
            </button>
            {errors.source ? <span className="text-xs text-destructive">{errors.source}</span> : null}
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit} aria-busy={submitting}>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium">
                {source === "component" ? "Ferramentas" : "Matéria-prima e consumíveis"}
              </div>
              {!sourceLocked ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1"
                  onClick={() => {
                    setSource(null)
                    setItemId("")
                    setErrors((prev) => ({ ...prev, source: undefined, item: undefined }))
                  }}
                >
                  <ArrowLeft className="mr-1 size-3.5" />
                  Voltar
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <Label>{source === "component" ? "Ferramenta" : "Matéria-prima / consumivel"}</Label>
              <Select
                value={itemId}
                onValueChange={setItemId}
                disabled={sourceLocked}
                onOpenChange={(open) => {
                  if (!open) setItemSearch("")
                }}
              >
                <SelectTrigger className={cn("w-full min-w-0", errors.item && "border-destructive")}>
                  <SelectDisplay
                    label={itemLabel}
                    placeholder={
                      source === "component"
                        ? "Selecione uma ferramenta"
                        : "Selecione matéria-prima / consumível"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectSearchInput
                    value={itemSearch}
                    onChange={setItemSearch}
                    placeholder={
                      source === "component"
                        ? "Buscar ferramenta..."
                        : "Buscar matéria-prima / consumível..."
                    }
                  />
                  {source === "component" ? (
                    componentOptions.length ? (
                      componentOptions.map((entry) => (
                        <SelectItem key={entry.getApiId()} value={String(entry.getApiId())}>
                          <span
                            className="block max-w-[280px] truncate"
                            title={componentLabel(entry) || "Sem identificação"}
                          >
                            {truncateText(componentLabel(entry) || "Sem identificação", 80)}
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_component_items__" disabled>
                        Nenhuma ferramenta ativa encontrada
                      </SelectItem>
                    )
                  ) : inventoryOptions.length ? (
                    inventoryOptions.map((entry) => (
                      <SelectItem key={entry.id} value={String(entry.id)}>
                        <span
                          className="block max-w-[280px] truncate"
                          title={inventoryLabel(entry) || "Sem identificação"}
                        >
                          {truncateText(inventoryLabel(entry) || "Sem identificação", 80)}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_inventory_items__" disabled>
                      Nenhum item de inventário ativo encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.item ? <span className="text-xs text-destructive">{errors.item}</span> : null}
              {itemId && typeof availableStock === "number" ? (
                <span
                  className={cn(
                    "text-xs text-muted-foreground",
                    movementType === "OUT" && quantityValue > availableStock && "text-destructive"
                  )}
                >
                  Quantidade disponível: {stockFormatter.format(availableStock)}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Colaborador</Label>
              <Select
                value={collaboratorId}
                onValueChange={setCollaboratorId}
                onOpenChange={(open) => {
                  if (!open) setCollaboratorSearch("")
                }}
              >
                <SelectTrigger className={cn("w-full min-w-0", errors.collaborator && "border-destructive")}>
                  <SelectDisplay label={collaboratorLabel} placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectSearchInput
                    value={collaboratorSearch}
                    onChange={setCollaboratorSearch}
                    placeholder="Buscar colaborador..."
                  />
                  {collaboratorOptions.length ? (
                    collaboratorOptions.map((entry) => (
                      <SelectItem key={entry.getApiId()} value={String(entry.getApiId())}>
                        <span
                          className="block max-w-[280px] truncate"
                          title={String(entry.getAttribute("name") ?? "")}
                        >
                          {truncateText(String(entry.getAttribute("name") ?? ""), 80)}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_collaborators__" disabled>
                      Nenhum colaborador ativo encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.collaborator ? (
                <span className="text-xs text-destructive">{errors.collaborator}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Máquina {movementType === "OUT" ? "*" : "(opcional)"}</Label>
              <Select
                value={machineId}
                onValueChange={setMachineId}
                onOpenChange={(open) => {
                  if (!open) setMachineSearch("")
                }}
              >
                <SelectTrigger className={cn("w-full min-w-0", errors.machine && "border-destructive")}>
                  <SelectDisplay label={machineLabel} placeholder="Selecione uma máquina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectSearchInput
                    value={machineSearch}
                    onChange={setMachineSearch}
                    placeholder="Buscar máquina..."
                  />
                  {machineOptions.length ? (
                    machineOptions.map((entry) => (
                      <SelectItem key={entry.getApiId()} value={String(entry.getApiId())}>
                        <span
                          className="block max-w-[280px] truncate"
                          title={String(entry.getAttribute("description") ?? "")}
                        >
                          {truncateText(String(entry.getAttribute("description") ?? ""), 80)}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_machines__" disabled>
                      Nenhuma máquina ativa encontrada
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.machine ? <span className="text-xs text-destructive">{errors.machine}</span> : null}
            </div>

            <div
              className={cn(
                "grid gap-4",
                hasUnitPriceField ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
              )}
            >
              <div className="flex flex-col gap-1">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={quantity}
                  min="0"
                  step={source === "component" ? "1" : "any"}
                  inputMode={source === "component" ? "numeric" : "decimal"}
                  onChange={(event) => setQuantity(normalizeQuantityInput(event.target.value, source))}
                  className={cn(errors.quantity && "border-destructive")}
                />
                {errors.quantity ? <span className="text-xs text-destructive">{errors.quantity}</span> : null}
              </div>
              {hasUnitPriceField ? (
                <div className="flex flex-col gap-1">
                  <Label>Preço unitário (opcional)</Label>
                  <Input
                    value={unitPrice}
                    inputMode="decimal"
                    placeholder="0,00"
                    onChange={(event) => setUnitPrice(normalizeMoneyInput(event.target.value))}
                    onBlur={() => {
                      const parsed = parseLocalizedNumber(unitPrice)
                      if (parsed === null) return
                      setUnitPrice(formatMoneyInput(parsed))
                    }}
                    className={cn(errors.unitPrice && "border-destructive")}
                  />
                  {errors.unitPrice ? <span className="text-xs text-destructive">{errors.unitPrice}</span> : null}
                </div>
              ) : null}
            </div>

            {hasUnitPriceField ? (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Total calculado</p>
                <p className="text-sm font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalValue)}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-1">
              <Label>Ordem / documento</Label>
              <Input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="Ex.: OS-2026-001 ou NF-2026-010"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Ordem de produção (opcional)</Label>
              <Select
                value={pcpId}
                onValueChange={setPcpId}
                onOpenChange={(open) => {
                  if (!open) setPcpSearch("")
                }}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectDisplay label={pcpLabel} placeholder="Selecione uma ordem de produção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectSearchInput value={pcpSearch} onChange={setPcpSearch} placeholder="Buscar ordem..." />
                  {pcpOptions.length ? (
                    pcpOptions.map((entry) => (
                      <SelectItem key={entry.getApiId()} value={String(entry.getApiId())}>
                        <span
                          className="block max-w-[280px] truncate"
                          title={String(entry.getAttribute("description") ?? "")}
                        >
                          {truncateText(String(entry.getAttribute("description") ?? ""), 80)}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_pcp__" disabled>
                      Nenhuma ordem cadastrada
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Justificativa (opcional)</Label>
              <Textarea
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
                rows={3}
                placeholder="Ex.: Saída para manutenção"
              />
            </div>

            <DrawerFooter className="px-0">
              <Button type="submit" disabled={submitting} className="dark:text-white">
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={submitting}
                onClick={() => onRequestClose?.()}
              >
                Cancelar
              </Button>
            </DrawerFooter>
          </form>
        )}
      </div>
    </DrawerContent>
  )
}
