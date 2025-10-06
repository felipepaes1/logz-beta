"use client"

import * as React from "react"
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ItemResource } from "@/resources/Item/item.resource"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { ManufacturerDto } from "@/resources/Manufacturer/manufacturer.dto"
import { ItemGroupDto } from "@/resources/ItemGroup/item-group.dto"
import { ItemDto } from "@/resources/Item/item.dto"
import { cn } from "@/lib/utils"
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
import { toast } from "sonner"
import { ProviderResource } from "@/resources/Provider/provider.resource"
import { ProviderDto } from "@/resources/Provider/provider.dto"

interface FerramentaFormProps {
  onSubmit: (dto: ItemDto) => Promise<unknown>
  resource?: ItemResource
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
  title: string
  onRequestClose?: () => void
}

export function FerramentaForm({
  onSubmit,
  resource,
  manufacturers,
  itemGroups,
  title,
  onRequestClose
}: FerramentaFormProps) {
  const [active, setActive] = React.useState(
    resource?.getAttribute("active") ?? true
  )
  const [manufacturerId, setManufacturerId] = React.useState(
    resource?.getRelation("manufacturer")?.getApiId()?.toString() ?? ""
  )
  const [itemGroupId, setItemGroupId] = React.useState(
    resource?.getRelation("itemGroup")?.getApiId()?.toString() ?? ""
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [groups, setGroups] = React.useState<ItemGroupResource[]>(itemGroups)
  React.useEffect(() => setGroups(itemGroups), [itemGroups])
  const wantSelectGroupIdRef = React.useRef<string | null>(null)
  const [newGroupOpen, setNewGroupOpen] = React.useState(false)
  const [newGroupName, setNewGroupName] = React.useState("")
  const [creatingGroup, setCreatingGroup] = React.useState(false)
  const loadingGroupsRef = React.useRef(false)
  const [mans, setMans] = React.useState<ManufacturerResource[]>(manufacturers)
  React.useEffect(() => setMans(manufacturers), [manufacturers])
  const wantSelectManufacturerIdRef = React.useRef<string | null>(null)
  const [newManufacturerOpen, setNewManufacturerOpen] = React.useState(false)
  const [newManufacturerName, setNewManufacturerName] = React.useState("")
  const [creatingManufacturer, setCreatingManufacturer] = React.useState(false)
  const [providers, setProviders] = React.useState<ProviderResource[]>([])
  const [providerId, setProviderId] = React.useState<string>(
    resource?.getRelation?.("provider")?.getApiId?.()?.toString?.() ??
    resource?.getAttribute?.("provider_id")?.toString?.() ??
    ""
  )
  const [errors, setErrors] = React.useState<{
    nome?: string
    codigo?: string
    itemGroup?: string
    manufacturer?: string
  }>({})

  React.useEffect(() => {
    const wanted = wantSelectGroupIdRef.current
    if (!wanted) return
    const found = groups.some((g) => {
      const rawId = g.getApiId?.() ?? g.getAttribute?.("id")
      return String(rawId ?? "") === wanted
    })
    if (found) {
      setItemGroupId(wanted)
      wantSelectGroupIdRef.current = null
    }
  }, [groups])

  React.useEffect(() => {
    const wanted = wantSelectManufacturerIdRef.current
    if (!wanted) return
    const found = mans.some((m) => {
      const rawId = m.getApiId?.() ?? m.getAttribute?.("id")
      return String(rawId ?? "") === wanted
    })
    if (found) {
      setManufacturerId(wanted)
      wantSelectManufacturerIdRef.current = null
    }
  }, [mans])

  React.useEffect(() => {
    let mounted = true
    ProviderResource
      .get()
      .then((resp: any) => {
        if (!mounted) return
        const data = resp?.getData?.() ?? resp?.data ?? []
        setProviders(data)
      })
      .catch(() => {/* opcional: toast.error("Não foi possível carregar fornecedores") */})
    return () => { mounted = false }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const nome = data.get("nome")?.toString().trim() || ""
    const codigo = data.get("codigo")?.toString().trim() || ""
    const manufacturerRsc = mans.find(
      (m) => m.getApiId()?.toString() === manufacturerId
    )
    const itemGroupRsc = groups.find((g) => g.getApiId()?.toString() === itemGroupId)
    const providerRsc = providers.find((p) => p.getApiId()?.toString() === providerId)

    const newErrors: typeof errors = {}
    if (!nome) newErrors.nome = "Campo obrigatório"
    if (!codigo) newErrors.codigo = "Campo obrigatório"
    if (!itemGroupId) newErrors.itemGroup = "Campo obrigatório"
    if (!manufacturerId) newErrors.manufacturer = "Campo obrigatório"

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new ItemDto()
    if (resource) dto.createFromColoquentResource(resource)
    dto.name = nome
    dto.code = codigo
    dto.active = active
    dto.description = nome
    dto.min_quantity = Number(data.get("estoqueMinimo") || 0)
    dto.quantity = 0
    dto.manufacturerResource = manufacturerRsc
    dto.itemGroupResource = itemGroupRsc
    if (providerRsc) {
      const supplierName =
        providerRsc.getAttribute?.("company_name") ??
        providerRsc.getAttribute?.("name") ??
        ""
      ;(dto as any).supplier = supplierName
      ;(dto as any).provider_id = Number(providerRsc.getApiId?.() ?? NaN) || undefined
    }

    try {
      setSubmitting(true)
      await onSubmit(dto)
      form.reset()
      setActive(true)
      setProviderId("")
      onRequestClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DrawerContent
      onPointerDownOutside={(e) => {
        e.preventDefault()
        onRequestClose?.()
      }}
      onEscapeKeyDown={(e) => {
        e.preventDefault()
        onRequestClose?.()
      }}
    >
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>

      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Nome */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={resource?.getAttribute("name")}
              className={cn(errors.nome && "border-destructive")}
            />
            {errors.nome && (
              <span className="text-destructive text-xs">{errors.nome}</span>
            )}
          </div>

          {/* Código */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              name="codigo"
              defaultValue={resource?.getAttribute("code")}
              className={cn(errors.codigo && "border-destructive")}
            />
            {errors.codigo && (
              <span className="text-destructive text-xs">{errors.codigo}</span>
            )}
          </div>

          {/* Grupo */}
          <div className="flex flex-col gap-3">
            <Label>Grupo</Label>
            <Select value={itemGroupId || undefined} onValueChange={setItemGroupId}>
              <SelectTrigger
                className={cn(errors.itemGroup && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g, idx) => {
                  const rawId = g.getApiId?.() ?? g.getAttribute?.("id") ?? null
                  const safeId = String(rawId ?? `tmp-${idx}`)
                  const label = g.getAttribute?.("description") ?? `Grupo ${idx + 1}`
                  return <SelectItem key={safeId} value={safeId}>{label}</SelectItem>
                })}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setNewGroupOpen(true)}
            >
              + Novo Grupo
            </Button>
            {errors.itemGroup && (
              <span className="text-destructive text-xs">
                {errors.itemGroup}
              </span>
            )}
          </div>

          {/* Fabricante */}
          <div className="flex flex-col gap-3">
            <Label>Fabricante</Label>
            <Select value={manufacturerId} onValueChange={setManufacturerId}>
              <SelectTrigger
                className={cn(errors.manufacturer && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um fabricante" />
              </SelectTrigger>
              <SelectContent>
                {mans.map((m, idx) => (
                  <SelectItem
                    key={(m.getApiId?.() ?? m.getAttribute?.("id") ?? `m-${idx}`).toString()}
                    value={m.getApiId()?.toString() || m.getAttribute?.("id")?.toString() || ""}
                  >
                    {m.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setNewManufacturerOpen(true)}
            >
              + Novo Fabricante
            </Button>
            {errors.manufacturer && (
              <span className="text-destructive text-xs">
                {errors.manufacturer}
              </span>
            )}
          </div>

          {/* Estoques */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
            <Input
              id="estoqueMinimo"
              name="estoqueMinimo"
              type="number"
              defaultValue={
                resource?.getAttribute("min_quantity")?.toString() ?? ""
              }
            />
          </div>

          {/* Fornecedor */}
          <div className="flex flex-col gap-3">
            <Label>Fornecedor</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem
                    key={p.getApiId?.() ?? p.getAttribute?.("id")}
                    value={p.getApiId?.()?.toString?.() ?? ""}
                  >
                    {p.getAttribute?.("company_name") ?? p.getAttribute?.("name") ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Label htmlFor="status">Status</Label>
            <Switch
              id="status"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={submitting} className="dark: text-white">
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </div>
      {/* AlertDialog: Criar novo grupo (padrão de criação igual ao handleSubmit) */}
      <AlertDialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o nome para cadastrar um novo grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Usamos um <form> para manter o mesmo padrão de submit/validação */}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const name = newGroupName.trim()
              if (!name) {
                toast.error("Informe o nome do grupo.")
                return
              }
              try {
                setCreatingGroup(true)

                const dto = new ItemGroupDto()
                dto.description = name

                const created = await ItemGroupResource.createOrUpdate(dto)
                const returnedId =
                  created?.data?.id ??
                  created?.id ??
                  created?.data?.data?.id ??
                  created?.data?.data?.attributes?.id ??
                  null

                const fresh = await ItemGroupResource.get()
                const freshList = fresh?.getData?.() ?? []
                if (returnedId != null) {
                  wantSelectGroupIdRef.current = String(returnedId)
                } else {
                  const found = freshList.find((g: ItemGroupResource) =>
                    (g.getAttribute?.("description") ?? "")
                      .toString()
                      .toLowerCase() === name.toLowerCase()
                  )
                  if (found) {
                    const fid = String(found.getApiId?.() ?? found.getAttribute?.("id") ?? "")
                    wantSelectGroupIdRef.current = fid || null
                  }
                }
                setGroups(freshList)

                toast.success("Grupo criado com sucesso!")
                setNewGroupName("")
                setNewGroupOpen(false)
              } catch {
                toast.error("Não foi possível criar o grupo.")
              } finally {
                setCreatingGroup(false)
              }
            }}
          >
            <div className="py-2">
              <Label htmlFor="novo-grupo" className="mb-1 block">
                Nome do grupo
              </Label>
              <Input
                id="novo-grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex.: Fresas, Brocas..."
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                disabled={creatingGroup}
                onClick={() => setNewGroupName("")}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction className="dark: text-white" type="submit" disabled={creatingGroup || !newGroupName.trim()}>
                {creatingGroup ? "Criando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Criar novo fabricante */}
      <AlertDialog open={newManufacturerOpen} onOpenChange={setNewManufacturerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo fabricante</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o nome para cadastrar um novo fabricante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const name = newManufacturerName.trim()
              if (!name) {
                toast.error("Informe o nome do fabricante.")
                return
              }
              try {
                setCreatingManufacturer(true)
                const dto = new ManufacturerDto()
                ;(dto as any).description = name

                const created = await ManufacturerResource.createOrUpdate(dto)
                const returnedId =
                  created?.data?.id ??
                  created?.id ??
                  created?.data?.data?.id ??
                  created?.data?.data?.attributes?.id ??
                  null

                const fresh = await ManufacturerResource.get()
                const freshList = fresh?.getData?.() ?? []

                if (returnedId != null) {
                  wantSelectManufacturerIdRef.current = String(returnedId)
                } else {
                  const found = freshList.find((m: ManufacturerResource) =>
                    (m.getAttribute?.("description") ?? m.getAttribute?.("name") ?? "")
                      .toString()
                      .toLowerCase() === name.toLowerCase()
                  )
                  if (found) {
                    const fid = String(found.getApiId?.() ?? found.getAttribute?.("id") ?? "")
                    wantSelectManufacturerIdRef.current = fid || null
                  }
                }

                setMans(freshList)
                toast.success("Fabricante criado com sucesso!")
                setNewManufacturerName("")
                setNewManufacturerOpen(false)
              } catch {
                toast.error("Não foi possível criar o fabricante.")
              } finally {
                setCreatingManufacturer(false)
              }
            }}
          >
            <div className="py-2">
              <Label htmlFor="novo-fabricante" className="mb-1 block">
                Nome do fabricante
              </Label>
              <Input
                id="novo-fabricante"
                value={newManufacturerName}
                onChange={(e) => setNewManufacturerName(e.target.value)}
                placeholder="Ex.: Sandvik, Iscar, BFT Burzoni..."
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                disabled={creatingManufacturer}
                onClick={() => setNewManufacturerName("")}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="dark: text-white"
                type="submit"
                disabled={creatingManufacturer || !newManufacturerName.trim()}
              >
                {creatingManufacturer ? "Criando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </DrawerContent>
  )
}