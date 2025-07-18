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
}: {
  onSubmit: (dto: ComponentDto) => void
  resource?: ComponentResource
  itemGroups: ItemGroupResource[]
  items: ItemResource[]
  collaborators: CollaboratorResource[]
  machines: MachineResource[]
  pcps: PcpResource[]
  title?: string
  disableEdition?: boolean
}) {
  const itemRelation = resource?.getRelation("item") as ItemResource | undefined
  const groupRelation = itemRelation?.getRelation("itemGroup") as
    | ItemGroupResource
    | undefined
  const collaboratorRelation = resource?.getRelation(
    "collaborator"
  ) as CollaboratorResource | undefined
  const machineRelation = resource?.getRelation("machine") as
    | MachineResource
    | undefined
  const pcpRelation = resource?.getRelation("pcp") as PcpResource | undefined

  const [group, setGroup] = React.useState(
    groupRelation?.getApiId() ? String(groupRelation.getApiId()) : ""
  )
  const [item, setItem] = React.useState(
    itemRelation?.getApiId() ? String(itemRelation.getApiId()) : ""
  )
  const [collaborator, setCollaborator] = React.useState(
    collaboratorRelation?.getApiId() ? String(collaboratorRelation.getApiId()) : ""
  )
  const [machine, setMachine] = React.useState(
    machineRelation?.getApiId() ? String(machineRelation.getApiId()) : ""
  )
  const [pcp, setPcp] = React.useState(
    pcpRelation?.getApiId() ? String(pcpRelation.getApiId()) : ""
  )
  const [unitPrice, setUnitPrice] = React.useState(
    resource?.getAttribute("unitPrice") ?? 0
  )
  const [quantity, setQuantity] = React.useState(
    resource?.getAttribute("quantity") ?? 0
  )

  const filteredItems = React.useMemo(() => {
    return items.filter((i) => {
      const g = i.getRelation("itemGroup") as ItemGroupResource | undefined
      return group && String(g?.getApiId()) === group
    })
  }, [items, group])

  const total = unitPrice * quantity

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const dto = new ComponentDto()
            dto.createFromColoquentResource(resource ?? new ComponentResource())
            dto.type = ComponentTypeEnum.OUT
            dto.unitPrice = unitPrice
            dto.quantity = quantity
            const groupResource = itemGroups.find(
              (g) => String(g.getApiId()) === group
            )
            const itemResource = items.find(
              (i) => String(i.getApiId()) === item
            )
            const collaboratorResource = collaborators.find(
              (c) => String(c.getApiId()) === collaborator
            )
            const machineResource = machines.find(
              (m) => String(m.getApiId()) === machine
            )
            const pcpResource = pcps.find((p) => String(p.getApiId()) === pcp)
            if (groupResource) dto.itemGroupResource = groupResource
            if (itemResource) dto.itemResource = itemResource
            if (collaboratorResource) dto.collaboratorResource = collaboratorResource
            if (machineResource) dto.machineResource = machineResource
            if (pcpResource) dto.pcpResource = pcpResource
            dto.totalPrice = dto.unitPrice * dto.quantity
            onSubmit(dto)
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={group} onValueChange={setGroup} disabled={disableEdition}>
              <SelectTrigger id="grupo" className="w-full">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {itemGroups.map((g) => (
                  <SelectItem key={String(g.getApiId())} value={String(g.getApiId())}>
                    {g.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="ferramenta">Ferramenta</Label>
            <Select value={item} onValueChange={setItem} disabled={disableEdition}>
              <SelectTrigger id="ferramenta" className="w-full">
                <SelectValue placeholder="Selecione uma ferramenta" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((i) => (
                  <SelectItem key={String(i.getApiId())} value={String(i.getApiId())}>
                    {i.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="maquina">Máquina</Label>
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger id="maquina" className="w-full">
                <SelectValue placeholder="Selecione uma máquina" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((m) => (
                  <SelectItem key={String(m.getApiId())} value={String(m.getApiId())}>
                    {m.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="colaborador">Colaborador</Label>
            <Select value={collaborator} onValueChange={setCollaborator}>
              <SelectTrigger id="colaborador" className="w-full">
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map((c) => (
                  <SelectItem key={String(c.getApiId())} value={String(c.getApiId())}>
                    {c.getAttribute("name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="precoUnitario">Preço unitário</Label>
            <Input
              id="precoUnitario"
              name="precoUnitario"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              name="quantidade"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Total</Label>
            <span>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="ordemServico">Ordem de serviço</Label>
            <Select value={pcp} onValueChange={setPcp}>
              <SelectTrigger id="ordemServico" className="w-full">
                <SelectValue placeholder="Selecione uma ordem" />
              </SelectTrigger>
              <SelectContent>
                {pcps.map((p) => (
                  <SelectItem key={String(p.getApiId())} value={String(p.getApiId())}>
                    {p.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DrawerFooter>
            <Button type="submit">Salvar</Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </div>
    </DrawerContent>
  )
}

