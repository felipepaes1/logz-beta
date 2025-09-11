"use client"

import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
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

const baseColumns: ColumnDef<Movimento>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "data",
    header: "Data",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(row.original.data)),
  },
  { accessorKey: "codigo", header: "Código" },
  { accessorKey: "ferramenta", header: "Ferramenta" },
  { accessorKey: "maquina", header: "Máquina" },
  { accessorKey: "responsavel", header: "Responsável" },
  { accessorKey: "operacao", header: "Operação" },
  {
    accessorKey: "precoUnitario",
    header: "Preço unitário",
    cell: ({ row }) =>
      row.original.precoUnitario ?
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(row.original.precoUnitario) : "",
  },
  {
    accessorKey: "precoTotal",
    header: "Preço Total",
    cell: ({ row }) =>
      row.original.precoTotal ?
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(row.original.precoTotal) : "",
  },
  { accessorKey: "ordem", header: "Ordem" },
  { accessorKey: "quantidade", header: "Quantidade" },
]

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
  const [components, setComponents] = React.useState<ComponentResource[]>([])
  const [itemGroups, setItemGroups] = React.useState<ItemGroupResource[]>([])
  const [items, setItems] = React.useState<ItemResource[]>([])
  const [collaborators, setCollaborators] = React.useState<CollaboratorResource[]>([])
  const [machines, setMachines] = React.useState<MachineResource[]>([])
  const [pcps, setPcps] = React.useState<PcpResource[]>([])
  const [isEntradaOpen, setIsEntradaOpen] = React.useState(false)
  const [isSaidaOpen, setIsSaidaOpen] = React.useState(false)

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

  const columns = React.useMemo<ColumnDef<Movimento>[]>(
    () => [
      ...baseColumns,
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
            onDelete={() => reload()}
            onSave={() => reload()}
          />
        ),
      },
    ],
    [reload, itemGroups, items, collaborators, machines, pcps]
  )

  function saveWithToast(dto: ComponentDto) {
    return toast.promise(
      ComponentResource.createOrUpdate(dto.clone().bindToSave()).then(async () => {
        await Promise.all([reload(), reloadItems()])
        setIsEntradaOpen(false)
        setIsSaidaOpen(false)
      }),
      {
        loading: "Salvando movimento...",
        success: "Movimento registrado!",
        error: "Erro ao salvar movimento.",
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
          <DataTable
            data={rows}
            onDataChange={setRows}
            columns={columns}
            headerActions={headerActions}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
