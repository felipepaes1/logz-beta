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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Fornecedor } from "./types"
import { ProviderDto } from "@/resources/Provider/provider.dto"
import type { ProviderResource } from "@/resources/Provider/provider.resource"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FornecedorFormProps {
  title: string
  onSubmit: (dto: ProviderDto) => Promise<void> | void
  initialValues?: Partial<Fornecedor>
  resource?: ProviderResource
}

export function FornecedorForm({ onSubmit, initialValues, resource, title }: FornecedorFormProps) {
  const [phone, setPhone] = React.useState(initialValues?.telefone || "")
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ empresa?: string; vendedor?: string }>({})

  React.useEffect(() => {
    setPhone(initialValues?.telefone || "")
  }, [initialValues])

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
          [a && `(${a}`, a && b ? `) ${b}` : b, c && `-${c}`]
            .filter(Boolean)
            .join("")
        )
    }
    return digits
      .replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_, a, b, c) =>
        [a && `(${a}`, a && b ? `) ${b}` : b, c && `-${c}`]
          .filter(Boolean)
          .join("")
      )
  }

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const form = e.currentTarget
            const data = new FormData(form)

            const empresa = String(data.get("empresa") || "")
            const vendedor = String(data.get("vendedor") || "")

            const newErrors: { empresa?: string; vendedor?: string } = {}
            if (!empresa.trim()) newErrors.empresa = "Campo obrigatório"
            if (!vendedor.trim()) newErrors.vendedor = "Campo obrigatório"

            if (Object.keys(newErrors).length) {
              setErrors(newErrors)
              // foca no primeiro campo inválido
              const firstInvalid =
                (newErrors.empresa && form.querySelector<HTMLInputElement>("#empresa")) ||
                (newErrors.vendedor && form.querySelector<HTMLInputElement>("#vendedor"))
              firstInvalid?.focus()
              toast.error("Preencha os campos obrigatórios.")
              return
            }
            setErrors({})

            const dto = new ProviderDto()
            if (resource) {
              dto.createFromColoquentResource(resource)
            }
            dto.company_name = empresa
            dto.seller = vendedor
            dto.email = String(data.get("email") || "")
            dto.phone = String(data.get("telefone") || "")
            dto.delivery_time = Number(data.get("prazo") || 0)
            dto.observation = String(data.get("observacoes") || "")

            try {
              setSubmitting(true)
              await onSubmit(dto)
              toast.success("Fornecedor salvo com sucesso.")
              form.reset()
              setPhone("")
              // fecha o drawer
              form
                .closest("[data-state=open]")
                ?.querySelector<HTMLButtonElement>("button[data-close]")
                ?.click()
            } catch (error) {
              const message =
                (error as { message?: string })?.message ??
                "Falha ao salvar fornecedor."
              toast.error(message) // sonner
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="empresa">Empresa</Label>
             <Input
              id="empresa"
              name="empresa"
              defaultValue={initialValues?.empresa}
              className={cn(errors.empresa && "border-destructive")}
              aria-invalid={!!errors.empresa}
              aria-describedby={errors.empresa ? "empresa-erro" : undefined}
            />
            {errors.empresa && (
              <span id="empresa-erro" className="text-destructive text-xs">
                {errors.empresa}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="vendedor">Vendedor</Label>
            <Input
              id="vendedor"
              name="vendedor"
              defaultValue={initialValues?.vendedor}
              className={cn(errors.vendedor && "border-destructive")}
              aria-invalid={!!errors.vendedor}
              aria-describedby={errors.vendedor ? "vendedor-erro" : undefined}
            />
            {errors.vendedor && (
              <span id="vendedor-erro" className="text-destructive text-xs">
                {errors.vendedor}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={initialValues?.email} />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                type="tel"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="prazo">Prazo em dias (Lead Time)</Label>
            <Input id="prazo" name="prazo" type="number" defaultValue={initialValues?.prazo} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" defaultValue={initialValues?.observacoes} />
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
