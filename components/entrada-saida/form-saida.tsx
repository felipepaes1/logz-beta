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
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { ComponentResource } from "@/resources/Component/component.resource"
import { ComponentDto } from "@/resources/Component/component.dto"
import { ComponentTypeEnum } from "@/resources/Component/component.enum"
import { ItemResource } from "@/resources/Item/item.resource"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { PcpResource } from "@/resources/Pcp/pcp.resource"
import { cn } from "@/lib/utils"
import {
  SelectDisplay,
  SelectSearchInput,
  formatItemLabel,
  isResourceActive,
  normalizeSearchValue,
} from "./form-utils"

interface Props {
  onSubmit: (dto: ComponentDto) => Promise<unknown>
  resource?: ComponentResource
  itemGroups: ItemGroupResource[]
  items: ItemResource[]
  collaborators: CollaboratorResource[]
  machines: MachineResource[]
  pcps: PcpResource[]
  title?: string
  disableEdition?: boolean
  onRequestClose?: () => void
}

export function SaidaForm({
  onSubmit,
  resource,
  itemGroups,
  items,
  collaborators,
  machines,
  pcps,
  title = "Cadastrar Saída",
  disableEdition,
  onRequestClose
}: Props): React.ReactElement {
 
  const itemRelation = resource?.getRelation("item") as ItemResource | undefined
  const groupRelation = itemRelation?.getRelation("itemGroup") as
    | ItemGroupResource
    | undefined
  const collaboratorRelation = resource?.getRelation(
    "collaborator"
  ) as CollaboratorResource | undefined
  const machineRelation = resource?.getRelation(
    "machine"
  ) as MachineResource | undefined
  const pcpRelation = resource?.getRelation("pcp") as PcpResource | undefined

  const [group, setGroup] = React.useState<string>("")
  const [item, setItem] = React.useState<string>("")
  const [collaborator, setCollaborator] = React.useState<string>("")
  const [machine, setMachine] = React.useState<string>("")
  const [pcp, setPcp] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState<string>("0")
  const quantityNumber = React.useMemo(() => Number(quantity) || 0, [quantity])

  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    item?: string
    collaborator?: string
    machine?: string
    unitPrice?: string
    quantity?: string
  }>({})
  const [groupSearch, setGroupSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [collaboratorSearch, setCollaboratorSearch] = React.useState("")
  const [machineSearch, setMachineSearch] = React.useState("")
  const [pcpSearch, setPcpSearch] = React.useState("")

  const selectedItem = React.useMemo(
    () => (item ? items.find((i) => i.getApiId()?.toString() === item) : undefined),
    [items, item]
  )
  const activeItemGroups = React.useMemo(
    () => itemGroups.filter(isResourceActive),
    [itemGroups]
  )
  const activeItems = React.useMemo(
    () => items.filter(isResourceActive),
    [items]
  )
  const selectableItems = React.useMemo(() => {
    if (!group) return activeItems
    return activeItems.filter((i) => {
      const g = i.getRelation("itemGroup") as ItemGroupResource | undefined
      return g?.getApiId()?.toString() === group
    })
  }, [activeItems, group])
  const activeCollaborators = React.useMemo(
    () => collaborators.filter(isResourceActive),
    [collaborators]
  )
  const activeMachines = React.useMemo(
    () => machines.filter(isResourceActive),
    [machines]
  )
  const selectedGroupResource = React.useMemo(
    () => (group ? itemGroups.find((g) => g.getApiId()?.toString() === group) : undefined),
    [itemGroups, group]
  )
  const selectedCollaboratorResource = React.useMemo(
    () =>
      (collaborator
        ? collaborators.find((c) => c.getApiId()?.toString() === collaborator)
        : undefined),
    [collaborators, collaborator]
  )
  const selectedMachineResource = React.useMemo(
    () => (machine ? machines.find((m) => m.getApiId()?.toString() === machine) : undefined),
    [machines, machine]
  )
  const selectedPcpResource = React.useMemo(
    () => (pcp ? pcps.find((p) => p.getApiId()?.toString() === pcp) : undefined),
    [pcps, pcp]
  )
  const normalizedGroupSearch = React.useMemo(
    () => normalizeSearchValue(groupSearch),
    [groupSearch]
  )
  const normalizedItemSearch = React.useMemo(
    () => normalizeSearchValue(itemSearch),
    [itemSearch]
  )
  const normalizedCollaboratorSearch = React.useMemo(
    () => normalizeSearchValue(collaboratorSearch),
    [collaboratorSearch]
  )
  const normalizedMachineSearch = React.useMemo(
    () => normalizeSearchValue(machineSearch),
    [machineSearch]
  )
  const normalizedPcpSearch = React.useMemo(
    () => normalizeSearchValue(pcpSearch),
    [pcpSearch]
  )
  const groupOptions = React.useMemo(() => {
    if (!normalizedGroupSearch) return activeItemGroups
    return activeItemGroups.filter((g) => {
      const description = g.getAttribute?.("description") ?? ""
      return normalizeSearchValue(String(description)).includes(normalizedGroupSearch)
    })
  }, [activeItemGroups, normalizedGroupSearch])
  const filteredSelectableItems = React.useMemo(() => {
    if (!normalizedItemSearch) return selectableItems
    return selectableItems.filter((i) =>
      normalizeSearchValue(formatItemLabel(i) || "").includes(normalizedItemSearch)
    )
  }, [normalizedItemSearch, selectableItems])
  const collaboratorOptions = React.useMemo(() => {
    if (!normalizedCollaboratorSearch) return activeCollaborators
    return activeCollaborators.filter((c) => {
      const name = c.getAttribute?.("name") ?? ""
      return normalizeSearchValue(String(name)).includes(normalizedCollaboratorSearch)
    })
  }, [activeCollaborators, normalizedCollaboratorSearch])
  const machineOptions = React.useMemo(() => {
    if (!normalizedMachineSearch) return activeMachines
    return activeMachines.filter((m) => {
      const description = m.getAttribute?.("description") ?? ""
      return normalizeSearchValue(String(description)).includes(normalizedMachineSearch)
    })
  }, [activeMachines, normalizedMachineSearch])
  const pcpOptions = React.useMemo(() => {
    if (!normalizedPcpSearch) return pcps
    return pcps.filter((p) => {
      const description = p.getAttribute?.("description") ?? ""
      return normalizeSearchValue(String(description)).includes(normalizedPcpSearch)
    })
  }, [normalizedPcpSearch, pcps])

  const availableQty = React.useMemo<number | null>(() => {
    if (!selectedItem) return null
    const candidates = ["available_quantity", "available", "stock", "quantity"] as const
    for (const key of candidates) {
      const v = Number(selectedItem.getAttribute?.(key))
      if (Number.isFinite(v)) return Math.max(0, v)
    }
    return null
  }, [selectedItem])
  
  const nf = React.useMemo(() => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }), [])
  const groupLabel =
    selectedGroupResource?.getAttribute?.("description") ??
    groupRelation?.getAttribute?.("description") ??
    ""
  const itemLabel = formatItemLabel(selectedItem ?? itemRelation)
  const collaboratorLabel =
    selectedCollaboratorResource?.getAttribute?.("name") ??
    collaboratorRelation?.getAttribute?.("name") ??
    ""
  const machineLabel =
    selectedMachineResource?.getAttribute?.("description") ??
    machineRelation?.getAttribute?.("description") ??
    ""
  const pcpLabel =
    selectedPcpResource?.getAttribute?.("description") ??
    pcpRelation?.getAttribute?.("description") ??
    ""

  React.useEffect(() => {
    if (!group) return
    if (
      item &&
      !selectableItems.some((i) => i.getApiId()?.toString() === item)
    ) {
      setItem("")
    }
  }, [group, item, selectableItems])

  React.useEffect(() => {
    setGroup(groupRelation?.getApiId()?.toString() ?? "")
    setItem(itemRelation?.getApiId()?.toString() ?? "")
    setCollaborator(collaboratorRelation?.getApiId()?.toString() ?? "")
    setMachine(machineRelation?.getApiId()?.toString() ?? "")
    setPcp(pcpRelation?.getApiId()?.toString() ?? "")
    setQuantity(String(resource?.getAttribute?.("quantity") ?? 0))
  }, [resource])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    const formEl = e.currentTarget as HTMLFormElement

    const newErrors: typeof errors = {}
    const itemResource = selectedItem
    const collaboratorResource = selectedCollaboratorResource
    const machineResource = selectedMachineResource
    if (!itemResource) newErrors.item = "Campo obrigatório"
    if (!collaborator || !collaboratorResource)
      newErrors.collaborator = "Campo obrigatório"
    if (!machine || !machineResource) newErrors.machine = "Campo obrigatório"
    if (quantityNumber <= 0) newErrors.quantity = "Informe um valor"
    if (
      !newErrors.quantity &&
      itemResource &&
      typeof availableQty === "number" &&
      quantityNumber > availableQty
    ) {
      newErrors.quantity = `Quantidade maior que disponível (${nf.format(availableQty)})`
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const dto = new ComponentDto()
    dto.createFromColoquentResource(resource ?? new ComponentResource())
    dto.type = ComponentTypeEnum.OUT
    dto.quantity = quantityNumber
    if (itemResource) {
      dto.itemResource = itemResource
      const manualGroupResource = group
        ? itemGroups.find((g) => g.getApiId()?.toString() === group)
        : undefined
      const relatedGroup = itemResource.getRelation?.("itemGroup") as
        | ItemGroupResource
        | undefined
      const attrGroupId = itemResource
        .getAttribute?.("item_group_id")
        ?.toString?.()
      const fallbackGroup =
        attrGroupId
          ? itemGroups.find(
              (g) => g.getApiId()?.toString() === attrGroupId
            )
          : undefined
      const resolvedGroup =
        manualGroupResource ?? relatedGroup ?? fallbackGroup
      if (resolvedGroup) {
        dto.itemGroupResource = resolvedGroup
      }
    }
    if (collaboratorResource) {
      dto.collaboratorResource = collaboratorResource
    }
    if (machineResource) {
      dto.machineResource = machineResource
    }
    try {
      setSubmitting(true)
      await onSubmit(dto)

      try {
        if (formEl && formEl.isConnected) formEl.reset()
      } catch {}
      setGroup("")
      setItem("")
      setCollaborator("")
      setMachine("")
      setPcp("")
      setQuantity("0")
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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} aria-busy={submitting}>
          {/* grupo */}
          <div className="flex flex-col gap-1">
            <Label>Grupo (opcional)</Label>
            <Select
              value={group}
              onValueChange={setGroup}
              disabled={disableEdition}
              onOpenChange={(open) => {
                if (!open) setGroupSearch("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectDisplay
                  label={groupLabel}
                  placeholder="Selecione um grupo (opcional)"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={groupSearch}
                  onChange={setGroupSearch}
                  placeholder="Buscar grupo..."
                />
                {groupOptions.length === 0 ? (
                  <SelectItem value="__no_group__" disabled>
                    {activeItemGroups.length === 0
                      ? "Nenhum grupo ativo disponivel"
                      : "Nenhum grupo encontrado"}
                  </SelectItem>
                ) : (
                  groupOptions.map((g) => (
                    <SelectItem
                      key={g.getApiId()}
                      value={g.getApiId()!.toString()}
                    >
                      {g.getAttribute("description")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* item */}
          <div className="flex flex-col gap-1">
            <Label>Ferramenta</Label>
            <Select
              value={item}
              onValueChange={setItem}
              disabled={disableEdition}
              onOpenChange={(open) => {
                if (!open) setItemSearch("")
              }}
            >
              <SelectTrigger
                className={cn("w-full", errors.item && "border-destructive")}
              >
                <SelectDisplay
                  label={itemLabel}
                  placeholder="Selecione uma ferramenta"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={itemSearch}
                  onChange={setItemSearch}
                  placeholder="Buscar ferramenta..."
                />
                {filteredSelectableItems.length === 0 ? (
                  <SelectItem value="__empty_items__" disabled>
                    {selectableItems.length === 0
                      ? group
                        ? "Nenhuma ferramenta ativa neste grupo"
                        : "Nenhuma ferramenta ativa disponivel"
                      : "Nenhuma ferramenta encontrada"}
                  </SelectItem>
                ) : (
                  filteredSelectableItems.map((i) => {
                    const label =
                      formatItemLabel(i) ||
                      i.getAttribute("name") ||
                      i.getAttribute("code") ||
                      "Sem identificacao"
                    return (
                      <SelectItem
                        key={i.getApiId()}
                        value={i.getApiId()!.toString()}
                      >
                        {label}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
            {errors.item && (
              <span className="text-destructive text-xs">{errors.item}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Máquina</Label>
            <Select
              value={machine}
              onValueChange={setMachine}
              onOpenChange={(open) => {
                if (!open) setMachineSearch("")
              }}
            >
              <SelectTrigger
                className={cn("w-full", errors.machine && "border-destructive")}
              >
                <SelectDisplay
                  label={machineLabel}
                  placeholder="Selecione uma máquina"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={machineSearch}
                  onChange={setMachineSearch}
                  placeholder="Buscar máquina..."
                />
                {machineOptions.length === 0 ? (
                  <SelectItem value="__no_machine__" disabled>
                    {activeMachines.length === 0
                      ? "Nenhuma máquina ativa disponivel"
                      : "Nenhuma máquina encontrada"}
                  </SelectItem>
                ) : (
                  machineOptions.map((m) => (
                    <SelectItem
                      key={m.getApiId()}
                      value={m.getApiId()!.toString()}
                    >
                      {m.getAttribute("description")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.machine && (
              <span className="text-destructive text-xs">{errors.machine}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Colaborador</Label>
            <Select
              value={collaborator}
              onValueChange={setCollaborator}
              onOpenChange={(open) => {
                if (!open) setCollaboratorSearch("")
              }}
            >
              <SelectTrigger
                className={cn("w-full", errors.collaborator && "border-destructive")}
              >
                <SelectDisplay
                  label={collaboratorLabel}
                  placeholder="Selecione um colaborador"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={collaboratorSearch}
                  onChange={setCollaboratorSearch}
                  placeholder="Buscar colaborador..."
                />
                {collaboratorOptions.length === 0 ? (
                  <SelectItem value="__no_collaborators__" disabled>
                    {activeCollaborators.length === 0
                      ? "Nenhum colaborador ativo disponivel"
                      : "Nenhum colaborador encontrado"}
                  </SelectItem>
                ) : (
                  collaboratorOptions.map((c) => (
                    <SelectItem
                      key={c.getApiId()}
                      value={c.getApiId()!.toString()}
                    >
                      {c.getAttribute("name")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.collaborator && (
              <span className="text-destructive text-xs">
                {errors.collaborator}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Quantidade</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                aria-label="Quantidade"
                value={quantity}
                disabled={!!disableEdition}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "")
                  v = v.replace(/^0+(?=\d)/, "")
                  if (v === "") v = "0"
                  setQuantity(v)
                }}
                onWheel={(e) => {
                  (e.target as HTMLElement).blur()
                  setTimeout(() => (e.target as HTMLElement).focus(), 0)
                }}
                className={cn(errors.quantity && "border-destructive")}
              />
              {disableEdition && (
                <div className="text-xs text-muted-foreground mt-1">
                  Para alterar a quantidade de uma saída, exclua o registro e crie uma nova saída.
                </div>
              )}
              {item && typeof availableQty === "number" && (
                <div className="text-xs text-muted-foreground mt-1" role="status" aria-live="polite">
                  Quantidade disponível:{" "}
                  <span className={cn(quantityNumber > availableQty && "text-destructive font-medium")}>
                    {nf.format(availableQty)}
                  </span>
                </div>
              )}
              {errors.quantity && (
                <span className="text-destructive text-xs">
                  {errors.quantity}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Ordem de serviço</Label>
            <Select
              value={pcp}
              onValueChange={setPcp}
              onOpenChange={(open) => {
                if (!open) setPcpSearch("")
              }}
            >
              <SelectTrigger id="ordemServico" className="w-full">
                <SelectDisplay
                  label={pcpLabel}
                  placeholder="Selecione uma ordem"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectSearchInput
                  value={pcpSearch}
                  onChange={setPcpSearch}
                  placeholder="Buscar ordem..."
                />
                {pcpOptions.length === 0 ? (
                  <SelectItem value="__no_pcp__" disabled>
                    {pcps.length === 0
                      ? "Nenhuma ordem cadastrada"
                      : "Nenhuma ordem encontrada"}
                  </SelectItem>
                ) : (
                  pcpOptions.map((p) => (
                    <SelectItem key={p.getApiId()} value={p.getApiId()!.toString()}>
                      {p.getAttribute("description")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={submitting} className="dark:text-white">
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button" data-close>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </div>
    </DrawerContent>
  )
}
