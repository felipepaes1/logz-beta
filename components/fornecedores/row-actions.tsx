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

interface RowActionsProps {
  row: Fornecedor
  onRequestDelete: (row: Fornecedor) => void
  onSave: (dto: ProviderDto) => Promise<void> | void
}

export function RowActions({ row, onRequestDelete, onSave }: RowActionsProps) {
  const [open, setOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const hasPersistedId = Number.isFinite(Number(row?.id)) && Number(row?.id) > 0
  const disabled = !!row?.isPending || !hasPersistedId
  const formKey = String(hasPersistedId ? row.id : `new-${row?.id}`)

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
            disabled={disabled}
            title={disabled ? "Ação indisponível enquanto o registro estiver sincronizando. Aguarde" : "Ações"}
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              setTimeout(() => setOpen(true), 0)
            }}
          >
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={disabled}
            onSelect={() => {
              if (disabled) return
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
          <FornecedorForm
            key={formKey}
            title="Editar Fornecedor"
            initialValues={row}
            resource={row.resource}
            onRequestClose={() => setOpen(false)}
            onSubmit={async (dto: ProviderDto) => {
              await onSave(dto)
              setOpen(false)
            }}
          />
        ) : null}
      </Drawer>
    </>
  )
}
