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

interface ColaboradorFormProps {
  onSubmit: (c: CollaboratorDto) => void
  resource?: CollaboratorResource
  title: string
}

export function ColaboradorForm({ onSubmit, resource, title }: ColaboradorFormProps) {
  const [active, setActive] = React.useState(
    resource?.getAttribute("active") ?? true
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
            const dto = new CollaboratorDto()
            dto.createFromColoquentResource(resource ?? new CollaboratorResource())
            dto.name = String(data.get("nome") || "")
            dto.code = String(data.get("codigo") || "")
            dto.active = active
            onSubmit(dto)
            form.reset()
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={resource?.getAttribute("name")} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" defaultValue={resource?.getAttribute("code")} />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch id="status" checked={active} onCheckedChange={setActive} />
          </div>
          <DrawerFooter>
            <Button type="submit">Salvar</Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </div>
    </DrawerContent>
  )
}
