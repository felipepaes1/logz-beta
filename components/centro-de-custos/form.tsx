"use client"

import * as React from "react"
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RequiredMark } from "@/components/ui/required-mark"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { MachineDto } from "@/resources/Machine/machine.dto"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CentroCustoFormProps {
  onSubmit: (c: MachineDto) => void
  resource?: MachineResource
  existingResources?: MachineResource[]
  title: string
  onRequestClose?: () => void
}

const normalizeComparableValue = (value: unknown) =>
  String(value ?? "").trim().toLocaleLowerCase()

export function CentroCustoForm({
  onSubmit,
  resource,
  existingResources = [],
  title,
  onRequestClose,
}: CentroCustoFormProps) {
  const [active, setActive] = React.useState(
    resource?.getAttribute("active") ?? true
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    descricao?: string
    codigo?: string
    modelo?: string
    duplicado?: string
  }>({})

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
    if (!resource && !modelo) newErrors.modelo = "Campo obrigatório"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    const currentId = resource?.getApiId?.()
    const duplicate = existingResources.some((existing) => {
      const existingId = existing.getApiId?.()
      if (
        resource &&
        currentId !== undefined &&
        currentId !== null &&
        String(existingId ?? "") === String(currentId)
      ) {
        return false
      }

      return (
        normalizeComparableValue(existing.getAttribute("description")) ===
          normalizeComparableValue(descricao) &&
        normalizeComparableValue(existing.getAttribute("code")) ===
          normalizeComparableValue(codigo) &&
        normalizeComparableValue(existing.getAttribute("model")) ===
          normalizeComparableValue(modelo)
      )
    })

    if (duplicate) {
      const message =
        "Já existe um centro de custo cadastrado com este nome, código e C.C."
      setErrors({ duplicado: message })
      toast.error(message)
      return
    }

    setErrors({})

  const dto = new MachineDto()
  if (resource) dto.createFromColoquentResource(resource)
  dto.description = descricao
  dto.code = codigo
  dto.model = modelo || null
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
        <DrawerDescription className="sr-only">
          Preencha os dados do centro de custo e salve para continuar.
        </DrawerDescription>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <Label htmlFor="descricao">Nome <RequiredMark /></Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={resource?.getAttribute("description")}
              className={cn(errors.descricao && "border-destructive")}
              aria-required="true"
          />
            {errors.descricao && <span className="text-destructive text-xs">{errors.descricao}</span>}
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="codigo">Código <RequiredMark /></Label>
            <Input
              id="codigo"
              name="codigo"
              defaultValue={resource?.getAttribute("code")}
              className={cn(errors.codigo && "border-destructive")}
              aria-required="true"
            />
            {errors.codigo && (
              <span className="text-destructive text-xs">{errors.codigo}</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="modelo">
              C.C. {resource ? "(opcional)" : <RequiredMark />}
            </Label>
            <Input
              id="modelo"
              name="modelo"
              defaultValue={resource?.getAttribute("model")}
              className={cn(errors.modelo && "border-destructive")}
              aria-required={resource ? undefined : "true"}
            />
            {errors.modelo && (
              <span className="text-destructive text-xs">{errors.modelo}</span>
            )}
            {errors.duplicado && (
              <span className="text-destructive text-xs">{errors.duplicado}</span>
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
