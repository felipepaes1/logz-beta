"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { FornecedorForm } from "@/components/fornecedores/form"
import { RowActions } from "@/components/fornecedores/row-actions"
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

  function extractSavedId(resp: any): number | undefined {
    const candidates = [
      resp?.getApiId?.(),                   
      resp?.data?.data?.id,                  
      resp?.data?.id,                      
      resp?.id,                          
      resp?.data?.data?.attributes?.id,     
    ]
    for (const c of candidates) {
      const n = Number(c)
      if (Number.isFinite(n) && n > 0) return n
    }
    return undefined
  }

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
            isPending: false,
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
    const idNum = Number(current.id)
    const prev = rows
    setRows(p => p.filter(r => Number(r.id) !== idNum))
    try {
      await ProviderResource.destroy(idNum)
      toast.success("Fornecedor excluído.")
      return true
    } catch (err: any) {
      setRows(prev)
      toast.error(err?.message ?? "Não foi possível excluir o fornecedor.")
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
          (() => {
            const r = row.original
            const hasPersistedId = Number.isFinite(Number(r.id)) && Number(r.id) > 0
            if (r.isPending || !hasPersistedId) {
              return (
                <span className="text-muted-foreground text-xs" aria-label="Sincronizando">
                  Sincronizando…
                </span>
              )
            }
            return (
              <RowActions
                row={r}
                onRequestDelete={requestDelete}
                onSave={async (dto: ProviderDto) => {
              const currentRow = row.original
              const prev = rows
              const numericId = Number(currentRow?.id)
              const hasPersistedId = Number.isFinite(numericId) && numericId > 0
              const provisionalId = hasPersistedId
                ? numericId
                : Number.isFinite(numericId) && numericId !== 0
                  ? numericId
                  : -Date.now()

              const draft: Fornecedor = {
                ...currentRow,
                id: provisionalId,
                empresa: dto.company_name ?? "",
                vendedor: dto.seller ?? "",
                email: dto.email ?? "",
                telefone: dto.phone ?? "",
                prazo: Number(dto.delivery_time ?? 0),
                observacoes: dto.observation ?? "",
                resource: (dto.providerResource ?? currentRow?.resource)!,
                dto,
                isPending: true,
              }

              setRows(list =>
                list.map(item => (item === currentRow || Number(item.id) === numericId ? draft : item))
              )

              try {
                const savedResource = await ProviderResource.createOrUpdate(dto.bindToSave())
                let savedId = extractSavedId(savedResource)
                if (!Number.isFinite(Number(savedId)) || Number(savedId) <= 0) {
                  const fallbackFromResource = Number(savedResource?.getApiId?.())
                  if (Number.isFinite(fallbackFromResource) && fallbackFromResource > 0) {
                    savedId = fallbackFromResource
                  } else if (hasPersistedId) {
                    savedId = numericId
                  }
                }
                const resolvedId = Number(savedId)
                dto.id = resolvedId
                dto.providerResource = savedResource
                const updated: Fornecedor = {
                  ...draft,
                  id: resolvedId,
                  resource: savedResource,
                  dto,
                  isPending: false,
                }
                setRows(list =>
                  list.map(item => (item === draft || Number(item.id) === provisionalId ? updated : item))
                )
                toast.success("Fornecedor salvo.")
                // SOLUÇÃO TEMPORÁRIA DE RELOADING DA PÁGINA !!!!!!!!!!!!!!!
                if (typeof window !== "undefined") window.location.reload()
              } catch (err: any) {
                setRows(prev)
                toast.error(err?.message ?? "Não foi possível salvar o fornecedor.")
              }
           }}
            />
          )
        })()
        ),
      },
    ],
    [rows, requestDelete]
  )

  const form = (
    <FornecedorForm
      title="Novo Fornecedor"
      onSubmit={async (dto: ProviderDto) => {
        const optimisticId = -Date.now()
        const draft: Fornecedor = {
          id: optimisticId,
          empresa: dto.company_name ?? "",
          vendedor: dto.seller ?? "",
          email: dto.email ?? "",
          telefone: dto.phone ?? "",
          prazo: Number(dto.delivery_time ?? 0),
          observacoes: dto.observation ?? "",
          resource: (dto.providerResource as any),
          dto,
          isPending: true,
        }
        const prev = rows
        setRows(p => [...p, draft])
        try {
          const savedResource = await ProviderResource.createOrUpdate(dto.bindToSave())
          let savedId = extractSavedId(savedResource)
          if (typeof savedId !== "number" || !Number.isFinite(savedId) || savedId <= 0) {
            const fallbackId = Number(savedResource?.getApiId?.())
            savedId = Number.isFinite(fallbackId) && fallbackId > 0 ? fallbackId : undefined
          }
          const resolvedId = Number(savedId)
          dto.id = resolvedId
          dto.providerResource = savedResource
          const created: Fornecedor = {
            ...draft,
            id: resolvedId,
            resource: savedResource,
            dto,
            isPending: false,
          }
          setRows(p => p.map(r => (Number(r.id) === optimisticId ? created : r)))
          toast.success("Fornecedor cadastrado!")
          // SOLUÇÃO TEMPORÁRIA PARA RELOADING DA PÁGINA PÓS CADASTRO DE FORNECEDORES
          if (typeof window !== "undefined") window.location.reload()
        } catch (err: any) {
          setRows(prev)
          toast.error(err?.message ?? "Erro ao salvar fornecedor.")
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
                  className="dark: text-white"
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
