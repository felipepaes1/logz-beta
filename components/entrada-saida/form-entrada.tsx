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

export function EntradaForm({
  onSubmit,
  resource,
  itemGroups,
  items,
  collaborators,
  title = "Cadastrar Entrada",
  disableEdition,
}: {
  onSubmit: (dto: ComponentDto) => void
  resource?: ComponentResource
  itemGroups: ItemGroupResource[]
  items: ItemResource[]
  collaborators: CollaboratorResource[]
  title?: string
  disableEdition?: boolean
}) {
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

  const filteredItems = React.useMemo(() => {
    return items.filter((i) => {
      const g = i.getRelation("itemGroup") as ItemGroupResource | undefined
      return group && String(g?.getApiId()) === group
    })
  }, [items, group])

  const total = unitPrice * quantity

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const dto = new ComponentDto()
            dto.createFromColoquentResource(resource ?? new ComponentResource())
            dto.type = ComponentTypeEnum.IN
            dto.unitPrice = unitPrice
            dto.quantity = quantity
            const groupResource = itemGroups.find(
              (g) => String(g.getApiId()) === group
            )
            const itemResource = items.find(
              (i) => String(i.getApiId()) === item
            )
            const collaboratorResource = collaborators.find(
              (c) => String(c.getApiId()) === collaborator
            )
            if (groupResource) dto.itemGroupResource = groupResource
            if (itemResource) dto.itemResource = itemResource
            if (collaboratorResource) dto.collaboratorResource = collaboratorResource
            dto.totalPrice = dto.unitPrice * dto.quantity
            onSubmit(dto)
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={group} onValueChange={setGroup} disabled={disableEdition}>
              <SelectTrigger id="grupo" className="w-full">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {itemGroups.map((g) => (
                  <SelectItem key={String(g.getApiId())} value={String(g.getApiId())}>
                    {g.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="ferramenta">Ferramenta</Label>
            <Select value={item} onValueChange={setItem} disabled={disableEdition}>
              <SelectTrigger id="ferramenta" className="w-full">
                <SelectValue placeholder="Selecione uma ferramenta" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((i) => (
                  <SelectItem key={String(i.getApiId())} value={String(i.getApiId())}>
                    {i.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="colaborador">Colaborador</Label>
            <Select value={collaborator} onValueChange={setCollaborator}>
              <SelectTrigger id="colaborador" className="w-full">
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map((c) => (
                  <SelectItem key={String(c.getApiId())} value={String(c.getApiId())}>
                    {c.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="precoUnitario">Preço unitário</Label>
            <Input
              id="precoUnitario"
              name="precoUnitario"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              name="quantidade"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
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
            <Button type="submit">Salvar</Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </div>
    </DrawerContent>
  )
}

