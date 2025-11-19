"use client"

import * as React from "react"
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ComponentResource } from "@/resources/Component/component.resource"
import { ComponentDto } from "@/resources/Component/component.dto"
import { ComponentTypeEnum } from "@/resources/Component/component.enum"
import { ItemResource } from "@/resources/Item/item.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { cn } from "@/lib/utils"
import {
  SelectDisplay,
  SelectSearchInput,
  formatItemLabel,
  isResourceActive,
  normalizeSearchValue,
} from "./form-utils"

interface Props {
  onSubmit: (dto: ComponentDto) => Promise<unknown>
  resource?: ComponentResource
  itemGroups: ItemGroupResource[]
  items: ItemResource[]
  collaborators: CollaboratorResource[]
  title?: string
  disableEdition?: boolean
  onRequestClose?: () => void
}

export function EntradaForm({
  onSubmit,
  resource,
  itemGroups,
  items,
  collaborators,
  title = "Cadastrar Entrada",
  disableEdition,
  onRequestClose
}: Props): React.ReactElement {

  const itemRelation = resource?.getRelation("item") as ItemResource | undefined
  const groupRelation = itemRelation?.getRelation("itemGroup") as
    | ItemGroupResource
    | undefined
  const collaboratorRelation = resource?.getRelation(
    "collaborator"
  ) as CollaboratorResource | undefined

  const [group, setGroup] = React.useState<string>(groupRelation?.getApiId()?.toString() ?? "")
  const [item, setItem] = React.useState<string>(itemRelation?.getApiId()?.toString() ?? "")
  const [collaborator, setCollaborator] = React.useState<string>(collaboratorRelation?.getApiId()?.toString() ?? "")
  const unitInputRef = React.useRef<HTMLInputElement>(null)
  const [unitPriceCents, setUnitPriceCents] = React.useState<number>(0)
  const [quantity, setQuantity] = React.useState<string>("0")
  const [order, setOrder] = React.useState<string>("")

  React.useEffect(() => {
    const up = Number(resource?.getAttribute?.("unit_price") ?? 0)
    setUnitPriceCents(Math.max(0, Math.round(up * 100)))
    setQuantity(String(resource?.getAttribute?.("quantity") ?? 0))
    setGroup(groupRelation?.getApiId()?.toString() ?? "")
    setItem(itemRelation?.getApiId()?.toString() ?? "")
    setCollaborator(collaboratorRelation?.getApiId()?.toString() ?? "")
    setOrder(resource?.getRelation?.("order")?.getApiId()?.toString() ?? "")
  }, [resource])

  const quantityNumber = React.useMemo(
    () => Number(quantity) || 0,
    [quantity]
  )

  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
      item?: string
      collaborator?: string
      unitPrice?: string
      quantity?: string
    }>({})
  const [groupSearch, setGroupSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [collaboratorSearch, setCollaboratorSearch] = React.useState("")


  const activeItemGroups = React.useMemo(
    () => itemGroups.filter(isResourceActive),
    [itemGroups]
  )
  const activeItems = React.useMemo(
    () => items.filter(isResourceActive),
    [items]
  )
  const selectableItems = React.useMemo(() => {
    if (!group) return activeItems
    return activeItems.filter((i) => {
      const g = i.getRelation("itemGroup") as ItemGroupResource | undefined
      return g?.getApiId()?.toString() === group
    })
  }, [activeItems, group])
  const activeCollaborators = React.useMemo(
    () => collaborators.filter(isResourceActive),
    [collaborators]
  )
  const selectedItemResource = React.useMemo(
    () => (item ? items.find((i) => i.getApiId()?.toString() === item) : undefined),
    [items, item]
  )
  const selectedGroupResource = React.useMemo(
    () => (group ? itemGroups.find((g) => g.getApiId()?.toString() === group) : undefined),
    [itemGroups, group]
  )
  const selectedCollaboratorResource = React.useMemo(
    () =>
      (collaborator
        ? collaborators.find((c) => c.getApiId()?.toString() === collaborator)
        : undefined),
    [collaborators, collaborator]
  )
  const normalizedGroupSearch = React.useMemo(
    () => normalizeSearchValue(groupSearch),
    [groupSearch]
  )
  const normalizedItemSearch = React.useMemo(
    () => normalizeSearchValue(itemSearch),
    [itemSearch]
  )
  const normalizedCollaboratorSearch = React.useMemo(
    () => normalizeSearchValue(collaboratorSearch),
    [collaboratorSearch]
  )
  const groupOptions = React.useMemo(() => {
    if (!normalizedGroupSearch) return activeItemGroups
    return activeItemGroups.filter((g) => {
      const description = g.getAttribute?.("description") ?? ""
      return normalizeSearchValue(String(description)).includes(normalizedGroupSearch)
    })
  }, [activeItemGroups, normalizedGroupSearch])
  const filteredSelectableItems = React.useMemo(() => {
    if (!normalizedItemSearch) return selectableItems
    return selectableItems.filter((i) =>
      normalizeSearchValue(formatItemLabel(i) || "").includes(normalizedItemSearch)
    )
  }, [normalizedItemSearch, selectableItems])
  const collaboratorOptions = React.useMemo(() => {
    if (!normalizedCollaboratorSearch) return activeCollaborators
    return activeCollaborators.filter((c) => {
      const name = c.getAttribute?.("name") ?? ""
      return normalizeSearchValue(String(name)).includes(normalizedCollaboratorSearch)
    })
  }, [activeCollaborators, normalizedCollaboratorSearch])

  const unitPrice = React.useMemo(() => unitPriceCents / 100, [unitPriceCents])
  const total = unitPrice * quantityNumber
  const noop = React.useCallback(() => {}, [])
  const groupLabel =
    selectedGroupResource?.getAttribute?.("description") ??
    groupRelation?.getAttribute?.("description") ??
    ""
  const itemLabel = formatItemLabel(selectedItemResource ?? itemRelation)
  const collaboratorLabel =
    selectedCollaboratorResource?.getAttribute?.("name") ??
    collaboratorRelation?.getAttribute?.("name") ??
    ""

  React.useEffect(() => {
    if (!group) return
    if (
      item &&
      !selectableItems.some(
        (i) => i.getApiId()?.toString() === item
      )
    ) {
      setItem("")
    }
  }, [group, item, selectableItems])

  function placeCaretEnd(el: HTMLInputElement | null) {
    if (!el) return
    const len = el.value.length
    requestAnimationFrame(() => el.setSelectionRange(len, len))
  }

  function formatCentsToPtBR(cents: number): string {
    const abs = Math.max(0, Math.trunc(cents))
    const reais = (abs / 100).toFixed(2)     
    return reais.replace(".", ",")           
  }


  function handleUnitKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key
    if (/^\d$/.test(key)) {
      e.preventDefault()
      const digit = Number(key)
      setUnitPriceCents((prev) => {
        const next = prev * 10 + digit
        return Math.min(next, 999_999_999_99)
      })
      placeCaretEnd(unitInputRef.current)
      return
    }
    
    if (key === "Backspace") {
      e.preventDefault()
      setUnitPriceCents((prev) => Math.floor(prev / 10))
      placeCaretEnd(unitInputRef.current)
      return
    }
    
    if (key === "Delete") {
      e.preventDefault()
      setUnitPriceCents(0)
      placeCaretEnd(unitInputRef.current)
      return
    }

    if (key === "," || key === "." || key.startsWith("Arrow") || key === "Home" || key === "End") {
      e.preventDefault()
    }
  }

  const unitPriceDisplay = React.useMemo(
    () => formatCentsToPtBR(unitPriceCents),
    [unitPriceCents]
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    const formEl = e.currentTarget as HTMLFormElement

    const newErrors: typeof errors = {}
    const itemResource = selectedItemResource
    const collaboratorResource = selectedCollaboratorResource
    if (!itemResource) newErrors.item = "Campo obrigatório"
    if (!collaborator || !collaboratorResource)
      newErrors.collaborator = "Campo obrigatório"
    if (unitPrice <= 0) newErrors.unitPrice = "Informe um valor"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new ComponentDto()
    dto.createFromColoquentResource(resource ?? new ComponentResource())
    dto.type = ComponentTypeEnum.IN
    dto.unitPrice = unitPrice
    dto.quantity = quantityNumber
    dto.totalPrice = total
    if (itemResource) {
      dto.itemResource = itemResource
      const manualGroupResource = group
        ? itemGroups.find((g) => g.getApiId()?.toString() === group)
        : undefined
      const relatedGroup = itemResource.getRelation?.("itemGroup") as
        | ItemGroupResource
        | undefined
      const attrGroupId = itemResource
        .getAttribute?.("item_group_id")
        ?.toString?.()
      const fallbackGroup =
        attrGroupId
          ? itemGroups.find(
              (g) => g.getApiId()?.toString() === attrGroupId
            )
          : undefined
      const resolvedGroup =
        manualGroupResource ?? relatedGroup ?? fallbackGroup
      if (resolvedGroup) {
        dto.itemGroupResource = resolvedGroup
      }
    }
    if (collaboratorResource) {
      dto.collaboratorResource = collaboratorResource
    }
    try {
      setSubmitting(true)
      await onSubmit(dto)
      try {
        if (formEl && formEl.isConnected) formEl.reset()
      } catch {}
      setGroup("")
      setItem("")
      setCollaborator("")
      setUnitPriceCents(0)
      setQuantity("0")
      setErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DrawerContent
      onPointerDownOutside={(e) => {
        e.preventDefault()
      }}
      onEscapeKeyDown={(e) => {
        e.preventDefault()
      }}
    >
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} aria-busy={submitting}>
          <div className="flex flex-col gap-1">
            <Label>Grupo</Label>
            <Select
              value={group}
              onValueChange={setGroup}
              disabled={disableEdition}
              onOpenChange={(open) => {
                if (!open) setGroupSearch("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectDisplay
                  label={groupLabel}
                  placeholder="Selecione um grupo"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={groupSearch}
                  onChange={setGroupSearch}
                  placeholder="Buscar grupo..."
                />
                {groupOptions.length === 0 ? (
                  <SelectItem value="__no_group__" disabled>
                    {activeItemGroups.length === 0
                      ? "Nenhum grupo ativo disponivel"
                      : "Nenhum grupo encontrado"}
                  </SelectItem>
                ) : (
                  groupOptions.map((g) => (
                    <SelectItem key={g.getApiId()} value={g.getApiId()!.toString()}>
                      {g.getAttribute("description")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Ferramenta</Label>
            <Select
              value={item}
              onValueChange={setItem}
              disabled={disableEdition}
              onOpenChange={(open) => {
                if (!open) setItemSearch("")
              }}
            >
              <SelectTrigger
                className={cn("w-full", errors.item && "border-destructive")}
              >
                <SelectDisplay
                  label={itemLabel}
                  placeholder="Selecione uma ferramenta"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={itemSearch}
                  onChange={setItemSearch}
                  placeholder="Buscar ferramenta..."
                />
                {filteredSelectableItems.length === 0 ? (
                  <SelectItem value="__empty_items__" disabled>
                    {selectableItems.length === 0
                      ? group
                        ? "Nenhuma ferramenta ativa neste grupo"
                        : "Nenhuma ferramenta ativa disponivel"
                      : "Nenhuma ferramenta encontrada"}
                  </SelectItem>
                ) : (
                  filteredSelectableItems.map((i) => {
                    const label =
                      formatItemLabel(i) ||
                      i.getAttribute("name") ||
                      i.getAttribute("code") ||
                      "Sem identificacao"
                    return (
                      <SelectItem
                        key={i.getApiId()}
                        value={i.getApiId()!.toString()}
                      >
                        {label}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
            {errors.item && (
              <span className="text-destructive text-xs">{errors.item}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Colaborador</Label>
            <Select
              value={collaborator}
              onValueChange={setCollaborator}
              onOpenChange={(open) => {
                if (!open) setCollaboratorSearch("")
              }}
            >
              <SelectTrigger
                className={cn("w-full", errors.collaborator && "border-destructive")}
              >
                <SelectDisplay
                  label={collaboratorLabel}
                  placeholder="Selecione um colaborador"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={collaboratorSearch}
                  onChange={setCollaboratorSearch}
                  placeholder="Buscar colaborador..."
                />
                {collaboratorOptions.length === 0 ? (
                  <SelectItem value="__no_collaborators__" disabled>
                    {activeCollaborators.length === 0
                      ? "Nenhum colaborador ativo disponivel"
                      : "Nenhum colaborador encontrado"}
                  </SelectItem>
                ) : (
                  collaboratorOptions.map((c) => (
                    <SelectItem
                      key={c.getApiId()}
                      value={c.getApiId()!.toString()}
                    >
                      {c.getAttribute("name")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.collaborator && (
              <span className="text-destructive text-xs">
                {errors.collaborator}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Preço unitário</Label>
              <Input
                ref={unitInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9.,]*"
                placeholder="0,00"
                aria-label="Preço unitário em reais"
                onChange={noop} 
                value={unitPriceDisplay}
                onKeyDown={handleUnitKeyDown}
                onPaste={(e) => {
                  e.preventDefault()
                  const text = e.clipboardData.getData("text")
                  const digits = (text || "").replace(/\D/g, "")
                  if (!digits) {
                    setUnitPriceCents(0)
                  } else {
                    setUnitPriceCents(Math.min(parseInt(digits, 10), 999_999_999_99))
                  }
                  placeCaretEnd(unitInputRef.current)
                }}
                onFocus={(e) => placeCaretEnd(e.currentTarget)}
                onClick={(e) => placeCaretEnd(e.currentTarget)}
                className={cn(
                  "tabular-nums text-right",
                  errors.unitPrice && "border-destructive"
                )}
                // Evita scroll em inputs numéricos no desktop
                onWheel={(e) => {
                  // evita mudar valor ao rolar
                  (e.target as HTMLElement).blur()
                  setTimeout(() => unitInputRef.current?.focus(), 0)
                }}
              />
              {errors.unitPrice && (
                <span className="text-destructive text-xs">
                  {errors.unitPrice}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Quantidade</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                aria-label="Quantidade"
                value={quantity}
                onChange={(e) => {
                  // remove caracteres não numéricos
                  let v = e.target.value.replace(/\D/g, "")
                  // remove zeros à esquerda, mas mantém "0" se vazio
                  v = v.replace(/^0+(?=\d)/, "")
                  if (v === "") v = "0"
                  setQuantity(v)
                }}
                className={cn(errors.quantity && "border-destructive")}
              />
              {errors.quantity && (
                <span className="text-destructive text-xs">
                  {errors.quantity}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Total</Label>
            <span>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="ordemCompra">Ordem de compra</Label>
            <Input
              id="ordemCompra"
              name="ordemCompra"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={submitting} className="dark:text-white">
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button" data-close>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </div>
    </DrawerContent>
  )
}

