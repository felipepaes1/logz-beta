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

interface CentroCustoFormProps {
  onSubmit: (c: MachineDto) => void
  resource?: MachineResource
  title: string
}

export function CentroCustoForm({ onSubmit, resource, title }: CentroCustoFormProps) {
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
            const dto = new MachineDto()
            dto.createFromColoquentResource(resource ?? new MachineResource())
            dto.description = String(data.get("descricao") || "")
            dto.code = String(data.get("codigo") || "")
            dto.active = active
            onSubmit(dto)
            form.reset()
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="descricao">Nome</Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={resource?.getAttribute("description")}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch id="status" checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              name="codigo"
              defaultValue={resource?.getAttribute("code")}
            />
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
