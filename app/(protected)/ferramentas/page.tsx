"use client"
import Image from "next/image"
import WarningCircleUrl from "@/assets/icons-figma/WarningCircle.svg"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Ferramenta } from "@/components/ferramentas/types"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
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
  const [isLoading, setIsLoading] = React.useState(true)
  const [setReady] = React.useState(false);
  const [rows, setRows] = React.useState<Ferramenta[]>([])
  const [tab, setTab] = React.useState<"alertas" | "todos">("alertas")
  const [items, setItems] = React.useState<ItemResource[]>([])
  const [manufacturers, setManufacturers] = React.useState<ManufacturerResource[]>([])
  const [itemGroups, setItemGroups] = React.useState<ItemGroupResource[]>([])
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingRow, setPendingRow] = React.useState<Ferramenta | null>(null)

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
      const preOrderedAttr = i.getAttribute("pre_ordered") ?? i.getAttribute("pre-ordered") ?? 0
      return {
        id: Number(i.getApiId()),
        nome: i.getAttribute("name"),
        codigo: i.getAttribute("code"),
        grupo: itemGroup?.getAttribute("description") || "",
        fabricante: manufacturer?.getAttribute("description") || "",
        estoqueMinimo: Number(i.getAttribute("min_quantity") ?? 0),
        estoqueAtual: Number(i.getAttribute("quantity") ?? 0),
        fornecedor: i.getAttribute("supplier") || "",
        preOrdered: Number(preOrderedAttr),
        status: i.getAttribute("active") ? "Ativo" : "Inativo",
        resource: i,
        manufacturer,
        itemGroup,
      }
    })
    setRows(formatted)
  }, [items])

  const sortedRows = React.useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const aActive = a.status === "Ativo" ? 1 : 0
      const bActive = b.status === "Ativo" ? 1 : 0
      if (aActive !== bActive) return bActive - aActive // ativos primeiro
      return String(a.nome).localeCompare(String(b.nome))
    })
    return copy
  }, [rows])

  const todosRows = React.useMemo(() => sortedRows, [sortedRows])

  const alertRows = React.useMemo(() => {
    const list = sortedRows.filter(
      r =>
        r.status === "Ativo" &&
        Number(r.estoqueAtual) < Number(r.estoqueMinimo)
    )
    list.sort((a, b) => {
      const aPO = Number(a.preOrdered) === 1 ? 1 : 0
      const bPO = Number(b.preOrdered) === 1 ? 1 : 0
      if (aPO !== bPO) return aPO - bPO
      return String(a.nome).localeCompare(String(b.nome))
    })
    return list
  }, [sortedRows])

  const handleTogglePreOrder = React.useCallback(
  (row: Ferramenta, checked: boolean) => {
    const optimistic = checked ? 1 : 0;

    setRows(prev =>
      prev.map(r => (r.id === row.id ? { ...r, preOrdered: optimistic } : r))
    );

    const p = checked
      ? ItemResource.markAsPreOrdered([row.id])
      : ItemResource.dismarkAsPreOrdered([row.id]);

    toast.promise(p, {
      loading: "Atualizando pedido de compra...",
      success: "Status do pedido atualizado.",
      error: "Não foi possível atualizar o status do pedido.",
    });

    p.catch(() => {
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, preOrdered: row.preOrdered } : r))
      );
    });
  },
  [setRows]
);

  const requestConfirmPreOrder = React.useCallback((row: Ferramenta) => {
    setPendingRow(row)
    setConfirmOpen(true)
  }, [])

  const columns = React.useMemo<ColumnDef<Ferramenta>[]>(
    () => {
      const cols: ColumnDef<Ferramenta>[] = [

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
      ...(tab === "alertas" ? [] : [{ accessorKey: "grupo", header: "Grupo" }] as ColumnDef<Ferramenta>[]),
      { accessorKey: "fabricante", header: "Fabricante" },
      {
        accessorKey: "estoqueMinimo",
        header: "Estoque Mínimo",
        cell: ({ row }) => (
          <span className="tabular-nums text-center block">
            {row.original.estoqueMinimo}
          </span>
        ),
        meta: { className: "text-center" },
      },
      {
        accessorKey: "estoqueAtual",
        header: "Estoque Atual",
        cell: ({ row }) => {
        const atual = Number(row.original.estoqueAtual)
          const minimo = Number(row.original.estoqueMinimo)

          let badgeClass = ""
          let useBadge = false
          let variant: "destructive" | "default" | undefined = undefined

          if (atual === 0) {
            useBadge = true
            variant = "destructive"
          } else if (atual < minimo) {
            useBadge = true
            badgeClass = "bg-orange-300 text-orange-800 dark:bg-orange-500 dark:text-white"
          } else if (atual === minimo) {
            useBadge = true
            badgeClass = "bg-yellow-300 text-yellow-900 dark:bg-yellow-500 dark:text-white"
          }

          return (
            <div className="flex justify-center">
              {useBadge ? (
                <Badge
                  variant={variant}
                  className={cn("px-2 tabular-nums", badgeClass)}
                >
                  {atual}
                </Badge>
              ) : (
                <span className="tabular-nums">{atual}</span>
              )}
            </div>
          )  
        },
        meta: { className: "text-center" },
      },
      { accessorKey: "fornecedor", header: "Fornecedor" },
      ...(tab === "alertas"
        ? ([{
            id: "preOrdered",
            header: () => (
                <div className="text-center w-full">Pedido de compra feito?</div>
            ),
            cell: ({ row }) => {
              const value = Number(row.original.preOrdered) === 1
              return (
                <div className="flex items-center justify-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground">Não</span>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => {
                  if (checked) {
                    requestConfirmPreOrder(row.original)
                  } else {
                    handleTogglePreOrder(row.original, false)
                  }
                }}
                    aria-label="Marcar pedido de compra"
                  />
                  <span className="text-xs text-muted-foreground">Sim</span>
                </div>
              )
            },
            meta: { className: "text-center" },
          }] as ColumnDef<Ferramenta>[])
        : []),
      ...(tab !== "alertas"
        ? ([{
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
          }] as ColumnDef<Ferramenta>[])
        : []),
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
                        preOrdered:
                          Number(dto.itemResource?.getAttribute?.("pre_ordered") ??
                          dto.itemResource?.getAttribute?.("pre-ordered") ??
                          r.preOrdered),
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
      ]
      return cols
    },
    [tab, setRows, manufacturers, itemGroups, handleTogglePreOrder]
  )

  const form = (
  <FerramentaForm
    title="Nova Ferramenta"
    manufacturers={manufacturers}
    itemGroups={itemGroups}
    onSubmit={(dto) => {
      const p = ItemResource.createOrUpdate(dto.clone().bindToSave())
      toast.promise(p, {
        loading: "Salvando ferramenta...",
        success: "Ferramenta cadastrada!",
        error: "Erro ao salvar ferramenta.",
      })
      return p.then(() =>
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
      )
    }}
  />
)

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* container centralizado e com largura limitada */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList
              className="
                mx-auto w-full max-w-5xl
                grid grid-cols-1 gap-3 sm:grid-cols-2
                bg-transparent p-0
              "
            >
              <TabsTrigger
                value="alertas"
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
                <span className="truncate">ITENS EM ALERTA</span>
                <Badge
                  className="
                    ml-3
                    group-data-[state=active]:bg-primary
                    group-data-[state=active]:text-primary-foreground
                  "
                >
                  {alertRows.length}
                </Badge>
              </TabsTrigger>
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
                <Badge
                  variant="secondary"
                  className="
                    ml-3
                    group-data-[state=active]:bg-primary
                    group-data-[state=active]:text-primary-foreground
                  "
                >
                  {todosRows.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alertas" className="mt-8">
              <DataTable
                key="alertas"
                data={alertRows}
                onDataChange={setRows}
                columns={columns}
                addButtonLabel="Nova Ferramenta"
                renderAddForm={form}
                isLoading={isLoading}
                emptyMessage="Nenhum item em alerta 🎉"
              />
            </TabsContent>

            <TabsContent value="todos" className="mt-8">
              <DataTable
                key="todos"
                data={todosRows}
                onDataChange={setRows}
                columns={columns}
                addButtonLabel="Nova Ferramenta"
                renderAddForm={form}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader className="flex flex-col items-center text-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-15 w-15 items-center justify-center rounded-full bg-yellow-100"
                >
                  <Image src={WarningCircleUrl} alt="" width={28} height={28} />
                </span>
                <AlertDialogTitle>Confirmar pedido de compra</AlertDialogTitle>
                <AlertDialogDescription>
                  Deseja marcar <strong>{pendingRow?.nome}</strong> como
                  {" "}“pedido de compra feito”? Essa ação moverá o item para o final da lista em “Alertas”.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (pendingRow) handleTogglePreOrder(pendingRow, true)
                    setConfirmOpen(false)
                    setPendingRow(null)
                  }}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
