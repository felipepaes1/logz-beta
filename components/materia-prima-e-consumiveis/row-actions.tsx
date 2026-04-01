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
import { toast } from "sonner"
import { InventoryItemResource } from "@/resources/InventoryItem/inventory-item.resource"
import type { InventoryItemParsed } from "@/resources/InventoryItem/inventory-item.dto"
import type { MateriaPrimaConsumivel } from "./types"
import { MateriaPrimaConsumivelForm } from "./form"

interface RowActionsProps {
  row: MateriaPrimaConsumivel
  onRequestDelete: (row: MateriaPrimaConsumivel) => void
  onSave: (item: InventoryItemParsed) => void
  onSaved?: () => void
}

export function RowActions({ row, onRequestDelete, onSave, onSaved }: RowActionsProps) {
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
            <span className="sr-only">Abrir menu</span>
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
          <MateriaPrimaConsumivelForm
            title="Editar item"
            resource={row.resource}
            onRequestClose={() => setOpen(false)}
            onSubmit={async (dto) => {
              const request = InventoryItemResource.createOrUpdate(dto)
              toast.promise(request, {
                loading: "Salvando item...",
                success: "Item atualizado!",
                error: "Não foi possível salvar o item.",
              })

              const response = await request
              if (response.data) {
                onSave(response.data)
              }
              onSaved?.()
              setOpen(false)
              return response
            }}
          />
        ) : null}
      </Drawer>
    </>
  )
}
