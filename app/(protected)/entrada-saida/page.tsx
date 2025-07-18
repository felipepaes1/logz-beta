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
  { accessorKey: "grupo", header: "Grupo" },
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
  const [rows, setRows] = React.useState<Movimento[]>([])
  const [components, setComponents] = React.useState<ComponentResource[]>([])
  const [itemGroups, setItemGroups] = React.useState<ItemGroupResource[]>([])
  const [items, setItems] = React.useState<ItemResource[]>([])
  const [collaborators, setCollaborators] = React.useState<CollaboratorResource[]>([])
  const [machines, setMachines] = React.useState<MachineResource[]>([])
  const [pcps, setPcps] = React.useState<PcpResource[]>([])

  React.useEffect(() => {
    ComponentResource.orderBy("created_at", "desc")
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
      })
    ItemGroupResource.get().then((r: PluralResponse<ItemGroupResource>) => {
      setItemGroups(r.getData())
    })
    ItemResource.with(["manufacturer", "itemGroup"]).get().then((r: PluralResponse<ItemResource>) => {
      setItems(r.getData())
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
  }, [])

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
            onDelete={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
            onSave={(dto) =>
              setRows((prev) =>
                prev.map((r) =>
                  r.id === Number(dto.id) ? dtoToRow(dto) : r
                )
              )
            }
          />
        ),
      },
    ],
    [setRows, itemGroups, items, collaborators, machines, pcps]
  )

  function addComponent(dto: ComponentDto) {
    ComponentResource.createOrUpdate(dto.clone().bindToSave())
    setRows((prev) => [
      ...prev,
      {
        ...dtoToRow(dto),
        id: prev.length + 1,
      },
    ])
  }

  const headerActions = (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">Cadastrar entrada</Button>
        </DrawerTrigger>
        <EntradaForm
          itemGroups={itemGroups}
          items={items}
          collaborators={collaborators}
          onSubmit={(dto) => {
            addComponent(dto)
          }}
        />
      </Drawer>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">Cadastrar Saída</Button>
        </DrawerTrigger>
        <SaidaForm
          itemGroups={itemGroups}
          items={items}
          collaborators={collaborators}
          machines={machines}
          pcps={pcps}
          onSubmit={(dto) => {
            addComponent(dto)
          }}
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
          />
        </div>
      </div>
    </div>
  )
}
