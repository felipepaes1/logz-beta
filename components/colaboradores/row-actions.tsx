"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { IconDotsVertical } from "@tabler/icons-react"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { CollaboratorDto } from "@/resources/Collaborator/collaborator.dto"
import type { Colaborador } from "./types"
import { ColaboradorForm } from "./form"

interface RowActionsProps {
  row: Colaborador
  onSave: (dto: CollaboratorDto) => void
}

export function RowActions({ row, onSave }: RowActionsProps) {
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
        </DropdownMenuContent>
      </DropdownMenu>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <ColaboradorForm
          title="Editar Colaborador"
          resource={row.resource}
          onRequestClose={() => setOpen(false)}
          onSubmit={(dto) => {
            const p = CollaboratorResource.inviteOrUpdate(dto.clone().bindToSave())
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
