export const INVENTORY_UNIT_TYPES = {
  mass: { label: "Massa", unit: "kg" },
  volume: { label: "Volume", unit: "l" },
  length: { label: "Metros", unit: "m" },
  count: { label: "Unidades", unit: "un" },
} as const

export type InventoryUnitType = keyof typeof INVENTORY_UNIT_TYPES

const INVENTORY_UNIT_TYPE_ALIASES: Record<string, InventoryUnitType> = {
  mass: "mass",
  massa: "mass",
  volume: "volume",
  litro: "volume",
  litros: "volume",
  length: "length",
  comprimento: "length",
  metro: "length",
  metros: "length",
  count: "count",
  contagem: "count",
  unidade: "count",
  unidades: "count",
}

export function normalizeInventoryUnitType(value: string | null | undefined): InventoryUnitType | null {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (!normalized) return null
  return INVENTORY_UNIT_TYPE_ALIASES[normalized] ?? null
}

export function getInventoryUnitDefinition(value: string | null | undefined) {
  const unitType = normalizeInventoryUnitType(value)
  if (!unitType) return null
  return {
    type: unitType,
    ...INVENTORY_UNIT_TYPES[unitType],
  }
}
