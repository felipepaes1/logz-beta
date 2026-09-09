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
import { RequiredMark } from "@/components/ui/required-mark"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { CollaboratorDto } from "@/resources/Collaborator/collaborator.dto"
import { cn } from "@/lib/utils"
import {
  MAX_COLABORADOR_CODIGO_LENGTH,
  MAX_COLABORADOR_NOME_LENGTH,
} from "./types"

interface Props {
  onSubmit: (dto: CollaboratorDto) => Promise<unknown>
  resource?: CollaboratorResource
  title: string
  onRequestClose?: () => void
}

export function ColaboradorForm({ onSubmit, resource, title, onRequestClose }: Props) {
  const isEditing = !!resource
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
    else if (nome.length > MAX_COLABORADOR_NOME_LENGTH) {
      newErrors.nome = `O nome deve ter no máximo ${MAX_COLABORADOR_NOME_LENGTH} caracteres`
    }
    if (!codigo.trim()) newErrors.codigo = "Campo obrigatório"
    else if (codigo.length > MAX_COLABORADOR_CODIGO_LENGTH) {
      newErrors.codigo = `O código deve ter no máximo ${MAX_COLABORADOR_CODIGO_LENGTH} caracteres`
    }
    if (!senha.trim()) newErrors.senha = "Campo obrigatório"

    // On edit, password is optional; if left blank, ignore its error
    if (isEditing && !senha.trim()) {
      delete newErrors.senha
    }

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
    if (senha.trim()) {
      dto.password = senha
    }

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
            <Label htmlFor="nome">Nome <RequiredMark /></Label>
            <Input
              id="nome"
              name="nome"
              maxLength={MAX_COLABORADOR_NOME_LENGTH}
              defaultValue={resource?.getAttribute("name")}
              className={cn(errors.nome && "border-destructive")}
              aria-required="true"
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? "nome-erro" : undefined}
            />
            {errors.nome && (
              <span id="nome-erro" className="text-destructive text-xs">{errors.nome}</span>
            )}
          </div>

          <Label htmlFor="nome">Configurações do Aplicativo</Label>

          <div className="flex flex-col gap-1">
            <Label htmlFor="codigo">Código / Login <RequiredMark /></Label>
            <Input
              id="codigo"
              name="codigo"
              maxLength={MAX_COLABORADOR_CODIGO_LENGTH}
              defaultValue={resource?.getAttribute("code")}
              className={cn(errors.codigo && "border-destructive")}
              aria-required="true"
              aria-invalid={!!errors.codigo}
              aria-describedby={errors.codigo ? "codigo-erro" : undefined}
            />
            {errors.codigo && (
              <span id="codigo-erro" className="text-destructive text-xs">{errors.codigo}</span>
            )}
          </div>


          <div className="flex flex-col gap-1">
            <Label htmlFor="senha">
              Senha {isEditing ? "(opcional)" : <RequiredMark />}
            </Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="new-password"
              placeholder={isEditing ? "Deixe em branco para manter" : "Senha do colaborador no aplicativo"}
              className={cn(errors.senha && "border-destructive")}
              aria-required={isEditing ? undefined : "true"}
              aria-invalid={!!errors.senha}
              aria-describedby={errors.senha ? "senha-erro" : undefined}
            />
            {errors.senha && (
              <span id="senha-erro" className="text-destructive text-xs">{errors.senha}</span>
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
