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
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { CollaboratorDto } from "@/resources/Collaborator/collaborator.dto"
import { cn } from "@/lib/utils"

interface Props {
  onSubmit: (dto: CollaboratorDto) => Promise<unknown>
  resource?: CollaboratorResource
  title: string
  onRequestClose?: () => void
}

export function ColaboradorForm({ onSubmit, resource, title, onRequestClose }: Props) {
  const [active, setActive] = React.useState(
    resource?.getAttribute("active") ?? true
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ nome?: string; codigo?: string; senha?: string }>(
    {}
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const nome = String(data.get("nome") || "")
    const codigo = String(data.get("codigo") || "")
    const senha = String(data.get("senha") || "")

    const newErrors: { nome?: string; codigo?: string; senha?: string} = {}
    if (!nome.trim()) newErrors.nome = "Campo obrigatório"
    if (!codigo.trim()) newErrors.codigo = "Campo obrigatório"
    if (!senha.trim()) newErrors.senha = "Campo obrigatório"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new CollaboratorDto()
    if (resource) dto.createFromColoquentResource(resource)
    dto.name = nome
    dto.code = codigo
    dto.active = active

    try {
      setSubmitting(true)
      await onSubmit(dto)
      form.reset()
      setActive(true)
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

          <Label htmlFor="nome">Configurações do Aplicativo</Label>

          <div className="flex flex-col gap-1">
            <Label htmlFor="codigo">Código / Login</Label>
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


          <div className="flex flex-col gap-1">
            <Label htmlFor="login">Senha</Label>
            <Input
              id="senha"
              name="senha"
              defaultValue={resource?.getAttribute("password-app")}
              className={cn(errors.senha && "border-destructive")}
            />
            {errors.senha && (
              <span className="text-destructive text-xs">{errors.senha}</span>
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
