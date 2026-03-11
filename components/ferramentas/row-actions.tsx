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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconCheck, IconDotsVertical, IconInfoCircle } from "@tabler/icons-react"
import { ItemResource } from "@/resources/Item/item.resource"
import type { ItemDto } from "@/resources/Item/item.dto"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { PurchaseRequestResource } from "@/resources/PurchaseRequest/purchase-request.resource"
import type { Ferramenta } from "./types"
import { FerramentaForm } from "./form"
import { toast } from "sonner"

interface RowActionsProps {
  row: Ferramenta
  onRequestDelete: (row: Ferramenta) => void
  onSave: (dto: ItemDto) => void
  onSaved?: () => void | Promise<void>
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
  onGroupsUpdated?: (groups: ItemGroupResource[]) => void
}

export function RowActions({ row, onRequestDelete, onSave, onSaved, manufacturers, itemGroups, onGroupsUpdated }: RowActionsProps) {
  const [open, setOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [orderInfoOpen, setOrderInfoOpen] = React.useState(false)
  const [generateEntryOpen, setGenerateEntryOpen] = React.useState(false)
  const [unitPrice, setUnitPrice] = React.useState("")
  const [quantity, setQuantity] = React.useState("")
  const [generatingEntry, setGeneratingEntry] = React.useState(false)
  const purchaseRequest = row.purchaseRequest ?? null
  const purchaseRequestIdRaw = Number(purchaseRequest?.id)
  const purchaseRequestId = Number.isFinite(purchaseRequestIdRaw)
    ? purchaseRequestIdRaw
    : null
  const hasOpenPurchaseRequest = !!row.preOrdered && !purchaseRequest?.closedAt

  const statusLabel = (() => {
    if (row.preOrdered) return "Aberta"
    if (purchaseRequest) return "Fechada"
    return "Sem registro"
  })()
  const providerLabel =
    purchaseRequest?.providerName ||
    row.fornecedor ||
    "Não informado"
  const requestedQtyValue = Number(purchaseRequest?.requestedQty)
  const requestedQtyLabel = Number.isFinite(requestedQtyValue)
    ? String(requestedQtyValue)
    : "Não informado"
  const openedAtLabel = purchaseRequest?.openedAt ?? "Não informado"
  const closedAtLabel = purchaseRequest?.closedAt ?? "Não informado"
  const openedByLabel = purchaseRequest?.openedBy ?? "Não informado"
  const openGenerateEntryDialog = React.useCallback(() => {
    const defaultQuantity =
      Number.isFinite(requestedQtyValue) && requestedQtyValue > 0
        ? String(Math.trunc(requestedQtyValue))
        : ""
    setQuantity(defaultQuantity)
    setGenerateEntryOpen(true)
  }, [requestedQtyValue])

  const handleConfirmGenerateEntry = React.useCallback(async () => {
    if (generatingEntry) return
    if (!purchaseRequestId) {
      toast.error("Não foi possível identificar o pedido de compra.")
      return
    }

    const parsedUnitPrice = Number(unitPrice.replace(",", "."))
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
      toast.error("Informe um preço unitário válido.")
      return
    }

    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Informe uma quantidade inteira válida.")
      return
    }

    try {
      setGeneratingEntry(true)
      const request = PurchaseRequestResource.generateEntry(purchaseRequestId, {
        unit_price: parsedUnitPrice,
        quantity: parsedQuantity,
        requested_qty: parsedQuantity,
      })
      await toast.promise(request, {
        loading: "Gerando entrada...",
        success: "Entrada gerada com sucesso!",
        error: "Não foi possível gerar a entrada.",
      })
      setGenerateEntryOpen(false)
      setUnitPrice("")
      setQuantity("")
      await onSaved?.()
    } finally {
      setGeneratingEntry(false)
    }
  }, [generatingEntry, onSaved, purchaseRequestId, quantity, unitPrice])
  
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
        <Button
          variant="ghost"
          className="text-muted-foreground flex size-8"
          size="icon"
          onClick={openGenerateEntryDialog}
          disabled={!hasOpenPurchaseRequest || !purchaseRequestId}
        >
          <IconCheck />
          <span className="sr-only">Gerar Entrada</span>
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
      <AlertDialog
        open={generateEntryOpen}
        onOpenChange={(open) => {
          setGenerateEntryOpen(open)
          if (!open) {
            setUnitPrice("")
            setQuantity("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar entrada</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o preço unitário e a quantidade recebida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-2 text-sm">
              <Label>Item</Label>
              <div className="rounded-md border px-3 py-2">{row.nome}</div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`unit-price-${row.id}`}>Preço unitário</Label>
              <Input
                id={`unit-price-${row.id}`}
                type="number"
                min={0}
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                disabled={generatingEntry}
                placeholder="Ex.: 123.45"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`quantity-${row.id}`}>Quantidade recebida</Label>
              <Input
                id={`quantity-${row.id}`}
                type="number"
                min={1}
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={generatingEntry}
                placeholder="Ex.: 10"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generatingEntry}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="dark:text-white"
              onClick={(event) => {
                event.preventDefault()
                handleConfirmGenerateEntry()
              }}
              disabled={generatingEntry}
            >
              {generatingEntry ? "Gerando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
