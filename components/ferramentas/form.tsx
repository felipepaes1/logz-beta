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

interface FerramentaFormProps {
  onSubmit: (dto: ItemDto) => Promise<unknown>
  resource?: ItemResource
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
  title: string
}

export function FerramentaForm({
  onSubmit,
  resource,
  manufacturers,
  itemGroups,
  title,
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
  const [newGroupOpen, setNewGroupOpen] = React.useState(false)
  const [newGroupName, setNewGroupName] = React.useState("")
  const [creatingGroup, setCreatingGroup] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    nome?: string
    codigo?: string
    itemGroup?: string
    manufacturer?: string
  }>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const nome = data.get("nome")?.toString().trim() || ""
    const codigo = data.get("codigo")?.toString().trim() || ""
    const manufacturerRsc = manufacturers.find(
      (m) => m.getApiId()?.toString() === manufacturerId
    )
    const itemGroupRsc = groups.find(
      (g) => g.getApiId()?.toString() === itemGroupId
    )

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

    try {
      setSubmitting(true)
      await onSubmit(dto)
      form.reset()
      setActive(true)
      form
        .closest("[data-state=open]")
        ?.querySelector("button[data-close]")?.click()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DrawerContent>
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
            <Select value={itemGroupId} onValueChange={setItemGroupId}>
              <SelectTrigger
                className={cn(errors.itemGroup && "border-destructive")}
              >
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem
                    key={g.getApiId()}
                    value={g.getApiId()?.toString() || ""}
                  >
                    {g.getAttribute("description")}
                  </SelectItem>
                ))}
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
                {manufacturers.map((m) => (
                  <SelectItem
                    key={m.getApiId()}
                    value={m.getApiId()?.toString() || ""}
                  >
                    {m.getAttribute("description")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input
              id="fornecedor"
              name="fornecedor"
              defaultValue={resource?.getAttribute("supplier")}
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
            <Button type="submit" disabled={submitting}>
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

                const created = await ItemGroupResource.createOrUpdate(
                  dto
                )
                const returnedId =
                  created?.data?.id ??
                  created?.id ??
                  created?.data?.data?.id ??
                  null

                const createdRsc = new ItemGroupResource()
                if (returnedId) {
                  createdRsc.setApiId(returnedId)
                }
                createdRsc.setAttribute("description", name)

                setGroups((prev) => [...prev, createdRsc])
                setItemGroupId(createdRsc.getApiId()?.toString() || "")

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
              <AlertDialogAction type="submit" disabled={creatingGroup || !newGroupName.trim()}>
                {creatingGroup ? "Criando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </DrawerContent>
  )
}