"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { IconDotsVertical, IconInfoCircle } from "@tabler/icons-react"
import { ItemResource } from "@/resources/Item/item.resource"
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
  onGroupsUpdated?: (groups: ItemGroupResource[]) => void
}

export function RowActions({ row, onRequestDelete, onSave, onSaved, manufacturers, itemGroups, onGroupsUpdated }: RowActionsProps) {
  const [open, setOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [orderInfoOpen, setOrderInfoOpen] = React.useState(false)
  const purchaseRequest = row.purchaseRequest ?? null

  const statusLabel = (() => {
    if (row.preOrdered) return "Aberta"
    if (purchaseRequest) return "Fechada"
    return "Sem registro"
  })()
  const providerLabel =
    purchaseRequest?.providerName ||
    row.fornecedor ||
    "Nao informado"
  const requestedQtyValue = Number(purchaseRequest?.requestedQty)
  const requestedQtyLabel = Number.isFinite(requestedQtyValue)
    ? String(requestedQtyValue)
    : "Nao informado"
  const openedAtLabel = purchaseRequest?.openedAt ?? "Nao informado"
  const closedAtLabel = purchaseRequest?.closedAt ?? "Nao informado"
  const openedByLabel = purchaseRequest?.openedBy ?? "Nao informado"
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="text-muted-foreground flex size-8"
          size="icon"
          onClick={() => setOrderInfoOpen(true)}
        >
          <IconInfoCircle />
          <span className="sr-only">Ver pedido de compra</span>
        </Button>
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
      </div>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open ? (
          <FerramentaForm
            title="Editar Ferramenta"
            resource={row.resource}
            provider={row.provider}
            manufacturers={manufacturers}
            itemGroups={itemGroups}
            onGroupsUpdated={onGroupsUpdated}
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
      <AlertDialog open={orderInfoOpen} onOpenChange={setOrderInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pedido de compra</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Item</span>
              <span className="font-medium">{row.nome}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{statusLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Fornecedor</span>
              <span className="font-medium">{providerLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Qtd solicitada</span>
              <span className="font-medium">{requestedQtyLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Aberta em</span>
              <span className="font-medium">{openedAtLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Fechada em</span>
              <span className="font-medium">{closedAtLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Aberta por</span>
              <span className="font-medium">{openedByLabel}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setOrderInfoOpen(false)}>
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
