"use client"

import * as React from "react"

import { IconAlertCircle } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ItemResource } from "@/resources/Item/item.resource"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { ProviderResource } from "@/resources/Provider/provider.resource"
import { PurchaseRequestResource } from "@/resources/PurchaseRequest/purchase-request.resource"
import { PluralResponse } from "coloquent"
import { FerramentaForm } from "@/components/ferramentas/form"
import { RowActions } from "@/components/ferramentas/row-actions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Ferramenta, PurchaseRequestInfo } from "@/components/ferramentas/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const readAttr = (obj: any, key: string) => {
  if (!obj) return undefined
  if (typeof obj.getAttribute === "function") return obj.getAttribute(key)
  if (obj?.attributes && Object.prototype.hasOwnProperty.call(obj.attributes, key)) {
    return obj.attributes[key]
  }
  return obj[key]
}

const readRel = (obj: any, key: string) => {
  if (!obj) return undefined
  if (typeof obj.getRelation === "function") return obj.getRelation(key)
  return obj[key] ?? obj?.relationships?.[key]?.data
}

const buildIncludedMap = (included: any[]) => {
  const map = new Map<string, any>()
  if (!Array.isArray(included)) return map
  included.forEach((entry) => {
    if (entry?.type && entry?.id != null) {
      map.set(`${entry.type}:${entry.id}`, entry)
    }
  })
  return map
}

const resolveIncluded = (value: any, includedMap: Map<string, any>) => {
  if (!value) return value
  if (Array.isArray(value)) {
    return value.map((entry) => resolveIncluded(entry, includedMap))
  }
  if (value?.type && value?.id != null) {
    return includedMap.get(`${value.type}:${value.id}`) ?? value
  }
  return value
}

const resolveRelation = (obj: any, key: string, includedMap: Map<string, any>) => {
  const rel = readRel(obj, key)
  return resolveIncluded(rel, includedMap)
}

const pickPurchaseRequest = (raw: any) => {
  if (!raw) return null
  if (Array.isArray(raw)) {
    const open = raw.find((entry) => {
      const closedAt = readAttr(entry, "closed_at") ?? readAttr(entry, "closedAt")
      return closedAt === null || closedAt === undefined || closedAt === ""
    })
    return open ?? raw[0] ?? null
  }
  return raw
}

const extractPurchaseRequestInfo = (resource: ItemResource): PurchaseRequestInfo | null => {
  const relation =
    resource.getRelation?.("purchase_request") ??
    resource.getRelation?.("purchaseRequest") ??
    resource.getRelation?.("purchase_requests") ??
    resource.getRelation?.("purchaseRequests") ??
    null

  const raw =
    relation ??
    resource.getAttribute("purchase_request") ??
    resource.getAttribute("purchaseRequest") ??
    resource.getAttribute("purchase_requests") ??
    resource.getAttribute("purchaseRequests") ??
    null

  const pr = pickPurchaseRequest(raw)
  if (!pr) return null

  const provider =
    readRel(pr, "provider") ??
    readAttr(pr, "provider") ??
    readAttr(pr, "provider_resource") ??
    null

  const providerName =
    provider?.getAttribute?.("company_name") ??
    provider?.getAttribute?.("name") ??
    provider?.company_name ??
    provider?.name ??
    readAttr(pr, "provider_name") ??
    readAttr(pr, "providerName") ??
    undefined

  const providerIdRaw =
    readAttr(pr, "provider_id") ??
    readAttr(pr, "providerId") ??
    provider?.getApiId?.() ??
    provider?.id ??
    undefined
  const providerIdNum = Number(providerIdRaw)
  const providerId = Number.isFinite(providerIdNum) ? providerIdNum : undefined

  const requestedQtyRaw =
    readAttr(pr, "requested_qty") ??
    readAttr(pr, "requestedQty") ??
    readAttr(pr, "requested_quantity") ??
    readAttr(pr, "quantity") ??
    undefined
  const requestedQtyNum = Number(requestedQtyRaw)
  const requestedQty = Number.isFinite(requestedQtyNum) ? requestedQtyNum : undefined

  const openedAt =
    readAttr(pr, "opened_at") ??
    readAttr(pr, "openedAt") ??
    readAttr(pr, "created_at") ??
    readAttr(pr, "createdAt") ??
    undefined

  const closedAt = readAttr(pr, "closed_at") ?? readAttr(pr, "closedAt") ?? undefined
  const openedBy =
    readAttr(pr, "opened_by") ??
    readAttr(pr, "openedBy") ??
    readAttr(pr, "opened_by_name") ??
    readAttr(pr, "openedByName") ??
    undefined

  const hasInfo = providerName || providerId || requestedQty || openedAt || closedAt || openedBy
  if (!hasInfo) return null

  return {
    providerName,
    providerId,
    requestedQty,
    openedAt: openedAt ? String(openedAt) : undefined,
    closedAt: closedAt ? String(closedAt) : undefined,
    openedBy,
  }
}

const parsePurchaseRequestEntry = (entry: any, includedMap: Map<string, any>) => {
  if (!entry) return null
  const provider =
    resolveRelation(entry, "provider", includedMap) ??
    readAttr(entry, "provider") ??
    null
  const item =
    resolveRelation(entry, "item", includedMap) ??
    readAttr(entry, "item") ??
    null
  const openedByRel =
    resolveRelation(entry, "openedBy", includedMap) ??
    resolveRelation(entry, "opened_by", includedMap) ??
    resolveRelation(entry, "opened_by_user", includedMap) ??
    readAttr(entry, "openedBy") ??
    readAttr(entry, "opened_by") ??
    null

  const itemIdRaw =
    readAttr(entry, "item_id") ??
    readAttr(item, "id") ??
    item?.id ??
    item?.getApiId?.()
  const itemId = Number(itemIdRaw)
  if (!Number.isFinite(itemId)) return null

  const providerName =
    provider?.getAttribute?.("company_name") ??
    provider?.getAttribute?.("name") ??
    provider?.company_name ??
    provider?.name ??
    readAttr(entry, "provider_name") ??
    readAttr(entry, "providerName") ??
    undefined

  const providerIdRaw =
    readAttr(entry, "provider_id") ??
    readAttr(provider, "id") ??
    provider?.id ??
    provider?.getApiId?.() ??
    undefined
  const providerIdNum = Number(providerIdRaw)
  const providerId = Number.isFinite(providerIdNum) ? providerIdNum : undefined

  const requestedQtyRaw =
    readAttr(entry, "requested_qty") ??
    readAttr(entry, "requestedQty") ??
    readAttr(entry, "requested_quantity") ??
    readAttr(entry, "quantity") ??
    undefined
  const requestedQtyNum = Number(requestedQtyRaw)
  const requestedQty = Number.isFinite(requestedQtyNum) ? requestedQtyNum : undefined

  const openedAt =
    readAttr(entry, "opened_at") ??
    readAttr(entry, "openedAt") ??
    readAttr(entry, "created_at") ??
    readAttr(entry, "createdAt") ??
    undefined
  const closedAt = readAttr(entry, "closed_at") ?? readAttr(entry, "closedAt") ?? undefined
  const openedByName =
    readAttr(openedByRel, "name") ??
    readAttr(openedByRel, "full_name") ??
    readAttr(openedByRel, "email") ??
    readAttr(entry, "opened_by_name") ??
    readAttr(entry, "openedByName") ??
    undefined
  const openedById =
    readAttr(openedByRel, "id") ?? openedByRel?.id ?? openedByRel?.getApiId?.() ?? undefined
  const openedBy = openedByName ?? openedById

  const info: PurchaseRequestInfo = {
    providerName,
    providerId,
    requestedQty,
    openedAt: openedAt ? String(openedAt) : undefined,
    closedAt: closedAt ? String(closedAt) : undefined,
    openedBy,
  }

  return { itemId, info }
}

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<Ferramenta[]>([])
  const [tab, setTab] = React.useState<"alertas" | "todos">("alertas")
  const [items, setItems] = React.useState<ItemResource[]>([])
  const [manufacturers, setManufacturers] = React.useState<ManufacturerResource[]>([])
  const [itemGroups, setItemGroups] = React.useState<ItemGroupResource[]>([])
  const [providers, setProviders] = React.useState<ProviderResource[]>([])
  const [purchaseRequestMap, setPurchaseRequestMap] = React.useState<Record<number, PurchaseRequestInfo>>({})
  const [preOrderOpen, setPreOrderOpen] = React.useState(false)
  const [preOrderRow, setPreOrderRow] = React.useState<Ferramenta | null>(null)
  const [preOrderProviderId, setPreOrderProviderId] = React.useState("")
  const [preOrderQty, setPreOrderQty] = React.useState("")
  const [preOrderSaving, setPreOrderSaving] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteRow, setDeleteRow] = React.useState<Ferramenta | null>(null)
  const focusRestoreRef = React.useRef<HTMLButtonElement>(null)

  const requestDelete = React.useCallback((row: Ferramenta) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])


  React.useEffect(() => {
    let mounted = true
    const loadItems = async () => {
      try {
        const response = await ItemResource.with(["manufacturer", "itemGroup", "provider", "pcp", "avatar"]).get()
        if (mounted) setItems((response as PluralResponse<ItemResource>).getData())
      } catch {
        if (mounted) toast.error("Nao foi possivel carregar itens.")
      }
    }

    loadItems()
    ManufacturerResource.get().then((response: PluralResponse<ManufacturerResource>) => {
      if (mounted) setManufacturers(response.getData())
    })
    ItemGroupResource.get().then((response: PluralResponse<ItemGroupResource>) => {
      if (mounted) setItemGroups(response.getData())
      if (mounted) setIsLoading(false)
    })
    ProviderResource.get()
      .then((response: PluralResponse<ProviderResource>) => {
        if (mounted) setProviders(response.getData())
      })
      .catch(() => {
        toast.error("Nao foi possivel carregar fornecedores.")
      })

    return () => {
      mounted = false
    }
  }, [])

  const alertItemIds = React.useMemo(() => {
    return items
      .filter((item) => {
        const active = !!item.getAttribute?.("active")
        const minQty = Number(item.getAttribute?.("min_quantity") ?? 0)
        const qty = Number(item.getAttribute?.("quantity") ?? 0)
        return active && qty < minQty
      })
      .map((item) => Number(item.getApiId?.()))
      .filter((id) => Number.isFinite(id))
  }, [items])

  const alertItemIdsKey = React.useMemo(() => alertItemIds.join(","), [alertItemIds])

  React.useEffect(() => {
    let mounted = true
    if (!alertItemIds.length) {
      setPurchaseRequestMap({})
      return () => {
        mounted = false
      }
    }

    PurchaseRequestResource
      .current({ item_ids: alertItemIds })
      .then((response: any) => {
        const payload = response?.axiosResponse?.data ?? response?.data ?? response
        const dataRaw = payload?.data ?? payload?.data?.data ?? payload ?? []
        const list = Array.isArray(dataRaw) ? dataRaw : []
        const included = payload?.included ?? payload?.data?.included ?? []
        const includedMap = buildIncludedMap(included)
        const nextMap: Record<number, PurchaseRequestInfo> = {}

        list.forEach((entry: any) => {
          const parsed = parsePurchaseRequestEntry(entry, includedMap)
          if (parsed?.itemId && parsed.info) {
            nextMap[parsed.itemId] = parsed.info
          }
        })

        if (mounted) setPurchaseRequestMap(nextMap)
      })
      .catch(() => {
        if (mounted) toast.error("Nao foi possivel carregar pedidos de compra.")
      })

    return () => {
      mounted = false
    }
  }, [alertItemIdsKey])

  React.useEffect(() => {
    const formatted = items.map((i) => {
      const manufacturer = i.getRelation("manufacturer") as ManufacturerResource | undefined
      const itemGroup = i.getRelation("itemGroup") as ItemGroupResource | undefined
      const provider = i.getRelation?.("provider") as ProviderResource | undefined
      const preOrderedAttr = i.getAttribute("pre_ordered") ?? i.getAttribute("pre-ordered") ?? false
      const preOrdered =
        typeof preOrderedAttr === "boolean"
          ? preOrderedAttr
          : Number(preOrderedAttr) === 1
      const fornecedorNome =
        provider?.getAttribute?.("company_name") ??
        provider?.getAttribute?.("name") ??
        i.getAttribute?.("supplier") ??
        ""
      const basePurchaseRequest = extractPurchaseRequestInfo(i)
      const mappedPurchaseRequest = purchaseRequestMap[Number(i.getApiId())]
      const purchaseRequestRaw = mappedPurchaseRequest ?? basePurchaseRequest
      const purchaseRequestProviderId = purchaseRequestRaw?.providerId
      const providerMatch =
        purchaseRequestProviderId
          ? providers.find(
              (p) => String(p.getApiId?.() ?? "") === String(purchaseRequestProviderId)
            )
          : undefined
      const providerMatchName =
        providerMatch?.getAttribute?.("company_name") ??
        providerMatch?.getAttribute?.("name") ??
        undefined
      const purchaseRequest =
        purchaseRequestRaw && !purchaseRequestRaw.providerName && providerMatchName
          ? { ...purchaseRequestRaw, providerName: providerMatchName }
          : purchaseRequestRaw
      const groupIdRaw =
        itemGroup?.getApiId?.() ??
        i.getAttribute?.("item_group_id") ??
        i.getAttribute?.("itemGroupId") ??
        i.getAttribute?.("item_group") ??
        null
      const groupId = groupIdRaw != null ? String(groupIdRaw) : ""
      const groupFromList = groupId
        ? itemGroups.find((g) => String(g.getApiId?.() ?? g.getAttribute?.("id") ?? "") === groupId)
        : undefined
      const groupLabel =
        groupFromList?.getAttribute?.("description") ??
        itemGroup?.getAttribute?.("description") ??
        ""

      return {
        id: Number(i.getApiId()),
        nome: i.getAttribute("name"),
        codigo: i.getAttribute("code"),
        grupo: groupLabel,
        fabricante: manufacturer?.getAttribute("description") || "",
        estoqueMinimo: Number(i.getAttribute("min_quantity") ?? 0),
        estoqueAtual: Number(i.getAttribute("quantity") ?? 0),
        fornecedor: fornecedorNome,
        preOrdered,
        purchaseRequest,
        status: i.getAttribute("active") ? "Ativo" : "Inativo",
        resource: i,
        manufacturer,
        itemGroup,
        provider,
      }
    })
    setRows(formatted)
  }, [items, itemGroups, providers, purchaseRequestMap])

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
      const aPO = a.preOrdered ? 1 : 0
      const bPO = b.preOrdered ? 1 : 0
      if (aPO !== bPO) return aPO - bPO
      return String(a.nome).localeCompare(String(b.nome))
    })
    return list
  }, [sortedRows])

  const rowsRef = React.useRef<Ferramenta[]>([])
  React.useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  const openPreOrderModal = React.useCallback((row: Ferramenta) => {
    setPreOrderRow(row)
    const providerId =
      row.purchaseRequest?.providerId ??
      row.provider?.getApiId?.() ??
      row.resource?.getAttribute?.("provider_id") ??
      ""
    const suggestedQty =
      row.purchaseRequest?.requestedQty ??
      Math.max(0, Number(row.estoqueMinimo) - Number(row.estoqueAtual))
    setPreOrderProviderId(providerId ? String(providerId) : "")
    setPreOrderQty(String(suggestedQty ?? ""))
    setPreOrderOpen(true)
  }, [])

  const handleDismarkPreOrder = React.useCallback((row: Ferramenta) => {
    const prevRow = rowsRef.current.find(r => r.id === row.id) ?? row
    const beforeVal = prevRow.preOrdered
    const beforeRequest = prevRow.purchaseRequest ?? null
    const nextRequest = beforeRequest
      ? { ...beforeRequest, closedAt: beforeRequest.closedAt ?? new Date().toISOString() }
      : beforeRequest

    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, preOrdered: false, purchaseRequest: nextRequest } : r)))
    setPurchaseRequestMap((prev) => {
      const next = { ...prev }
      delete next[row.id]
      return next
    })

    const p = ItemResource.dismarkAsPreOrdered({ item_ids: [row.id] })

    toast.promise(p, {
      loading: "Atualizando pedido de compra...",
      success: "Status do pedido atualizado.",
      error: "Nao foi possivel atualizar o status do pedido.",
    })

    p.catch(() => {
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, preOrdered: beforeVal, purchaseRequest: beforeRequest } : r)))
      if (beforeRequest) {
        setPurchaseRequestMap((prev) => ({ ...prev, [row.id]: beforeRequest }))
      }
    })
  }, [setRows, setPurchaseRequestMap])

  const handleConfirmPreOrder = React.useCallback(async () => {
    if (!preOrderRow) return
    const providerIdNum = Number(preOrderProviderId)
    if (!Number.isFinite(providerIdNum) || providerIdNum <= 0) {
      toast.error("Selecione um fornecedor.")
      return
    }
    const requestedQtyNum = Number(preOrderQty)
    if (!Number.isFinite(requestedQtyNum) || requestedQtyNum <= 0) {
      toast.error("Informe a quantidade solicitada.")
      return
    }

    const payload = {
      items: [
        { item_id: preOrderRow.id, provider_id: providerIdNum, requested_qty: requestedQtyNum },
      ],
    }

    const providerName =
      providers.find((p) => String(p.getApiId?.() ?? "") === String(providerIdNum))
        ?.getAttribute?.("company_name") ??
      providers.find((p) => String(p.getApiId?.() ?? "") === String(providerIdNum))
        ?.getAttribute?.("name") ??
      preOrderRow.fornecedor ??
      ""

    try {
      setPreOrderSaving(true)
      const p = ItemResource.markAsPreOrdered(payload)
      toast.promise(p, {
        loading: "Atualizando pedido de compra...",
        success: "Pedido de compra registrado.",
        error: "Nao foi possivel registrar o pedido.",
      })
      await p
      setRows(prev =>
        prev.map(r =>
          r.id === preOrderRow.id
            ? {
                ...r,
                preOrdered: true,
                purchaseRequest: {
                  providerId: providerIdNum,
                  providerName,
                  requestedQty: requestedQtyNum,
                  openedAt: r.purchaseRequest?.openedAt,
                  openedBy: r.purchaseRequest?.openedBy,
                },
              }
            : r
        )
      )
      setPurchaseRequestMap((prev) => ({
        ...prev,
        [preOrderRow.id]: {
          providerId: providerIdNum,
          providerName,
          requestedQty: requestedQtyNum,
          openedAt: preOrderRow.purchaseRequest?.openedAt,
          openedBy: preOrderRow.purchaseRequest?.openedBy,
        },
      }))
      setPreOrderOpen(false)
      setPreOrderRow(null)
      setPreOrderProviderId("")
      setPreOrderQty("")
    } catch {
      // handled by toast.promise
    } finally {
      setPreOrderSaving(false)
    }
  }, [preOrderRow, preOrderProviderId, preOrderQty, providers, setPurchaseRequestMap])

  const handleDelete = React.useCallback(async (id: number) => {
    try {
      await ItemResource.deleteMany([id])
      setRows(prev => prev.filter(r => r.id !== id))
      toast.success("Item excluído!")
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao excluir o item.")
      return false
    }
    return true
  }, [])

  

  const columns = React.useMemo<ColumnDef<Ferramenta>[]>(
    () => {
      const cols: ColumnDef<Ferramenta>[] = [
      { accessorKey: "nome", header: "Nome", meta: { className: "max-w-[240px]", truncate: true } },
      { accessorKey: "codigo", header: "Código" },
      ...(tab === "alertas" ? [] : [{ accessorKey: "grupo", header: "Grupo", meta: { className: "max-w-[200px]", truncate: true } }] as ColumnDef<Ferramenta>[]),
      { accessorKey: "fabricante", header: "Fabricante", meta: { className: "max-w-[200px]", truncate: true } },
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
      { accessorKey: "fornecedor", header: "Fornecedor", meta: { className: "max-w-[220px]", truncate: true } },
      ...(tab === "alertas"
        ? ([{
            id: "preOrdered",
            header: () => (
                <div className="text-center w-full">Pedido de compra feito?</div>
            ),
            cell: ({ row }) => {
              const value = !!row.original.preOrdered
              return (
                <div className="flex items-center justify-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground">Não</span>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        openPreOrderModal(row.original)
                      } else {
                        handleDismarkPreOrder(row.original)
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
            onRequestDelete={requestDelete}
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
                        fornecedor:
                          dto.providerResource?.getAttribute?.("company_name") ??
                          dto.providerResource?.getAttribute?.("name") ??
                          dto.supplier ??
                          "",
                        status: dto.active ? "Ativo" : "Inativo",
                        resource: dto.itemResource,
                        manufacturer: dto.manufacturerResource,
                        itemGroup: dto.itemGroupResource,
                        provider: dto.providerResource,
                        // Preserve current preOrdered status when editing other fields
                        preOrdered: r.preOrdered,
                        purchaseRequest: r.purchaseRequest,
                      }
                    : r
                )
              )
            }
            manufacturers={manufacturers}
            itemGroups={itemGroups}
            onGroupsUpdated={setItemGroups}
          />
        ),
      },
      ]
      return cols
    }, [
    tab,
    manufacturers,
    itemGroups,
    handleDismarkPreOrder,
    openPreOrderModal,
    requestDelete
  ])

  const searchableColumns = React.useMemo(
    () => {
      const base = [
        { id: "nome", label: "Nome" },
        { id: "codigo", label: "Codigo" },
        { id: "fabricante", label: "Fabricante" },
        { id: "fornecedor", label: "Fornecedor" },
      ]
      if (tab === "alertas") {
        return base
      }
      return [
        ...base,
        { id: "grupo", label: "Grupo" },
        { id: "status", label: "Status" },
      ]
    },
    [tab]
  )

  const form = React.useMemo(() => (
    <FerramentaForm
      title="Nova Ferramenta"
      manufacturers={manufacturers}
      itemGroups={itemGroups}
      onGroupsUpdated={setItemGroups}
      onSubmit={(dto) => {
        const p = ItemResource.createOrUpdate(dto.clone().bindToSave())
        toast.promise(p, {
          loading: "Salvando ferramenta...",
          success: "Ferramenta cadastrada!",
          error: "Erro ao salvar ferramenta.",
        })
        return p
      }}
    />
  ), [manufacturers, itemGroups])

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
                <div className="flex items-center gap-2">
                <span className="truncate">ITENS EM ALERTA</span>
                  <IconAlertCircle className="text-red-500 dark:text-red-500/70" size={30} />
                </div>
                <Badge
                  className="
                    ml-3
                    group-data-[state=active]:bg-primary
                    group-data-[state=active]:text-primary-foreground
                    dark:text-white
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
                    dark:text-white
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
                columns={columns}
                addButtonLabel="Nova Ferramenta"
                renderAddForm={form}
                isLoading={isLoading}
                searchableColumns={searchableColumns}
                searchPlaceholder="Buscar ferramenta por nome, código, fabricante ou fornecedor"
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
                searchableColumns={searchableColumns}
                searchPlaceholder="Buscar ferramenta por nome, código, fabricante, fornecedor ou status"
              />
            </TabsContent>

          </Tabs>
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
                <AlertDialogTitle>Excluir ferramenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso fará a <strong>exclusão lógica</strong>. As movimentações de estoque permanecem.
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
                    const ok = await handleDelete(deleteRow.id)
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
          <AlertDialog
            open={preOrderOpen}
            onOpenChange={(open) => {
              setPreOrderOpen(open)
              if (!open) {
                setPreOrderRow(null)
                setPreOrderProviderId("")
                setPreOrderQty("")
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Registrar pedido de compra</AlertDialogTitle>
                <AlertDialogDescription>
                  Selecione o fornecedor e informe a quantidade solicitada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-2 text-sm">
                <div className="flex flex-col gap-2">
                  <Label>Item</Label>
                  <div className="rounded-md border px-3 py-2 text-sm">
                    {preOrderRow?.nome ?? "-"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="preorder-provider">Fornecedor</Label>
                  <Select
                    value={preOrderProviderId || undefined}
                    onValueChange={setPreOrderProviderId}
                  >
                    <SelectTrigger id="preorder-provider">
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem
                          key={provider.getApiId?.() ?? provider.getAttribute?.("id")}
                          value={provider.getApiId?.()?.toString?.() ?? ""}
                        >
                          {provider.getAttribute?.("company_name") ??
                            provider.getAttribute?.("name") ??
                            "-"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="preorder-qty">Quantidade solicitada</Label>
                  <Input
                    id="preorder-qty"
                    type="number"
                    min={1}
                    value={preOrderQty}
                    onChange={(e) => setPreOrderQty(e.target.value)}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={preOrderSaving}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="dark: text-white"
                  onClick={(e) => {
                    e.preventDefault()
                    handleConfirmPreOrder()
                  }}
                  disabled={preOrderSaving}
                >
                  {preOrderSaving ? "Salvando..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
