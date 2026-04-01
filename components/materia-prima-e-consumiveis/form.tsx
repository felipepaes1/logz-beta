"use client"

import * as React from "react"
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  INVENTORY_UNIT_TYPES,
  getInventoryUnitDefinition,
  normalizeInventoryUnitType,
} from "@/lib/inventory-unit-types"
import { cn } from "@/lib/utils"
import type {
  InventoryItemDto,
  InventoryItemParsed,
} from "@/resources/InventoryItem/inventory-item.dto"

const categoryOptions = [
  { value: "consumable", label: "Consumível" },
  { value: "raw_material", label: "Matéria-prima" },
]

const unitTypeOptions = Object.entries(INVENTORY_UNIT_TYPES).map(([value, config]) => ({
  value,
  label: config.label,
}))

interface MateriaPrimaConsumivelFormProps {
  onSubmit: (dto: InventoryItemDto) => Promise<unknown>
  resource?: InventoryItemParsed
  title: string
  onRequestClose?: () => void
}

interface FormErrors {
  name?: string
  code?: string
  category?: string
  unitType?: string
  minQuantity?: string
}

function toOptionalString(value: FormDataEntryValue | null): string | null {
  const normalized = value?.toString().trim() ?? ""
  return normalized.length ? normalized : null
}

function toOptionalNumber(value: FormDataEntryValue | null): number | null {
  const text = value?.toString().trim() ?? ""
  if (!text.length) return null
  const parsed = Number(text.replace(",", "."))
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export function MateriaPrimaConsumivelForm({
  onSubmit,
  resource,
  title,
  onRequestClose,
}: MateriaPrimaConsumivelFormProps) {
  const initialUnitType = React.useMemo(
    () => normalizeInventoryUnitType(resource?.unit_type) ?? "",
    [resource?.unit_type]
  )

  const [active, setActive] = React.useState(resource?.active ?? true)
  const [preOrdered, setPreOrdered] = React.useState(
    Boolean(resource?.pre_ordered ?? false)
  )
  const [category, setCategory] = React.useState(resource?.category ?? "")
  const [unitType, setUnitType] = React.useState(initialUnitType)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<FormErrors>({})

  const unitDefinition = React.useMemo(() => getInventoryUnitDefinition(unitType), [unitType])

  React.useEffect(() => {
    setActive(resource?.active ?? true)
    setPreOrdered(Boolean(resource?.pre_ordered ?? false))
    setCategory(resource?.category ?? "")
    setUnitType(initialUnitType)
  }, [initialUnitType, resource])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const name = formData.get("name")?.toString().trim() ?? ""
    const code = formData.get("code")?.toString().trim() ?? ""
    const minQuantityText = formData.get("min_quantity")?.toString().trim() ?? ""
    const minQuantity = toOptionalNumber(formData.get("min_quantity"))

    const nextErrors: FormErrors = {}
    if (!name) nextErrors.name = "Campo obrigatório"
    if (!code) nextErrors.code = "Campo obrigatório"
    if (!category) nextErrors.category = "Campo obrigatório"
    if (!unitDefinition) nextErrors.unitType = "Campo obrigatório"
    if (minQuantityText.length) {
      if (minQuantity === null || minQuantity < 0 || !Number.isInteger(minQuantity)) {
        nextErrors.minQuantity = "Use um número inteiro maior ou igual a zero"
      }
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setErrors({})

    const dto: InventoryItemDto = {
      id: resource?.id ?? null,
      tenant_id: resource?.tenant_id ?? null,
      active,
      name,
      code,
      external_item_id_useall: toOptionalString(formData.get("external_item_id_useall")),
      description: toOptionalString(formData.get("description")),
      category,
      unit_type: unitDefinition.type,
      unit: unitDefinition.unit,
      min_quantity: minQuantity,
      quantity: toOptionalNumber(formData.get("quantity")),
      pre_ordered: preOrdered,
      observation: toOptionalString(formData.get("observation")),
    }

    try {
      setSubmitting(true)
      await onSubmit(dto)
      onRequestClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DrawerContent className="!w-[520px] !max-w-[100vw] rounded-none ml-auto h-full flex flex-col px-6">
      <DrawerHeader className="px-0">
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto pr-1">
        <form className="grid gap-4 pb-6" onSubmit={handleSubmit}>
          <div className="grid gap-1">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={resource?.name ?? ""}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name ? (
              <span className="text-xs text-destructive">{errors.name}</span>
            ) : null}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              name="code"
              defaultValue={resource?.code ?? ""}
              className={cn(errors.code && "border-destructive")}
            />
            {errors.code ? (
              <span className="text-xs text-destructive">{errors.code}</span>
            ) : null}
          </div>

          <div className="grid gap-1">
            <Label>Categoria</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger className={cn(errors.category && "border-destructive")}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category ? (
              <span className="text-xs text-destructive">{errors.category}</span>
            ) : null}
          </div>

          <div className="grid gap-1">
            <Label>Tipo de unidade</Label>
            <Select
              value={unitType || undefined}
              onValueChange={(value) => setUnitType(normalizeInventoryUnitType(value) ?? "")}
            >
              <SelectTrigger className={cn(errors.unitType && "border-destructive")}>
                <SelectValue placeholder="Selecione o tipo de unidade" />
              </SelectTrigger>
              <SelectContent>
                {unitTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitType ? (
              <span className="text-xs text-destructive">{errors.unitType}</span>
            ) : null}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              name="unit"
              value={unitDefinition?.unit ?? ""}
              placeholder="Preenchida automaticamente"
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="min_quantity">Estoque mínimo</Label>
            <Input
              id="min_quantity"
              name="min_quantity"
              type="number"
              min="0"
              step="1"
              defaultValue={resource?.min_quantity ?? ""}
              className={cn(errors.minQuantity && "border-destructive")}
            />
            {errors.minQuantity ? (
              <span className="text-xs text-destructive">{errors.minQuantity}</span>
            ) : null}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={resource?.description ?? ""}
              placeholder="Descrição opcional do item"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="observation">Observacao</Label>
            <Textarea
              id="observation"
              name="observation"
              defaultValue={resource?.observation ?? ""}
              placeholder="Observação opcional do item"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="active">Status</Label>
            <Switch id="active" checked={active} onCheckedChange={setActive} />
          </div>

          <DrawerFooter className="px-0">
            <Button type="submit" disabled={submitting} className="dark:text-white">
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => onRequestClose?.()}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </DrawerFooter>
        </form>
      </div>
    </DrawerContent>
  )
}
