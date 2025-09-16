"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { IconDotsVertical } from "@tabler/icons-react"
import { ComponentResource } from "@/resources/Component/component.resource"
import { ComponentDto } from "@/resources/Component/component.dto"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { ItemResource } from "@/resources/Item/item.resource"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { PcpResource } from "@/resources/Pcp/pcp.resource"
import type { Movimento } from "./types"
import { EntradaForm } from "./form-entrada"
import { SaidaForm } from "./form-saida"
import { toast } from "sonner"

export function RowActions({
  row,
  onRequestDelete,
  onSave,
  itemGroups,
  items,
  collaborators,
  machines,
  pcps,
}: {
  row: Movimento
  onRequestDelete?: (row: Movimento) => void
  onSave: (dto: ComponentDto) => void
  itemGroups: ItemGroupResource[]
  items: ItemResource[]
  collaborators: CollaboratorResource[]
  machines: MachineResource[]
  pcps: PcpResource[]
}) {
  const [open, setOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const Form = row.operacao === "Entrada" ? EntradaForm : SaidaForm
  const handleDeleteClick = React.useCallback(() => {
    if (typeof onRequestDelete === "function") return onRequestDelete(row)
    toast.error("Ação de exclusão indisponível nesta linha.")
  }, [onRequestDelete, row])

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => {
              setTimeout(() => setOpen(true), 0)
            }}
          >
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => {
              setMenuOpen(false)
              setTimeout(() => handleDeleteClick(), 0)
            }}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <Form
          title={`Editar ${row.operacao}`}
          resource={row.resource}
          itemGroups={itemGroups}
          items={items}
          collaborators={collaborators}
          machines={machines}
          pcps={pcps}
          disableEdition
          onRequestClose={() => setOpen(false)}
          onSubmit={(dto) => {
            const p = ComponentResource.createOrUpdate(dto.clone().bindToSave())
            toast.promise(p, {
              loading: "Salvando registro...",
              success: "Registro atualizado!",
              error: "Erro ao salvar registro.",
            })
            return p.then(() => {
              onSave(dto)
              setOpen(false)
            })
          }}
        />
      </Drawer>
    </>
  )
}
