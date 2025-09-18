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
import { MachineResource } from "@/resources/Machine/machine.resource"
import { MachineDto } from "@/resources/Machine/machine.dto"
import { cn } from "@/lib/utils"

interface CentroCustoFormProps {
  onSubmit: (c: MachineDto) => void
  resource?: MachineResource
  title: string
  onRequestClose?: () => void
}

export function CentroCustoForm({ onSubmit, resource, title, onRequestClose }: CentroCustoFormProps) {
  const [active, setActive] = React.useState(
    resource?.getAttribute("active") ?? true
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ descricao?: string; codigo?: string; modelo?: string}>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const descricao = data.get("descricao")?.toString().trim() || ""
    const codigo    = data.get("codigo")?.toString().trim() || ""
    const modelo    = data.get("modelo")?.toString().trim() || ""

    const newErrors: typeof errors = {}
    if (!descricao) newErrors.descricao = "Campo obrigatório"
    if (!codigo)    newErrors.codigo    = "Campo obrigatório"
    if (!modelo)    newErrors.modelo    = "Campo obrigatório"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

  const dto = new MachineDto()
  if (resource) dto.createFromColoquentResource(resource)
  dto.description = descricao
  dto.code = codigo
  dto.model = modelo
  dto.active = active

  try {
    setSubmitting(true)
    await onSubmit(dto)              
    form.reset()
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
          <div className="flex flex-col gap-3">
            <Label htmlFor="descricao">Nome</Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={resource?.getAttribute("description")}
              className={cn(errors.descricao && "border-destructive")}
          />
            {errors.descricao && <span className="text-destructive text-xs">{errors.descricao}</span>}
          </div>
          <div className="flex flex-col gap-3">
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
          <div className="flex flex-col gap-3">
            <Label htmlFor="codigo">Modelo</Label>
            <Input
              id="modelo"
              name="modelo"
              defaultValue={resource?.getAttribute("model")}
              className={cn(errors.modelo && "border-destructive")}
            />
            {errors.codigo && (
              <span className="text-destructive text-xs">{errors.codigo}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch id="status" checked={active} onCheckedChange={setActive} />
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={submitting} className="dark:text-white">
              {submitting ? "Salvando..." : "Salvar"}</Button>
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
