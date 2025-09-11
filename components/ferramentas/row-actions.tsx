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
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import type { Ferramenta } from "./types"
import { FerramentaForm } from "./form"

interface RowActionsProps {
  row: Ferramenta
  onDelete: (id: number) => void
  onSave: (dto: ItemDto) => void
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
}

export function RowActions({ row, onDelete, onSave, manufacturers, itemGroups }: RowActionsProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
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
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.id)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <FerramentaForm
          title="Editar Ferramenta"
          resource={row.resource}
          manufacturers={manufacturers}
          itemGroups={itemGroups}
          onRequestClose={() => setOpen(false)}
          onSubmit={(dto) => {
            ItemResource.createOrUpdate(dto.clone().bindToSave())
            onSave(dto)
            setOpen(false)
          }}
        />
      </Drawer>
    </>
  )
}
