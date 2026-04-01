export type MovimentoSource = "component" | "inventory"

export interface Movimento {
  id: number
  movementId: number
  source: MovimentoSource
  movementType: "IN" | "OUT"
  data: string
  grupo: string
  codigo: string
  item: string
  maquina: string
  responsavel: string
  operacao: "Entrada" | "Saida"
  precoUnitario: number | null
  precoTotal: number | null
  ordem: string
  quantidade: number
  estoque: number | null
  itemId?: number | null
  inventoryItemId?: number | null
  collaboratorId?: number | null
  machineId?: number | null
  productionOrderId?: number | null
  externalKey?: string | null
  justification?: string | null
}

