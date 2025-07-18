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
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ItemResource } from "@/resources/Item/item.resource"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { ItemDto } from "@/resources/Item/item.dto"

interface FerramentaFormProps {
  onSubmit: (dto: ItemDto) => void
  resource?: ItemResource
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
  title: string
}

export function FerramentaForm({
  onSubmit,
  resource,
  manufacturers,
  itemGroups,
  title,
}: FerramentaFormProps) {
  const [active, setActive] = React.useState(
    resource?.getAttribute("active") ?? true
  )
  const manufacturerRelation = resource?.getRelation("manufacturer") as
    | ManufacturerResource
    | undefined
  const itemGroupRelation = resource?.getRelation("itemGroup") as
    | ItemGroupResource
    | undefined
  const [manufacturer, setManufacturer] = React.useState(
    manufacturerRelation?.getApiId() ? String(manufacturerRelation.getApiId()) : ""
  )
  const [itemGroup, setItemGroup] = React.useState(
    itemGroupRelation?.getApiId() ? String(itemGroupRelation.getApiId()) : ""
  )

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
            const form = e.currentTarget
            const data = new FormData(form)
            const manufacturerResource = manufacturers.find(
              (m) => String(m.getApiId()) === manufacturer
            )
            const itemGroupResource = itemGroups.find(
              (g) => String(g.getApiId()) === itemGroup
            )
            const dto = new ItemDto()
            dto.createFromColoquentResource(resource ?? new ItemResource())
            dto.name = String(data.get("nome") || "")
            dto.description = String(data.get("descricao") || "")
            dto.code = String(data.get("codigo") || "")
            dto.min_quantity = Number(data.get("estoqueMinimo") || 0)
            dto.quantity = Number(data.get("estoqueAtual") || 0)
            dto.active = active
            if (manufacturerResource) {
              dto.manufacturerResource = manufacturerResource
            }
            if (itemGroupResource) {
              dto.itemGroupResource = itemGroupResource
            }
            onSubmit(dto)
            form.reset()
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={resource?.getAttribute("name")} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" defaultValue={resource?.getAttribute("description")} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" defaultValue={resource?.getAttribute("code")} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={itemGroup} onValueChange={setItemGroup}>
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
            <Label htmlFor="fabricante">Fabricante</Label>
            <Select value={manufacturer} onValueChange={setManufacturer}>
              <SelectTrigger id="fabricante" className="w-full">
                <SelectValue placeholder="Selecione um fabricante" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((m) => (
                  <SelectItem key={String(m.getApiId())} value={String(m.getApiId())}>
                    {m.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                name="estoqueMinimo"
                type="number"
                defaultValue={
                  resource?.getAttribute("min_quantity") !== undefined
                    ? String(resource.getAttribute("min_quantity"))
                    : undefined
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="estoqueAtual">Estoque Atual</Label>
              <Input
                id="estoqueAtual"
                name="estoqueAtual"
                type="number"
                defaultValue={
                  resource?.getAttribute("quantity") !== undefined
                    ? String(resource.getAttribute("quantity"))
                    : undefined
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input id="fornecedor" name="fornecedor" defaultValue={resource?.getAttribute("supplier")} />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch id="status" checked={active} onCheckedChange={setActive} />
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
