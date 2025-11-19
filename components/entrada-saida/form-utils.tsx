"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { ItemResource } from "@/resources/Item/item.resource"
import { cn } from "@/lib/utils"

type WithAttributeGetter = {
  getAttribute?: (key: string) => any
} | undefined

export function isResourceActive(resource: WithAttributeGetter): boolean {
  const raw = resource?.getAttribute?.("active")
  if (raw === undefined || raw === null) return true
  if (typeof raw === "string") {
    const lowered = raw.toLowerCase()
    return lowered !== "false" && lowered !== "0"
  }
  return Boolean(raw)
}

export function formatItemLabel(item?: ItemResource | null): string {
  if (!item) return ""
  const codeValue = item.getAttribute?.("code")
  const nameValue = item.getAttribute?.("name")
  const code = codeValue !== undefined && codeValue !== null ? String(codeValue).trim() : ""
  const name = nameValue !== undefined && nameValue !== null ? String(nameValue).trim() : ""
  if (code && name) return `${code} - ${name}`
  return name || code
}

export function normalizeSearchValue(value: string): string {
  if (!value) return ""
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

interface SelectDisplayProps {
  label?: string
  placeholder: string
}

export function SelectDisplay({
  label,
  placeholder,
}: SelectDisplayProps): React.ReactElement {
  return (
    <span
      className={cn(
        "block flex-1 truncate text-left",
        !label && "text-muted-foreground"
      )}
    >
      {label || placeholder}
    </span>
  )
}

interface SelectSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SelectSearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: SelectSearchInputProps): React.ReactElement {
  return (
    <div className="p-2 pb-1">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        placeholder={placeholder}
        className="h-8"
        autoComplete="off"
      />
    </div>
  )
}
