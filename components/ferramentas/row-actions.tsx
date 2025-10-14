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
import { ItemResource } from "@/resources/Item/item.resource"
import { ItemDto } from "@/resources/Item/item.dto"
import type { ItemDto } from "@/resources/Item/item.dto"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import type { Ferramenta } from "./types"
import { FerramentaForm } from "./form"
import { toast } from "sonner"

interface RowActionsProps {
  row: Ferramenta
  onRequestDelete: (row: Ferramenta) => void
  onSave: (dto: ItemDto) => void
  onSaved?: () => void
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
}

export function RowActions({ row, onRequestDelete, onSave, onSaved, manufacturers, itemGroups }: RowActionsProps) {
  const [open, setOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  
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
              setTimeout(() => onRequestDelete(row), 0)
            }}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open ? (
          <FerramentaForm
            title="Editar Ferramenta"
            resource={row.resource}
            manufacturers={manufacturers}
            itemGroups={itemGroups}
            onRequestClose={() => setOpen(false)}    
            onSubmit={async (dto) => {
              const promise = ItemResource.createOrUpdate(dto.clone().bindToSave())
              await toast.promise(promise, {
                loading: "Salvando ferramenta...",
                success: "Ferramenta atualizada!",
                error: "Erro ao salvar.",
              })

              onSave(dto)

              onSaved?.()
              setOpen(false)
            }}
        />
        ) : null}
      </Drawer>
    </>
  )
}
