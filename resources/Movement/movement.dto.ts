import type {
  JsonApiCollectionResult,
  JsonApiQuery,
  JsonApiResourceObject,
} from "../Inventory/shared/json-api.adapter"
import type { MovementType } from "../InventoryMovement/inventory-movement.dto"

export type MovementFeedSource = "components" | "inventory_movements"

export interface MovementsFeedFilters {
  source?: MovementFeedSource
  type?: MovementType
  term?: string
  collaborator_id?: number | string
  machine_id?: number | string
  item_id?: number | string
  inventory_item_id?: number | string
  created_from?: string
  created_to?: string
  [key: string]: unknown
}

export type MovementsFeedQuery = JsonApiQuery<MovementsFeedFilters>

export interface MovementFeedRelationSummary {
  id: number
  type: string
  attributes: Record<string, unknown>
  raw: JsonApiResourceObject
}

export interface MovementFeedParsed {
  id: number
  source: MovementFeedSource | "unknown"
  resource_type: string
  type: MovementType | null
  quantity: number | null
  unit_price?: number | null
  total_price?: number | null
  order_number?: string | null
  justification?: string | null
  item_id?: number | null
  inventory_item_id?: number | null
  collaborator_id?: number | null
  machine_id?: number | null
  pcp_id?: number | null
  created_at?: string | null
  updated_at?: string | null
  item?: MovementFeedRelationSummary | null
  inventoryItem?: MovementFeedRelationSummary | null
  collaborator?: MovementFeedRelationSummary | null
  machine?: MovementFeedRelationSummary | null
  pcp?: MovementFeedRelationSummary | null
  raw: JsonApiResourceObject
}

export type MovementsFeedResult = JsonApiCollectionResult<MovementFeedParsed>
