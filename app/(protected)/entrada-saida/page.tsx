"use client"

import { DataTable } from "@/components/data-table"
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerTrigger } from "@/components/ui/drawer"
import * as React from "react"
import { ComponentResource } from "@/resources/Component/component.resource"
import { ComponentDto } from "@/resources/Component/component.dto"
import { ComponentTypeEnum } from "@/resources/Component/component.enum"
import { ItemResource } from "@/resources/Item/item.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { PcpResource } from "@/resources/Pcp/pcp.resource"
import { PluralResponse } from "coloquent"
import { EntradaForm } from "@/components/entrada-saida/form-entrada"
import { SaidaForm } from "@/components/entrada-saida/form-saida"
import { RowActions } from "@/components/entrada-saida/row-actions"
import type { Movimento } from "@/components/entrada-saida/types"
import { toast } from "sonner"
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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const allColumns: Record<string, ColumnDef<Movimento>> = {
  data: {
    accessorKey: "data",
    header: "Data",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(row.original.data)),
  },
  codigo: { accessorKey: "codigo", header: "Código" },
  ferramenta: { accessorKey: "ferramenta", header: "Ferramenta" },
  maquina: { accessorKey: "maquina", header: "Máquina" },
  responsavel: { accessorKey: "responsavel", header: "Responsável" },
  operacao: { accessorKey: "operacao", header: "Operação" },
  precoUnitario: {
    accessorKey: "precoUnitario",
    header: "Preço unitário",
    cell: ({ row }) =>
      row.original.precoUnitario
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
            .format(row.original.precoUnitario)
        : "",
  },
  precoTotal: {
    accessorKey: "precoTotal",
    header: "Preço Total",
    cell: ({ row }) =>
      row.original.precoTotal
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
            .format(row.original.precoTotal)
        : "",
  },
  ordem: { accessorKey: "ordem", header: "Ordem" }, // em ENTRADAS mudamos o header dinamicamente
  quantidade: { accessorKey: "quantidade", header: "Quantidade" },
}

function dtoToRow(dto: ComponentDto): Movimento {
  return {
    id: Number(dto?.id),
    data: dto.created_at ?? new Date().toISOString(),
    grupo: dto.itemGroupResource?.getAttribute("description") || "",
    codigo: dto.itemResource?.getAttribute("code") || "",
    ferramenta: dto.itemResource?.getAttribute("name") || "",
    maquina: dto.machineResource?.getAttribute("description") || "",
    responsavel: dto.collaboratorResource?.getAttribute("name") || "",
    operacao: dto.type === ComponentTypeEnum.IN ? "Entrada" : "Saída",
    precoUnitario: dto.unitPrice,
    precoTotal: dto.unitPrice * dto.quantity,
    ordem: dto.orderNumber || "",
    quantidade: dto.quantity,
    resource: dto.componentResource,
    item: dto.itemResource,
    itemGroup: dto.itemGroupResource,
    machine: dto.machineResource,
    collaborator: dto.collaboratorResource,
    pcp: dto.pcpResource,
  }
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<Movimento[]>([])
  const [tab, setTab] = React.useState<"todos" | "entradas" | "saidas">("todos")
  const [components, setComponents] = React.useState<ComponentResource[]>([])
  const [itemGroups, setItemGroups] = React.useState<ItemGroupResource[]>([])
  const [items, setItems] = React.useState<ItemResource[]>([])
  const [collaborators, setCollaborators] = React.useState<CollaboratorResource[]>([])
  const [machines, setMachines] = React.useState<MachineResource[]>([])
  const [pcps, setPcps] = React.useState<PcpResource[]>([])
  const [isEntradaOpen, setIsEntradaOpen] = React.useState(false)
  const [isSaidaOpen, setIsSaidaOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteRow, setDeleteRow] = React.useState<Movimento | null>(null)
  const [justification, setJustification] = React.useState("")
  const focusRestoreRef = React.useRef<HTMLButtonElement>(null)
  const JUST_MIN = 12

  const reload = React.useCallback(() => {
    setIsLoading(true)
    return ComponentResource
      .orderBy("created_at", "desc")
      .with([
        "item.itemGroup",
        "item.manufacturer",
        "collaborator",
        "machine",
        "pcp",
      ])
      .get()
      .then((response: PluralResponse<ComponentResource>) => {
        setComponents(response.getData())
        setIsLoading(false)
      })
  }, [])

  const reloadItems = React.useCallback(() => {
    return ItemResource
      .with(["manufacturer", "itemGroup"])
      .get()
      .then((r: PluralResponse<ItemResource>) => setItems(r.getData()))
  }, [])

  React.useEffect(() => {
    reload() 
    reloadItems()
    ItemGroupResource.get().then((r: PluralResponse<ItemGroupResource>) => {
      setItemGroups(r.getData())
    })

    CollaboratorResource.get().then((r: PluralResponse<CollaboratorResource>) => {
      setCollaborators(r.getData())
    })
    MachineResource.get().then((r: PluralResponse<MachineResource>) => {
      setMachines(r.getData())
    })
    PcpResource.get().then((r: PluralResponse<PcpResource>) => {
      setPcps(r.getData())
    })
    
  }, [reload, reloadItems])

  React.useEffect(() => {
    const formatted = components.map((c) => {
      const dto = new ComponentDto()
      dto.createFromColoquentResource(c)
      return dtoToRow(dto)
    })
    setRows(formatted)
  }, [components])

  const todosRows = rows
  const entradasRows = React.useMemo(
    () => rows.filter(r => r.operacao === "Entrada"),
    [rows]
  )
  const saidasRows = React.useMemo(
    () => rows.filter(r => r.operacao === "Saída"),
    [rows]
  )

  const columns = React.useMemo<ColumnDef<Movimento>[]>(() => {
    const withActions = (cols: ColumnDef<Movimento>[]) => [
      ...cols,
      {
        id: "actions",
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            itemGroups={itemGroups}
            items={items}
            collaborators={collaborators}
            machines={machines}
            pcps={pcps}
            onRequestDelete={(r) => {
              setDeleteRow(r)
              setJustification("")
              setDeleteOpen(true)
            }}
            onSave={() => reload()}
          />
        ),
      } as ColumnDef<Movimento>,
    ]

    if (tab === "entradas") {
      const cols: ColumnDef<Movimento>[] = [
        allColumns.data,
        allColumns.codigo,
        allColumns.ferramenta,
        allColumns.responsavel,
        allColumns.precoUnitario,
        allColumns.precoTotal,
        { ...allColumns.ordem, header: "Ordem de Compra" },
        allColumns.quantidade,
      ]
      return withActions(cols)
    }

    if (tab === "saidas") {
      const cols: ColumnDef<Movimento>[] = [
        allColumns.data,
        allColumns.codigo,
        allColumns.ferramenta,
        allColumns.responsavel,
        allColumns.maquina,
        allColumns.quantidade,
      ]
      return withActions(cols)
    }

    const todosCols: ColumnDef<Movimento>[] = [
      allColumns.data,
      allColumns.codigo,
      allColumns.ferramenta,
      allColumns.maquina,
      allColumns.responsavel,
      allColumns.operacao,
      allColumns.precoUnitario,
      allColumns.precoTotal,
      allColumns.quantidade,
    ]
    return withActions(todosCols)
  }, [tab, itemGroups, items, collaborators, machines, pcps, reload])

  function saveWithToast(dto: ComponentDto) {
    return toast.promise(
      ComponentResource.createOrUpdate(dto.clone().bindToSave()).then(async () => {
        await Promise.all([reload(), reloadItems()])
        setIsEntradaOpen(false)
        setIsSaidaOpen(false)
      }),
      {
        loading: "Salvando registro...",
        success: "Requisição registrada!",
        error: "Erro ao salvar requisição.",
      }
    )
  }

  const headerActions = (
    <>
      <Drawer direction="right" open={isEntradaOpen} onOpenChange={setIsEntradaOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">Cadastrar entrada</Button>
        </DrawerTrigger>
        <EntradaForm
          itemGroups={itemGroups}
          items={items}
          collaborators={collaborators}
          onSubmit={saveWithToast}
          onRequestClose={() => setIsEntradaOpen(false)}
        />
      </Drawer>
      <Drawer direction="right" open={isSaidaOpen} onOpenChange={setIsSaidaOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">Cadastrar Saída</Button>
        </DrawerTrigger>
        <SaidaForm
          itemGroups={itemGroups}
          items={items}
          collaborators={collaborators}
          machines={machines}
          pcps={pcps}
          onSubmit={saveWithToast}
          onRequestClose={() => setIsSaidaOpen(false)}
        />
      </Drawer>
    </>
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <button ref={focusRestoreRef} tabIndex={-1} aria-hidden className="sr-only" />
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList
              className="
                mx-auto w-full max-w-5xl
                grid grid-cols-1 gap-3 sm:grid-cols-3
                bg-transparent p-0
              "
            >
              <TabsTrigger
                value="todos"
                className="
                  group
                  rounded-2xl border shadow-sm
                  h-16 px-6
                  text-base font-semibold
                  justify-between
                  bg-muted hover:bg-muted/80
                  data-[state=active]:bg-primary/10
                  data-[state=active]:border-primary/50
                  data-[state=active]:shadow
                  transition-colors
                "
              >
                <span className="truncate">TODOS</span>
              </TabsTrigger>
              <TabsTrigger
                value="entradas"
                className="group rounded-2xl border shadow-sm h-16 px-6 text-base font-semibold justify-between 
                           bg-muted hover:bg-muted/80 data-[state=active]:bg-primary/10 
                           data-[state=active]:border-primary/50 data-[state=active]:shadow transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">ENTRADAS</span>
                  <IconArrowUp
                    size={20}
                    className="text-green-600 dark:text-green-500/70"
                    stroke={2}
                  />
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="saidas"
                className="group rounded-2xl border shadow-sm h-16 px-6 text-base font-semibold justify-between 
                           bg-muted hover:bg-muted/80 data-[state=active]:bg-primary/10 
                           data-[state=active]:border-primary/50 data-[state=active]:shadow transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">SAÍDAS</span>
                  <IconArrowDown
                    size={20}
                    className="text-red-600 dark:text-red-500/70"
                    stroke={2}
                  />
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-8">
              <DataTable
                key="todos"
                data={todosRows}
                onDataChange={setRows}
                columns={columns}
                headerActions={headerActions}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="entradas" className="mt-8">
              <DataTable
                key="entradas"
                data={entradasRows}
                onDataChange={setRows}
                columns={columns}
                headerActions={headerActions}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="saidas" className="mt-8">
              <DataTable
                key="saidas"
                data={saidasRows}
                onDataChange={setRows}
                columns={columns}
                headerActions={headerActions}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open)
              if (!open) {
                setDeleteRow(null)
                setJustification("")
              }
            }}
          >
            <AlertDialogContent
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir {deleteRow?.operacao?.toLowerCase()}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Explique o motivo da exclusão. Isso será salvo junto ao registro.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <label htmlFor="justification" className="text-sm font-medium">
                  Justificativa <span className="text-muted-foreground">(mín. {JUST_MIN} caracteres)</span>
                </label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex.: Lançamento duplicado; corrigido pelo movimento XYZ..."
                  rows={4}
                />
                {justification.trim().length > 0 && justification.trim().length < JUST_MIN && (
                  <p className="text-xs text-destructive">
                    A justificativa precisa ter pelo menos {JUST_MIN} caracteres.
                  </p>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deleting}
                  onClick={() => {
                    setDeleteOpen(false)
                    setDeleteRow(null)
                    setJustification("")
                    requestAnimationFrame(() => focusRestoreRef.current?.focus())
                  }}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting || justification.trim().length < JUST_MIN}
                  onClick={async () => {
                    if (!deleteRow) return
                    setDeleting(true)
                    await toast.promise(
                      ComponentResource
                        .deleteWithJustification(deleteRow.id, justification.trim())
                        .then(async () => {
                          await reload()
                          setDeleteOpen(false)
                          setDeleteRow(null)
                          setJustification("")
                          requestAnimationFrame(() => focusRestoreRef.current?.focus())
                        }),
                      {
                        loading: "Excluindo registro...",
                        success: "Registro excluído com justificativa.",
                        error: "Não foi possível excluir o registro.",
                      }
                    )
                    setDeleting(false)
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
