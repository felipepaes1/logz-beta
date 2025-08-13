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

interface FornecedorFormProps {
  onSubmit: (f: Omit<Fornecedor, "id">) => void
  initialValues?: Partial<Fornecedor>
  title: string
}

export function FornecedorForm({ onSubmit, initialValues, title }: FornecedorFormProps) {
  const [phone, setPhone] = React.useState(initialValues?.telefone || "")

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
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const data = new FormData(form)
            onSubmit({
              empresa: String(data.get("empresa") || ""),
              vendedor: String(data.get("vendedor") || ""),
              email: String(data.get("email") || ""),
              telefone: String(data.get("telefone") || ""),
              prazo: Number(data.get("prazo") || 0),
              observacoes: String(data.get("observacoes") || ""),
            })
            form.reset()
          }}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="empresa">Empresa</Label>
            <Input id="empresa" name="empresa" defaultValue={initialValues?.empresa} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="vendedor">Vendedor</Label>
            <Input id="vendedor" name="vendedor" defaultValue={initialValues?.vendedor} />
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
