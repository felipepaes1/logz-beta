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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import * as SelectPrimitive from "@radix-ui/react-select"
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
import api_url from "@/services/api"
import { AttachmentResource } from "@/resources/Attachment/attachment.resourse"
import { IconPencil } from "@tabler/icons-react"

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"]
const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"]

const isBrowser = () => typeof window !== "undefined"

const readCookie = (name: string) => {
  if (!isBrowser()) return ""
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : ""
}

const getAuthToken = () => {
  if (!isBrowser()) return ""
  const direct = localStorage.getItem("@token")
  if (direct && direct !== "undefined") return direct
  const userResponseString = localStorage.getItem("@user_response")
  if (userResponseString) {
    try {
      const userResponse: any = JSON.parse(userResponseString)
      const token = userResponse?.axiosResponse?.data?.data?.attributes?.token
      if (token) return String(token)
    } catch {}
  }
  return readCookie("token") || ""
}

const getTenantId = () => {
  if (!isBrowser()) return ""
  return localStorage.getItem("@tenancy_id") || ""
}

const isAcceptedImage = (file: File) => {
  const name = file.name.toLowerCase()
  const extOk = ACCEPTED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
  const typeOk = ACCEPTED_IMAGE_TYPES.includes(file.type)
  return extOk || typeOk
}

const buildPreviewUrl = (token?: string | null) => {
  if (!token) return null
  const tenantId = getTenantId()
  if (!tenantId) return null
  return `${api_url}/tenants/${tenantId}/attachments/${token}/preview`
}

const extractAttachmentId = (payload: any) =>
  payload?.data?.id ??
  payload?.id ??
  payload?.data?.data?.id ??
  payload?.data?.data?.attributes?.id ??
  payload?.data?.attributes?.id ??
  null

const extractAttachmentToken = (payload: any) =>
  payload?.data?.token ??
  payload?.data?.attributes?.token ??
  payload?.data?.data?.attributes?.token ??
  payload?.token ??
  null

interface FerramentaFormProps {
  onSubmit: (dto: ItemDto) => Promise<unknown>
  resource?: ItemResource
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
  title: string
  onRequestClose?: () => void
  provider?: ProviderResource | null
  onGroupsUpdated?: (groups: ItemGroupResource[]) => void
}

export function FerramentaForm({
  onSubmit,
  resource,
  manufacturers,
  itemGroups,
  title,
  onRequestClose,
  provider: initialProvider,
  onGroupsUpdated
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
  const [editGroupOpen, setEditGroupOpen] = React.useState(false)
  const [editGroupName, setEditGroupName] = React.useState("")
  const [editingGroup, setEditingGroup] = React.useState<ItemGroupResource | null>(null)
  const [updatingGroup, setUpdatingGroup] = React.useState(false)
  const editGroupTargetRef = React.useRef<ItemGroupResource | null>(null)
  const [groupSelectOpen, setGroupSelectOpen] = React.useState(false)
  const loadingGroupsRef = React.useRef(false)
  const mountedRef = React.useRef(true)
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
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlRef = React.useRef<string | null>(null)
  const [avatarDialogOpen, setAvatarDialogOpen] = React.useState(false)
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    nome?: string
    codigo?: string
    itemGroup?: string
    manufacturer?: string
  }>({})
  const selectItemClass =
    "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  const isItemGroupActive = React.useCallback((group: ItemGroupResource | null | undefined) => {
    const deletedAt =
      group?.getAttribute?.("deleted_at") ??
      group?.getAttribute?.("deletedAt")
    return deletedAt === null || deletedAt === undefined || deletedAt === ""
  }, [])
  const activeGroups = React.useMemo(
    () => groups.filter(isItemGroupActive),
    [groups, isItemGroupActive]
  )
  const applyGroupList = React.useCallback(
    (next: ItemGroupResource[] | ((prev: ItemGroupResource[]) => ItemGroupResource[])) => {
      if (!mountedRef.current) return
      setGroups((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next
        onGroupsUpdated?.(resolved)
        return resolved
      })
    },
    [onGroupsUpdated]
  )
  const selectedGroupLabel = React.useMemo(() => {
    if (!itemGroupId) return ""
    const fromList = groups.find((g) => {
      const rawId = g.getApiId?.() ?? g.getAttribute?.("id")
      return String(rawId ?? "") === itemGroupId
    })
    if (fromList) return fromList.getAttribute?.("description") ?? ""
    const relation = resource?.getRelation?.("itemGroup") as ItemGroupResource | undefined
    return relation?.getAttribute?.("description") ?? ""
  }, [groups, itemGroupId, resource])

  const requestEditGroup = React.useCallback((group: ItemGroupResource) => {
    const current = group?.getAttribute?.("description") ?? ""
    setEditingGroup(group)
    setEditGroupName(String(current))
    setEditGroupOpen(true)
  }, [])
  const handleUpdateGroup = React.useCallback(async () => {
    const name = editGroupName.trim()
    if (!editingGroup) {
      toast.error("Selecione um grupo para editar.")
      return
    }
    if (!name) {
      toast.error("Informe o nome do grupo.")
      return
    }
    try {
      if (mountedRef.current) setUpdatingGroup(true)
      const dto = new ItemGroupDto().createFromColoquentResource(editingGroup)
      dto.description = name

      await ItemGroupResource.createOrUpdate(dto)

      const editingId =
        editingGroup.getApiId?.() ??
        editingGroup.getAttribute?.("id") ??
        null
      if (editingId != null) {
        wantSelectGroupIdRef.current = String(editingId)
      }
      applyGroupList((prev) =>
        prev.map((g) => {
          const gid = g.getApiId?.() ?? g.getAttribute?.("id") ?? null
          if (String(gid ?? "") !== String(editingId ?? "")) return g
          g.setAttribute?.("description", name)
          return g
        })
      )
      toast.success("Grupo atualizado com sucesso!")
      if (mountedRef.current) {
        setEditGroupOpen(false)
        setEditingGroup(null)
        setEditGroupName("")
      }

      try {
        const fresh = await ItemGroupResource.get()
        const freshList = fresh?.getData?.() ?? []
        applyGroupList(freshList)
      } catch {
        toast.error("Grupo atualizado, mas nao foi possivel atualizar a lista.")
      }
    } catch {
      toast.error("Nao foi possivel atualizar o grupo.")
    } finally {
      if (mountedRef.current) setUpdatingGroup(false)
    }
  }, [editGroupName, editingGroup, applyGroupList])

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

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
      .catch(() => {toast.error("Não foi possível carregar fornecedores")})
    return () => { mounted = false }
  }, [])

  // Keep provider select in sync when editing with updated provider
  React.useEffect(() => {
    const nextId =
      initialProvider?.getApiId?.()?.toString?.() ??
      resource?.getRelation?.("provider")?.getApiId?.()?.toString?.() ??
      resource?.getAttribute?.("provider_id")?.toString?.() ??
      ""
    setProviderId(nextId)
  }, [resource, initialProvider])

  const resourceId =
    resource?.getApiId?.() ??
    resource?.getAttribute?.("id") ??
    null

  React.useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setAvatarRemoved(false)
    setIsDragOver(false)
  }, [resourceId])

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const handleAvatarFile = React.useCallback((file: File) => {
    if (!isAcceptedImage(file)) {
      toast.error("Formato nao suportado. Use JPG ou PNG.")
      return
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setAvatarFile(file)
    setAvatarPreviewUrl(nextUrl)
    setAvatarRemoved(false)
    setAvatarDialogOpen(false)
  }, [])

  const handleAvatarInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      handleAvatarFile(file)
      e.currentTarget.value = ""
    },
    [handleAvatarFile]
  )

  const handleRemoveAvatar = React.useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setAvatarRemoved(true)
  }, [])

  const resetAvatarState = React.useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setAvatarRemoved(false)
  }, [])

  const existingAvatar =
    resource?.getRelation?.("avatar") ??
    resource?.getAttribute?.("avatar") ??
    null
  const existingAvatarToken =
    existingAvatar?.getToken?.() ??
    existingAvatar?.getAttribute?.("token") ??
    existingAvatar?.attributes?.token ??
    existingAvatar?.token ??
    null
  const existingAvatarId =
    resource?.getAttribute?.("avatar_id") ??
    resource?.getAttribute?.("avatarId") ??
    existingAvatar?.getApiId?.() ??
    existingAvatar?.getAttribute?.("id") ??
    existingAvatar?.id ??
    null
  const resolvedPreviewUrl =
    avatarPreviewUrl ?? (!avatarRemoved ? buildPreviewUrl(existingAvatarToken) : null)
  const hasAvatar =
    Boolean(avatarFile) || (!avatarRemoved && (existingAvatarToken || existingAvatarId))

  async function uploadAvatar(file: File) {
    const token = getAuthToken()
    const tenantId = getTenantId()
    if (!token || !tenantId) {
      throw new Error("missing-auth")
    }
    const form = new FormData()
    form.append("file", file)

    const res = await fetch(
      `${api_url}/tenants/${tenantId}/attachments/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    )

    if (!res.ok) {
      const msg = await res.text().catch(() => "")
      throw new Error(msg || "upload-failed")
    }

    const payload = await res.json().catch(() => ({}))
    const attachmentId = extractAttachmentId(payload)
    if (!attachmentId) {
      throw new Error("upload-no-id")
    }

    return {
      id: attachmentId,
      token: extractAttachmentToken(payload),
    }
  }

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
    const observationRaw = data.get("observation")?.toString() ?? ""
    const observation = observationRaw.trim() || null

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
    const minQuantityValue = Number(data.get("estoqueMinimo") || 0)
    dto.min_quantity = minQuantityValue
    dto.observation = observation
    // Preserve current estoque (quantity) when editing; only initialize on create
    dto.quantity = resource?.getAttribute?.("quantity") ?? 0
    dto.manufacturerResource = manufacturerRsc
    dto.itemGroupResource = itemGroupRsc
    if (providerRsc) {
      const supplierName =
        providerRsc.getAttribute?.("company_name") ??
        providerRsc.getAttribute?.("name") ??
        ""
      dto.providerResource = providerRsc
      dto.supplier = supplierName
      dto.provider_id = Number(providerRsc.getApiId?.() ?? NaN) || undefined
    } else {
      dto.providerResource = undefined
      dto.supplier = undefined
      dto.provider_id = undefined
    }

    try {
      setSubmitting(true)
      let uploadedAttachment: { id: any; token?: string | null } | null = null
      if (avatarFile) {
        try {
          uploadedAttachment = await uploadAvatar(avatarFile)
        } catch {
          toast.error("Nao foi possivel enviar a foto.")
          return
        }
      }

      const avatarIdToSave = avatarFile
        ? uploadedAttachment?.id ?? null
        : avatarRemoved
          ? null
          : existingAvatarId ?? null

      dto.avatar_id = avatarIdToSave ?? null

      if (resource) {
        const updatedResource = resource.clone?.() ?? resource
        updatedResource.setAttribute?.("name", nome)
        updatedResource.setAttribute?.("code", codigo)
        updatedResource.setAttribute?.("active", active)
        updatedResource.setAttribute?.("description", nome)
        updatedResource.setAttribute?.("min_quantity", dto.min_quantity)
        updatedResource.setAttribute?.("observation", dto.observation)
        updatedResource.setAttribute?.("quantity", dto.quantity)
        updatedResource.setAttribute?.("avatar_id", avatarIdToSave ?? null)
        updatedResource.setRelation?.("manufacturer", manufacturerRsc ?? null)
        updatedResource.setRelation?.("itemGroup", itemGroupRsc ?? null)
        if (providerRsc) {
          updatedResource.setRelation?.("provider", providerRsc)
          updatedResource.setAttribute?.("supplier", dto.supplier ?? "")
          updatedResource.setAttribute?.("provider_id", dto.provider_id ?? null)
        } else {
          updatedResource.setRelation?.("provider", null)
          updatedResource.setAttribute?.("supplier", null)
          updatedResource.setAttribute?.("provider_id", null)
        }

        if (avatarRemoved) {
          updatedResource.setRelation?.("avatar", null)
        } else if (uploadedAttachment) {
          if (uploadedAttachment.token) {
            const attachment = new AttachmentResource()
            attachment.setAttribute?.("id", uploadedAttachment.id)
            attachment.setAttribute?.("token", uploadedAttachment.token)
            updatedResource.setRelation?.("avatar", attachment)
          } else {
            updatedResource.setRelation?.("avatar", null)
          }
        }

        dto.itemResource = updatedResource
      }

      await onSubmit(dto)

      if (!resource) {
        form.reset()
        setActive(true)
        setProviderId("")
        resetAvatarState()
        if (typeof window !== "undefined") {
          window.location.reload()
        }
        return
      }

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
          {/* Foto */}
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border">
              {resolvedPreviewUrl ? (
                <AvatarImage src={resolvedPreviewUrl} alt="Foto da ferramenta" />
              ) : (
                <AvatarFallback className="text-[10px] text-muted-foreground">
                  Sem foto
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAvatarDialogOpen(true)}
                disabled={submitting}
              >
                {hasAvatar ? "Substituir foto" : "Adicionar foto"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={!hasAvatar || submitting}
              >
                Remover foto
              </Button>
              <span className="text-xs text-muted-foreground">JPG ou PNG</span>
            </div>
          </div>

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
            <Select
              value={itemGroupId || undefined}
              onValueChange={setItemGroupId}
              open={groupSelectOpen}
              onOpenChange={setGroupSelectOpen}
            >
              <SelectTrigger
                className={cn(errors.itemGroup && "border-destructive")}
              >
                <span
                  className={cn(
                    "block flex-1 truncate text-left",
                    !selectedGroupLabel && "text-muted-foreground"
                  )}
                >
                  {selectedGroupLabel || "Selecione um grupo"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {activeGroups.length === 0 ? (
                  <SelectItem value="__no_groups__" disabled>
                    Nenhum grupo ativo disponivel
                  </SelectItem>
                ) : (
                  activeGroups.map((g, idx) => {
                    const rawId = g.getApiId?.() ?? g.getAttribute?.("id") ?? null
                    const safeId = String(rawId ?? `tmp-${idx}`)
                    const label = g.getAttribute?.("description") ?? `Grupo ${idx + 1}`
                    return (
                      <SelectPrimitive.Item
                        key={safeId}
                        value={safeId}
                        className={cn(selectItemClass, "pr-12")}
                        onPointerDown={(event) => {
                          const target = event.target as HTMLElement | null
                          const isEditTrigger = !!target?.closest?.("[data-edit-trigger]")
                          if (!isEditTrigger) return
                          event.preventDefault()
                          event.stopPropagation()
                          editGroupTargetRef.current = g
                          setGroupSelectOpen(false)
                          requestEditGroup(g)
                          setTimeout(() => {
                            editGroupTargetRef.current = null
                          }, 0)
                        }}
                        onSelect={(event) => {
                          if (editGroupTargetRef.current === g) {
                            event.preventDefault()
                            editGroupTargetRef.current = null
                          }
                        }}
                      >
                        <SelectPrimitive.ItemText asChild>
                          <span className="truncate">{label}</span>
                        </SelectPrimitive.ItemText>
                        <span
                          data-edit-trigger
                          className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Editar grupo ${label}`}
                        >
                          <IconPencil size={18} />
                        </span>
                      </SelectPrimitive.Item>
                    )
                  })
                )}
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

          {/* Observação */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              id="observation"
              name="observation"
              defaultValue={resource?.getAttribute("observation") ?? ""}
              placeholder="Observação (opcional)"
            />
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
      <AlertDialog
        open={avatarDialogOpen}
        onOpenChange={(open) => {
          setAvatarDialogOpen(open)
          if (!open) setIsDragOver(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selecionar foto</AlertDialogTitle>
            <AlertDialogDescription>
              Arraste e solte a imagem ou selecione um arquivo do computador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div
            className={cn(
              "rounded-md border border-dashed p-4 text-center text-sm transition-colors",
              isDragOver && "border-primary bg-primary/5"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "copy"
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleAvatarFile(file)
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span>Arraste e solte a imagem aqui</span>
              <span className="text-xs text-muted-foreground">JPG, JPEG ou PNG</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar arquivo
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarInputChange}
          />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                if (mountedRef.current) setCreatingGroup(true)

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
                applyGroupList(freshList)

                toast.success("Grupo criado com sucesso!")
                if (mountedRef.current) {
                  setNewGroupName("")
                  setNewGroupOpen(false)
                }
              } catch {
                toast.error("Não foi possível criar o grupo.")
              } finally {
                if (mountedRef.current) setCreatingGroup(false)
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

      {/* AlertDialog: Editar grupo */}
      <AlertDialog
        open={editGroupOpen}
        onOpenChange={(open) => {
          setEditGroupOpen(open)
          if (!open) {
            setEditingGroup(null)
            setEditGroupName("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Atualize o nome do grupo selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdateGroup()
            }}
          >
            <div className="py-2">
              <Label htmlFor="editar-grupo" className="mb-1 block">
                Nome do grupo
              </Label>
              <Input
                id="editar-grupo"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Ex.: Fresas, Brocas..."
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                disabled={updatingGroup}
                onClick={() => {
                  setEditGroupName("")
                  setEditingGroup(null)
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                className="dark: text-white"
                type="submit"
                disabled={updatingGroup || !editGroupName.trim()}
              >
                {updatingGroup ? "Salvando..." : "Confirmar"}
              </Button>
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


