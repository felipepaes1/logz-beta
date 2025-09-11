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
import { MachineResource } from "@/resources/Machine/machine.resource"
import { MachineDto } from "@/resources/Machine/machine.dto"
import type { CentroCusto } from "./types"
import { CentroCustoForm } from "./form"

interface RowActionsProps {
  row: CentroCusto
  onDelete: (id: number) => void
  onSave: (dto: MachineDto) => void
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
        <CentroCustoForm
          title="Editar Centro de Custo"
          resource={row.resource}
          onRequestClose={() => setOpen(false)}
          onSubmit={(dto) => {
            MachineResource.inviteOrUpdate(dto.clone().bindToSave())
            onSave(dto)
            setOpen(false)
          }}
        />
      </Drawer>
    </>
  )
}
