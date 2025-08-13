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
import { cn } from "@/lib/utils"

interface FerramentaFormProps {
  onSubmit: (dto: ItemDto) => Promise<unknown>
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
  const [manufacturerId, setManufacturerId] = React.useState(
    resource?.getRelation("manufacturer")?.getApiId()?.toString() ?? ""
  )
  const [itemGroupId, setItemGroupId] = React.useState(
    resource?.getRelation("itemGroup")?.getApiId()?.toString() ?? ""
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    nome?: string
    codigo?: string
    itemGroup?: string
    manufacturer?: string
  }>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const nome = data.get("nome")?.toString().trim() || ""
    const codigo = data.get("codigo")?.toString().trim() || ""
    const manufacturerRsc = manufacturers.find(
      (m) => m.getApiId()?.toString() === manufacturerId
    )
    const itemGroupRsc = itemGroups.find(
      (g) => g.getApiId()?.toString() === itemGroupId
    )

    const newErrors: typeof errors = {}
    if (!nome) newErrors.nome = "Campo obrigatório"
    if (!codigo) newErrors.codigo = "Campo obrigatório"
    if (!itemGroupId) newErrors.itemGroup = "Campo obrigatório"
    if (!manufacturerId) newErrors.manufacturer = "Campo obrigatório"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new ItemDto()
    if (resource) dto.createFromColoquentResource(resource)
    dto.name = nome
    dto.code = codigo
    dto.active = active
    dto.description = nome
    dto.min_quantity = Number(data.get("estoqueMinimo") || 0)
    dto.quantity = 0
    dto.manufacturerResource = manufacturerRsc
    dto.itemGroupResource = itemGroupRsc

    try {
      setSubmitting(true)
      await onSubmit(dto)
      form.reset()
      setActive(true)
      form
        .closest("[data-state=open]")
        ?.querySelector("button[data-close]")?.click()
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
          {/* Nome */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={resource?.getAttribute("name")}
              className={cn(errors.nome && "border-destructive")}
            />
            {errors.nome && (
              <span className="text-destructive text-xs">{errors.nome}</span>
            )}
          </div>

          {/* Código */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              name="codigo"
              defaultValue={resource?.getAttribute("code")}
              className={cn(errors.codigo && "border-destructive")}
            />
            {errors.codigo && (
              <span className="text-destructive text-xs">{errors.codigo}</span>
            )}
          </div>

          {/* Grupo */}
          <div className="flex flex-col gap-3">
            <Label>Grupo</Label>
            <Select value={itemGroupId} onValueChange={setItemGroupId}>
              <SelectTrigger
                className={cn(errors.itemGroup && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {itemGroups.map((g) => (
                  <SelectItem
                    key={g.getApiId()}
                    value={g.getApiId()?.toString() || ""}
                  >
                    {g.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemGroup && (
              <span className="text-destructive text-xs">
                {errors.itemGroup}
              </span>
            )}
          </div>

          {/* Fabricante */}
          <div className="flex flex-col gap-3">
            <Label>Fabricante</Label>
            <Select value={manufacturerId} onValueChange={setManufacturerId}>
              <SelectTrigger
                className={cn(errors.manufacturer && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um fabricante" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((m) => (
                  <SelectItem
                    key={m.getApiId()}
                    value={m.getApiId()?.toString() || ""}
                  >
                    {m.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.manufacturer && (
              <span className="text-destructive text-xs">
                {errors.manufacturer}
              </span>
            )}
          </div>

          {/* Estoques */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
            <Input
              id="estoqueMinimo"
              name="estoqueMinimo"
              type="number"
              defaultValue={
                resource?.getAttribute("min_quantity")?.toString() ?? ""
              }
            />
          </div>

          {/* Fornecedor */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input
              id="fornecedor"
              name="fornecedor"
              defaultValue={resource?.getAttribute("supplier")}
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch
              id="status"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
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