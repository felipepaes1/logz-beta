import type {
  JsonApiCollectionResult,
  JsonApiQuery,
  JsonApiResourceObject,
  JsonApiSingleResult,
} from "../Inventory/shared/json-api.adapter"

export type MovementType = "IN" | "OUT"

export interface InventoryMovementDto {
  id?: number | null
  quantity: number
  type: MovementType
  unit_price?: number | null
  total_price?: number | null
  order_number?: string | null
  production_order_id?: number | null
  external_key?: string | null
  justification?: string | null
  inventory_item_id?: number | null
  collaborator_id?: number | null
  machine_id?: number | null
}

export interface InventoryMovementFilters {
  type?: MovementType
  term?: string
  collaborator_id?: number | string
  machine_id?: number | string
  inventory_item_id?: number | string
  created_from?: string
  created_to?: string
  [key: string]: unknown
}

export type InventoryMovementsQuery = JsonApiQuery<InventoryMovementFilters>

export interface InventoryMovementRelationSummary {
  id: number
  type: string
  attributes: Record<string, unknown>
  raw: JsonApiResourceObject
}

export interface InventoryMovementParsed extends InventoryMovementDto {
  id: number
  quantity: number
  type: MovementType
  inventoryItem?: InventoryMovementRelationSummary | null
  collaborator?: InventoryMovementRelationSummary | null
  machine?: InventoryMovementRelationSummary | null
  pcp?: InventoryMovementRelationSummary | null
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  raw: JsonApiResourceObject
}

export type InventoryMovementsListResult =
  JsonApiCollectionResult<InventoryMovementParsed>

export type InventoryMovementSingleResult = JsonApiSingleResult<InventoryMovementParsed>
