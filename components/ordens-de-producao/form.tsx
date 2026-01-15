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
import { ProductionOrderResource } from "@/resources/ProductionOrders/production-orders.resource"
import { ProductionOrderDto } from "@/resources/ProductionOrders/production-orders.dto"
import { cn } from "@/lib/utils"

interface Props {
  onSubmit: (dto: ProductionOrderDto) => Promise<unknown> | void
  resource?: ProductionOrderResource
  title: string
  onRequestClose?: () => void
}

export function OrdemProducaoForm({ onSubmit, resource, title, onRequestClose }: Props) {
  const isEditing = !!resource
  const [active, setActive] = React.useState(() => {
    if (!resource) return true
    return Number(resource?.getAttribute("active")) === 1
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ descricao?: string; codigo?: string }>(
    {}
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const descricao = String(data.get("descricao") || "").trim()
    const codigo = String(data.get("codigo") || "").trim()

    const newErrors: { descricao?: string; codigo?: string } = {}
    if (!descricao) newErrors.descricao = "Campo obrigatorio"
    if (!codigo) newErrors.codigo = "Campo obrigatorio"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new ProductionOrderDto()
    if (resource) dto.createFromColoquentResource(resource)
    dto.description = descricao
    dto.code = codigo
    dto.active = active ? 1 : 0

    try {
      setSubmitting(true)
      await onSubmit(dto)
      form.reset()
      if (!isEditing) {
        setActive(true)
      }
      onRequestClose?.()
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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="descricao">Descricao</Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={resource?.getAttribute("description")}
              className={cn(errors.descricao && "border-destructive")}
            />
            {errors.descricao && (
              <span className="text-destructive text-xs">{errors.descricao}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="codigo">Codigo</Label>
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

          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch
              id="status"
              checked={active}
              onCheckedChange={setActive}
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
