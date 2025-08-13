"use client"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import * as React from "react"
import { ItemResource } from "@/resources/Item/item.resource"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { PluralResponse } from "coloquent"
import { FerramentaForm } from "@/components/ferramentas/form"
import { RowActions } from "@/components/ferramentas/row-actions"
import type { Ferramenta } from "@/components/ferramentas/types"
import { toast } from "sonner"


export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [ready, setReady] = React.useState(false);
  const [rows, setRows] = React.useState<Ferramenta[]>([])
  const [items, setItems] = React.useState<ItemResource[]>([])
  const [manufacturers, setManufacturers] = React.useState<ManufacturerResource[]>([])
  const [itemGroups, setItemGroups] = React.useState<ItemGroupResource[]>([])

  React.useEffect(() => {
  const tid = localStorage.getItem("@tenancy_id");
  const hasToken = !!(localStorage.getItem("@token") || document.cookie.includes("token="));
  setReady(!!tid && hasToken);
  }, []);

  React.useEffect(() => {
    ItemResource.with(["manufacturer", "itemGroup"]).get().then((response: PluralResponse<ItemResource>) => {
      setItems(response.getData())
    })
    ManufacturerResource.get().then((response: PluralResponse<ManufacturerResource>) => {
      setManufacturers(response.getData())
    })
    ItemGroupResource.get().then((response: PluralResponse<ItemGroupResource>) => {
      setItemGroups(response.getData())
      setIsLoading(false)
    })
  }, [])

  React.useEffect(() => {
    const formatted = items.map((i) => {
      const manufacturer = i.getRelation("manufacturer") as ManufacturerResource | undefined
      const itemGroup = i.getRelation("itemGroup") as ItemGroupResource | undefined
      return {
        id: Number(i.getApiId()),
        nome: i.getAttribute("name"),
        codigo: i.getAttribute("code"),
        grupo: itemGroup?.getAttribute("description") || "",
        fabricante: manufacturer?.getAttribute("description") || "",
        estoqueMinimo: i.getAttribute("min_quantity"),
        estoqueAtual: i.getAttribute("quantity"),
        fornecedor: i.getAttribute("supplier") || "",
        status: i.getAttribute("active") ? "Ativo" : "Inativo",
        resource: i,
        manufacturer,
        itemGroup,
      }
    })
    setRows(formatted)
  }, [items])

  const columns = React.useMemo<ColumnDef<Ferramenta>[]>(
    () => [
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
      { accessorKey: "nome", header: "Nome" },
      { accessorKey: "codigo", header: "Código" },
      { accessorKey: "grupo", header: "Grupo" },
      { accessorKey: "fabricante", header: "Fabricante" },
      { accessorKey: "estoqueMinimo", header: "Estoque Mínimo" },
      { accessorKey: "estoqueAtual", header: "Estoque Atual" },
      { accessorKey: "fornecedor", header: "Fornecedor" },
      {
        accessorKey: "status",
        header: "Status",
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
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onDelete={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
            onSave={(dto) =>
              setRows((prev) =>
                prev.map((r) =>
                  r.id === Number(dto.id)
                    ? {
                        ...r,
                        nome: dto.name,
                        codigo: dto.code,
                        grupo:
                          dto.itemGroupResource?.getAttribute("description") ||
                          "",
                        fabricante:
                          dto.manufacturerResource?.getAttribute("description") ||
                          "",
                        estoqueMinimo: dto.min_quantity,
                        estoqueAtual: dto.quantity,
                        status: dto.active ? "Ativo" : "Inativo",
                        resource: dto.itemResource,
                        manufacturer: dto.manufacturerResource,
                        itemGroup: dto.itemGroupResource,
                      }
                    : r
                )
              )
            }
            manufacturers={manufacturers}
            itemGroups={itemGroups}
          />
        ),
      },
    ],
    [setRows, manufacturers, itemGroups]
  )

  const form = (
  <FerramentaForm
    title="Nova Ferramenta"
    manufacturers={manufacturers}
    itemGroups={itemGroups}
    onSubmit={(dto) =>
      toast.promise(
        ItemResource
          .createOrUpdate(dto.clone().bindToSave())
          .then(() =>
            setRows(prev => [
              ...prev,
              {
                id: prev.length + 1,
                nome: dto.name,
                codigo: dto.code,
                grupo: dto.itemGroupResource?.getAttribute("description") || "",
                fabricante:
                  dto.manufacturerResource?.getAttribute("description") || "",
                estoqueMinimo: dto.min_quantity,
                estoqueAtual: dto.quantity,
                fornecedor: "",
                status: dto.active ? "Ativo" : "Inativo",
                resource: new ItemResource(),
                manufacturer: dto.manufacturerResource,
                itemGroup: dto.itemGroupResource,
              },
            ])
          ),
        {
          loading: "Salvando ferramenta...",
          success: "Ferramenta cadastrada!",
          error: "Erro ao salvar ferramenta.",
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
            addButtonLabel="Nova Ferramenta"
            renderAddForm={form}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
