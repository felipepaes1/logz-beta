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
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ComponentResource } from "@/resources/Component/component.resource"
import { ComponentDto } from "@/resources/Component/component.dto"
import { ComponentTypeEnum } from "@/resources/Component/component.enum"
import { ItemResource } from "@/resources/Item/item.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { cn } from "@/lib/utils"

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
      group?: string
      item?: string
      collaborator?: string
      unitPrice?: string
      quantity?: string
    }>({})


  const filteredItems = React.useMemo(() => {
    return items.filter((i) => {
      const g = i.getRelation("itemGroup") as ItemGroupResource | undefined
      return group && String(g?.getApiId()) === group
    })
  }, [items, group])

  const unitPrice = React.useMemo(() => unitPriceCents / 100, [unitPriceCents])
  const total = unitPrice * quantityNumber
  const noop = React.useCallback(() => {}, [])

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

  /**
   * Regras:
   * - Apenas dígitos e vírgula (ou ponto, que vira vírgula).
   * - "247" => 247,00 (usuário digitou só inteiros).
   * - "247,5" => 247,50 ; "247,57" => 247,57
   * - Zeros à esquerda removidos do inteiro.
   */

  function handleUnitKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key
    // dígitos 0-9
    if (/^\d$/.test(key)) {
      e.preventDefault()
      const digit = Number(key)
      setUnitPriceCents((prev) => {
        const next = prev * 10 + digit
        return Math.min(next, 999_999_999_99) // trava ~R$ 9.999.999.999,99
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
    if (!group) newErrors.group = "Campo obrigatório"
    if (!item) newErrors.item = "Campo obrigatório"
    if (!collaborator) newErrors.collaborator = "Campo obrigatório"
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
    dto.itemGroupResource = itemGroups.find(
      (g) => g.getApiId()?.toString() === group
    )!
    dto.itemResource = items.find((i) => i.getApiId()?.toString() === item)!
    dto.collaboratorResource = collaborators.find(
      (c) => c.getApiId()?.toString() === collaborator
    )!

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
        onRequestClose?.()
      }}
      onEscapeKeyDown={(e) => {
        e.preventDefault()
        onRequestClose?.()
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
            >
              <SelectTrigger className={cn(errors.group && "border-destructive")}>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {itemGroups.map((g) => (
                  <SelectItem key={g.getApiId()} value={g.getApiId()!.toString()}>
                    {g.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.group && (
              <span className="text-destructive text-xs">{errors.group}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Ferramenta</Label>
            <Select
              value={item}
              onValueChange={setItem}
              disabled={disableEdition}
            >
              <SelectTrigger className={cn(errors.item && "border-destructive")}>
                <SelectValue placeholder="Selecione uma ferramenta" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((i) => (
                  <SelectItem key={i.getApiId()} value={i.getApiId()!.toString()}>
                    {i.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.item && (
              <span className="text-destructive text-xs">{errors.item}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Colaborador</Label>
            <Select value={collaborator} onValueChange={setCollaborator}>
              <SelectTrigger
                className={cn(errors.collaborator && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map((c) => (
                  <SelectItem
                    key={c.getApiId()}
                    value={c.getApiId()!.toString()}
                  >
                    {c.getAttribute("name")}
                  </SelectItem>
                ))}
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

