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
import type { Fornecedor } from "./types"
import { FornecedorForm } from "./form"
import { ProviderDto } from "@/resources/Provider/provider.dto"
import { ProviderResource } from "@/resources/Provider/provider.resource"

interface RowActionsProps {
  row: Fornecedor
    onDelete: (id: number) => void
    onSave: (dto: ProviderDto) => void
}

export function RowActions({ row, onDelete, onSave }: RowActionsProps) {
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
        <FornecedorForm
          title="Editar Fornecedor"
          initialValues={row}
          resource={row.resource}
          onRequestClose={() => setOpen(false)}
          onSubmit={(dto) => {
            ProviderResource.createOrUpdate(dto.clone().bindToSave())
            onSave(dto)
            setOpen(false)
          }}
        />
      </Drawer>
    </>
  )
}
