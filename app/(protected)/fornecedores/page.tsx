"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { FornecedorForm } from "@/components/fornecedores/form"
import { RowActions } from "@/components/fornecedores/row-actions"
import type { Fornecedor } from "@/components/fornecedores/types"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { PluralResponse } from "coloquent"
import { ProviderResource } from "@/resources/Provider/provider.resource"
import { ProviderDto } from "@/resources/Provider/provider.dto"
import type { Fornecedor } from "@/components/fornecedores/types"
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


export default function Page() {
  const [rows, setRows] = React.useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [ready, setReady] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteRow, setDeleteRow] = React.useState<Fornecedor | null>(null)
  const focusRestoreRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const tid = localStorage.getItem("@tenancy_id")
    const hasToken = !!(localStorage.getItem("@token") || document.cookie.includes("token="))
    setReady(!!tid && hasToken)
  }, [])

  React.useEffect(() => {
    let mounted = true
    if (!ready) return
    setIsLoading(true)
    ProviderResource
      .with(["item"])
      .get()
      .then((resp: PluralResponse<ProviderResource>) => {
        const data = resp.getData()
        const mapped: Fornecedor[] = data.map((r) => {
          const dto = new ProviderDto().createFromColoquentResource(r)
          return {
            id: Number(r.getApiId()),
            empresa: dto.company_name ?? "",
            vendedor: dto.seller ?? "",
            email: dto.email ?? "",
            telefone: dto.phone ?? "",
            prazo: Number(dto.delivery_time ?? 0),
            observacoes: dto.observation ?? "",
            resource: r,
            dto,
          }
        })
        if (mounted) setRows(mapped)
      })
      .catch(() => toast.error("Não foi possível carregar os fornecedores."))
      .finally(() => mounted && setIsLoading(false))
    return () => { mounted = false }
  }, [ready])

  const requestDelete = React.useCallback((row: Fornecedor) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])

  const handleDelete = React.useCallback(async (row: Fornecedor) => {
    const current = row
    if (!current) return false
    const prev = rows
    setRows(p => p.filter(r => r.id !== current.id))
    try {
      await ProviderResource.deleteMany([current.id])
      toast.success("Fornecedor excluído.")
      return true
    } catch (e: any) {
      setRows(prev)
      toast.error(e?.message ?? "Não foi possível excluir o fornecedor.")
      return false
    }
  }, [rows])

  const columns = React.useMemo<ColumnDef<Fornecedor>[]>(
    () => [
      { accessorKey: "empresa", header: "Empresa" },
      { accessorKey: "vendedor", header: "Vendedor" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "telefone", header: "Telefone" },
      { accessorKey: "prazo", header: "Prazo em dias (Lead Time)" },
      { accessorKey: "observacoes", header: "Observações" },
      {
        id: "actions",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onRequestDelete={requestDelete}
            onSave={async (dto: ProviderDto) => {
              const isNew = !dto.id
              const optimisticId = isNew
                ? Math.max(0, ...rows.map(r => r.id)) + 1
                : Number(dto.id)

              // Monta linha otimista
              const draft: Fornecedor = {
                id: optimisticId,
                empresa: dto.company_name ?? "",
                vendedor: dto.seller ?? "",
                email: dto.email ?? "",
                telefone: dto.phone ?? "",
                prazo: Number(dto.delivery_time ?? 0),
                observacoes: dto.observation ?? "",
                resource: dto.providerResource,
                dto,
              }

              const prev = rows
              if (isNew) {
                setRows(p => [...p, draft])
              } else {
                setRows(p => p.map(r => (r.id === optimisticId ? draft : r)))
              }

              try {
                await ProviderResource.createOrUpdate(dto.bindToSave())
                // Atualiza id real se veio do backend
                const savedId = Number(dto.providerResource?.getApiId?.() ?? optimisticId)
                setRows(p => p.map(r => (r.id === optimisticId ? { ...r, id: savedId } : r)))
                toast.success("Fornecedor salvo.")
              } catch {
                setRows(prev)
                toast.error("Não foi possível salvar o fornecedor.")
              }
            }}
          />
        ),
      },
    ],
    [rows, requestDelete]
  )

  const form = (
    <FornecedorForm
      title="Novo Fornecedor"
     onSubmit={async (dto: ProviderDto) => {
        const optimisticId = Math.max(0, ...rows.map(r => r.id)) + 1
        const draft: Fornecedor = {
          id: optimisticId,
          empresa: dto.company_name ?? "",
          vendedor: dto.seller ?? "",
          email: dto.email ?? "",
          telefone: dto.phone ?? "",
          prazo: Number(dto.delivery_time ?? 0),
          observacoes: dto.observation ?? "",
          resource: dto.providerResource,
          dto,
        }
        const prev = rows
        setRows(p => [...p, draft])
        try {
          await ProviderResource.createOrUpdate(dto.bindToSave())
          const savedId = Number(dto.providerResource?.getApiId?.() ?? optimisticId)
          setRows(p => p.map(r => (r.id === optimisticId ? { ...r, id: savedId } : r)))
          toast.success("Fornecedor cadastrado!")
        } catch {
          setRows(prev.filter(r => r.id !== optimisticId))
          toast.error("Erro ao salvar fornecedor.")
        }
      }} 
    />
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <button
            ref={focusRestoreRef}
            tabIndex={-1}
            aria-hidden
            className="sr-only"
          />
          <DataTable
            data={rows}
            onDataChange={setRows}
            columns={columns}
            addButtonLabel="Novo Fornecedor"
            renderAddForm={form}
            isLoading={isLoading}
            emptyMessage="Nenhum fornecedor encontrado"
          />
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open)
              if (!open) setDeleteRow(null)
            }}
          >
            <AlertDialogContent
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso fará uma <strong>exclusão lógica</strong>, se configurado no backend. Confirma a remoção de <strong>{deleteRow?.empresa}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deleting}
                  onClick={() => {
                    setDeleteOpen(false)
                    setDeleteRow(null)
                    requestAnimationFrame(() => focusRestoreRef.current?.focus())
                  }}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteRow) return
                    setDeleting(true)
                    const ok = await handleDelete(deleteRow)
                    setDeleting(false)
                    if (ok !== false) {
                      setDeleteOpen(false)
                      setDeleteRow(null)
                      requestAnimationFrame(() => focusRestoreRef.current?.focus())
                    }
                  }}
                >
                  {deleting ? "Excluindo..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
