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
}

export function EntradaForm({
  onSubmit,
  resource,
  itemGroups,
  items,
  collaborators,
  title = "Cadastrar Entrada",
  disableEdition,
}: Props) {
  const itemRelation = resource?.getRelation("item") as ItemResource | undefined
  const groupRelation = itemRelation?.getRelation("itemGroup") as
    | ItemGroupResource
    | undefined
  const collaboratorRelation = resource?.getRelation(
    "collaborator"
  ) as CollaboratorResource | undefined

  const [group, setGroup] = React.useState(
    groupRelation?.getApiId() ? String(groupRelation.getApiId()) : ""
  )
  const [item, setItem] = React.useState(
    itemRelation?.getApiId() ? String(itemRelation.getApiId()) : ""
  )
  const [collaborator, setCollaborator] = React.useState(
    collaboratorRelation?.getApiId() ? String(collaboratorRelation.getApiId()) : ""
  )
  const [unitPrice, setUnitPrice] = React.useState(
    resource?.getAttribute("unit_price") ?? 0
  )
  const [quantity, setQuantity] = React.useState(
    resource?.getAttribute("quantity") ?? 0
  )

  const [order, setOrder] = React.useState(
    resource?.getRelation("order")?.getApiId() ? String(resource?.getRelation("order")?.getApiId()) : ""
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

  const total = unitPrice * quantity

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!group) newErrors.group = "Campo obrigatório"
    if (!item) newErrors.item = "Campo obrigatório"
    if (!collaborator) newErrors.collaborator = "Campo obrigatório"
    if (unitPrice <= 0) newErrors.unitPrice = "Informe um valor"
    if (quantity <= 0) newErrors.quantity = "Informe um valor"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new ComponentDto()
    dto.createFromColoquentResource(resource ?? new ComponentResource())
    dto.type = ComponentTypeEnum.IN
    dto.unitPrice = unitPrice
    dto.quantity = quantity
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
      ;(e.currentTarget as HTMLFormElement).reset()
      setGroup("")
      setItem("")
      setCollaborator("")
      setUnitPrice(0)
      setQuantity(0)
      setErrors({})
      e.currentTarget
        .closest("[data-state=open]")
        ?.querySelector<HTMLButtonElement>("button[data-close]")
        ?.click()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className={cn(errors.unitPrice && "border-destructive")}
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
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
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
            <Button type="submit" disabled={submitting}>
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

