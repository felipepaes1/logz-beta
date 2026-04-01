import type {
  JsonApiCollectionResult,
  JsonApiQuery,
  JsonApiResourceObject,
  JsonApiSingleResult,
} from "../Inventory/shared/json-api.adapter"
import type { MovementType } from "../InventoryMovement/inventory-movement.dto"

export interface InventoryItemDto {
  id?: number | null
  tenant_id?: number | null
  active: boolean
  name: string
  code?: string | null
  external_item_id_useall?: string | null
  description?: string | null
  category: string
  unit_type: string
  unit: string
  min_quantity?: number | null
  quantity?: number | null
  pre_ordered?: boolean
  observation?: string | null
}

export interface InventoryItemFilters {
  term?: string
  category?: string
  unit_type?: string
  unit?: string
  active?: boolean | 0 | 1
  created_from?: string
  created_to?: string
  [key: string]: unknown
}

export type InventoryItemsQuery = JsonApiQuery<InventoryItemFilters>

export interface InventoryItemMovementRelation {
  id: number
  type: MovementType | null
  quantity: number | null
  unit_price?: number | null
  total_price?: number | null
  created_at?: string | null
  raw: JsonApiResourceObject
}

export interface InventoryItemParsed extends InventoryItemDto {
  id: number
  active: boolean
  name: string
  category: string
  unit_type: string
  unit: string
  movements?: InventoryItemMovementRelation[]
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  raw: JsonApiResourceObject
}

export type InventoryItemsListResult = JsonApiCollectionResult<InventoryItemParsed>

export type InventoryItemSingleResult = JsonApiSingleResult<InventoryItemParsed>
