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
  SelectValue,
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

  const [group, setGroup] = React.useState(groupRelation?.getApiId()?.toString() ?? "")
  const [item, setItem] = React.useState(itemRelation?.getApiId()?.toString() ?? "")
  const [collaborator, setCollaborator] = React.useState(
    collaboratorRelation?.getApiId()?.toString() ?? ""
  )
  const [machine, setMachine] = React.useState(
    machineRelation?.getApiId()?.toString() ?? ""
  )
  const [pcp, setPcp] = React.useState(pcpRelation?.getApiId()?.toString() ?? "")

  const [quantity, setQuantity] = React.useState<string>(
    String(resource?.getAttribute("quantity") ?? 0)
  )
  const quantityNumber = React.useMemo(() => Number(quantity) || 0, [quantity])

  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    group?: string
    item?: string
    collaborator?: string
    machine?: string
    unitPrice?: string
    quantity?: string
  }>({})

  const selectedItem = React.useMemo(
    () => (item ? items.find((i) => i.getApiId()?.toString() === item) : undefined),
    [items, item]
  )

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
 
  const filteredItems = React.useMemo(
    () =>
      items.filter((i) => {
        const g = i.getRelation("itemGroup") as ItemGroupResource | undefined
        return group && g?.getApiId()?.toString() === group
      }),
    [items, group]
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    const formEl = e.currentTarget as HTMLFormElement

    const newErrors: typeof errors = {}
    if (!group) newErrors.group = "Campo obrigatório"
    if (!item) newErrors.item = "Campo obrigatório"
    if (!collaborator) newErrors.collaborator = "Campo obrigatório"
    if (!machine) newErrors.machine = "Campo obrigatório"
    if (quantityNumber <= 0) newErrors.quantity = "Informe um valor"
    if (
      !newErrors.quantity &&
      selectedItem &&
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
    dto.itemGroupResource = itemGroups.find(
      (g) => g.getApiId()?.toString() === group
    )!
    dto.itemResource = items.find((i) => i.getApiId()?.toString() === item)!
    dto.collaboratorResource = collaborators.find(
      (c) => c.getApiId()?.toString() === collaborator
    )!
    dto.machineResource = machines.find(
      (m) => m.getApiId()?.toString() === machine
    )!

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
            <Label>Grupo</Label>
            <Select
              value={group}
              onValueChange={setGroup}
              disabled={disableEdition}
            >
              <SelectTrigger className={cn(errors.group && "border-destructive")}>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {itemGroups.map((g) => (
                  <SelectItem key={g.getApiId()} value={g.getApiId()!.toString()}>
                    {g.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.group && (
              <span className="text-destructive text-xs">{errors.group}</span>
            )}
          </div>

          {/* item */}
          <div className="flex flex-col gap-1">
            <Label>Ferramenta</Label>
            <Select
              value={item}
              onValueChange={setItem}
              disabled={disableEdition}
            >
              <SelectTrigger className={cn(errors.item && "border-destructive")}>
                <SelectValue placeholder="Selecione uma ferramenta" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((i) => (
                  <SelectItem key={i.getApiId()} value={i.getApiId()!.toString()}>
                    {i.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.item && (
              <span className="text-destructive text-xs">{errors.item}</span>
            )}
          </div>

          {/* máquina */}
          <div className="flex flex-col gap-1">
            <Label>Máquina</Label>
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger
                className={cn(errors.machine && "border-destructive")}
              >
                <SelectValue placeholder="Selecione uma máquina" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((m) => (
                  <SelectItem key={m.getApiId()} value={m.getApiId()!.toString()}>
                    {m.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.machine && (
              <span className="text-destructive text-xs">{errors.machine}</span>
            )}
          </div>

          {/* colaborador */}
          <div className="flex flex-col gap-1">
            <Label>Colaborador</Label>
            <Select value={collaborator} onValueChange={setCollaborator}>
              <SelectTrigger
                className={cn(errors.collaborator && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map((c) => (
                  <SelectItem
                    key={c.getApiId()}
                    value={c.getApiId()!.toString()}
                  >
                    {c.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.collaborator && (
              <span className="text-destructive text-xs">
                {errors.collaborator}
              </span>
            )}
          </div>

          {/* preço e quantidade */}
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

          {/* ordem serviço opcional */}
          <div className="flex flex-col gap-3">
            <Label>Ordem de serviço (opcional)</Label>
            <Select value={pcp} onValueChange={setPcp}>
              <SelectTrigger id="ordemServico" className="w-full">
                <SelectValue placeholder="Selecione uma ordem" />
              </SelectTrigger>
              <SelectContent>
                {pcps.map((p) => (
                  <SelectItem key={p.getApiId()} value={p.getApiId()!.toString()}>
                    {p.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={submitting}>
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
