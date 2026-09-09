"use client"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import * as React from "react"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { PluralResponse } from "coloquent"
import { ColaboradorForm } from "@/components/colaboradores/form"
import { RowActions } from "@/components/colaboradores/row-actions"
import { toast } from "sonner"
import type { Colaborador } from "@/components/colaboradores/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const COLABORADOR_NOME_PREVIEW_LENGTH = 36
const COLABORADOR_CODIGO_PREVIEW_LENGTH = 20

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<Colaborador[]>([])
  const [collaborators, setCollaborators] = React.useState<CollaboratorResource[]>([])

  function reload() {
    CollaboratorResource.get().then((response: PluralResponse<CollaboratorResource>) => {
      setIsLoading(false)
      setCollaborators(response.getData())
    })
  }

  React.useEffect(() => {
    reload()
  }, [])

  React.useEffect(() => {
    const formatted = collaborators.map((c) => ({
      id: Number(c.getApiId()),
      nome: c.getAttribute("name"),
      codigo: c.getAttribute("code"),
      status: c.getAttribute("active") ? "Ativo" : "Inativo",
      resource: c,
    }))
    // Ativos primeiro; manter ordem alfabética por nome dentro dos grupos
    const sorted = [...formatted].sort((a, b) => {
      const aActive = a.status === "Ativo" ? 1 : 0
      const bActive = b.status === "Ativo" ? 1 : 0
      if (aActive !== bActive) return bActive - aActive
      return String(a.nome).localeCompare(String(b.nome))
    })
    setRows(sorted)
  }, [collaborators])

  const columns = React.useMemo<ColumnDef<Colaborador>[]>(
    () => [
      {
        accessorKey: "nome",
        header: "Nome",
        meta: {
          className: "min-w-0",
        },
        cell: ({ row }) => {
          const nome = String(row.original.nome ?? "")
          const nomePreview = (
            <span
              className="block min-w-0 max-w-full truncate"
              tabIndex={nome.length > COLABORADOR_NOME_PREVIEW_LENGTH ? 0 : undefined}
            >
              {nome}
            </span>
          )

          if (nome.length <= COLABORADOR_NOME_PREVIEW_LENGTH) return nomePreview

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                {nomePreview}
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-[min(90vw,420px)]">
                {nome}
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: "codigo",
        header: "Código",
        meta: { className: "w-[160px]" },
        cell: ({ row }) => {
          const codigo = String(row.original.codigo ?? "")
          const codigoPreview = (
            <span
              className="block min-w-0 max-w-full truncate"
              tabIndex={codigo.length > COLABORADOR_CODIGO_PREVIEW_LENGTH ? 0 : undefined}
            >
              {codigo}
            </span>
          )

          if (codigo.length <= COLABORADOR_CODIGO_PREVIEW_LENGTH) return codigoPreview

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                {codigoPreview}
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-[min(90vw,420px)]">
                {codigo}
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: { className: "w-[120px]" },
        cell: ({ row }) => (
          <Badge
            className={cn(
              "px-2",
              row.original.status === "Ativo"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        meta: { className: "w-12 p-0" },
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onDelete={reload}
            onSave={reload}
          />
        ),
      },
    ],
    []
  )

  const searchableColumns = React.useMemo(
    () => [
      { id: "nome", label: "Nome" },
      { id: "codigo", label: "Código" },
      { id: "status", label: "Status" },
    ],
    []
  )

  const form = (
    <ColaboradorForm
      title="Novo Colaborador"
      onSubmit={(dto) =>
        toast.promise(
          CollaboratorResource
            .inviteOrUpdate(dto.clone().bindToSave()).then(
            reload
          ),
          {
            loading: "Salvando colaborador...",
            success: "Colaborador cadastrado!",
            error: "Erro ao salvar colaborador.",
          }
        )
      }
    />
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DataTable
            data={rows}
            onDataChange={setRows}
            columns={columns}
            addButtonLabel="Novo Colaborador"
            renderAddForm={form}
            isLoading={isLoading}
            tableClassName="table-fixed"
            searchableColumns={searchableColumns}
            searchPlaceholder="Buscar colaborador por nome, código ou status"
          />
        </div>
      </div>
    </div>
  )
}
