import type { InventoryItemParsed } from "@/resources/InventoryItem/inventory-item.dto"

export interface MateriaPrimaConsumivel {
  id: number
  nome: string
  codigo: string
  categoria: string
  tipoUnidade: string
  unidade: string
  estoqueMinimo: number
  estoqueAtual: number
  externalKey: string
  status: "Ativo" | "Inativo"
  preOrdered: boolean
  resource?: InventoryItemParsed
}
