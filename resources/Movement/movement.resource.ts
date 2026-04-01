import { BaseResource } from "../../base/BaseResource"
import {
  asCollection,
  buildIncludedMap,
  buildJsonApiQuery,
  readAttribute,
  readRelationshipData,
  resolveRelationData,
  toMovementType,
  toOptionalNumber,
  toOptionalString,
  toRelationSummary,
  unwrapJsonApiDocument,
  type JsonApiResourceObject,
} from "../Inventory/shared/json-api.adapter"
import type {
  MovementFeedParsed,
  MovementFeedSource,
  MovementsFeedQuery,
  MovementsFeedResult,
} from "./movement.dto"

export class MovementResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/movements"

  public static async list(query?: MovementsFeedQuery): Promise<MovementsFeedResult> {
    const base = this.buildBase()
    const response = await this.getHttpClient().get(base, buildJsonApiQuery(query))
    const raw = unwrapJsonApiDocument(response)
    const includedMap = buildIncludedMap(raw.included)
    const parsed = asCollection(raw.data).map((resource) =>
      this.parseResource(resource, includedMap)
    )

    return {
      data: parsed,
      meta: raw.meta,
      links: raw.links,
      raw,
    }
  }

  private static parseResource(
    resource: JsonApiResourceObject,
    includedMap: Map<string, JsonApiResourceObject>
  ): MovementFeedParsed {
    const item = this.resolveToOne(resource, includedMap, ["item"])
    const inventoryItem = this.resolveToOne(resource, includedMap, [
      "inventoryItem",
      "inventory_item",
      "inventory-item",
    ])
    const collaborator = this.resolveToOne(resource, includedMap, [
      "collaborator",
      "responsible",
    ])
    const machine = this.resolveToOne(resource, includedMap, ["machine"])
    const pcp = this.resolveToOne(resource, includedMap, [
      "pcp",
      "productionOrder",
      "production_order",
    ])

    return {
      id:
        toOptionalNumber(readAttribute(resource, ["id"])) ??
        toOptionalNumber(resource.id) ??
        0,
      source: this.resolveSource(resource),
      resource_type: resource.type,
      type: toMovementType(readAttribute(resource, ["type"])),
      quantity: toOptionalNumber(readAttribute(resource, ["quantity"])) ?? null,
      unit_price: toOptionalNumber(
        readAttribute(resource, ["unit_price", "unitPrice"])
      ),
      total_price: toOptionalNumber(
        readAttribute(resource, ["total_price", "totalPrice"])
      ),
      order_number: toOptionalString(
        readAttribute(resource, ["order_number", "orderNumber"])
      ),
      justification: toOptionalString(readAttribute(resource, ["justification"])),
      item_id: toOptionalNumber(readAttribute(resource, ["item_id", "itemId"])),
      inventory_item_id: toOptionalNumber(
        readAttribute(resource, ["inventory_item_id", "inventoryItemId"])
      ),
      collaborator_id: toOptionalNumber(
        readAttribute(resource, ["collaborator_id", "collaboratorId"])
      ),
      machine_id: toOptionalNumber(
        readAttribute(resource, ["machine_id", "machineId"])
      ),
      pcp_id: toOptionalNumber(readAttribute(resource, ["pcp_id", "production_order_id"])),
      created_at: toOptionalString(readAttribute(resource, ["created_at", "createdAt"])),
      updated_at: toOptionalString(readAttribute(resource, ["updated_at", "updatedAt"])),
      item: toRelationSummary(item),
      inventoryItem: toRelationSummary(inventoryItem),
      collaborator: toRelationSummary(collaborator),
      machine: toRelationSummary(machine),
      pcp: toRelationSummary(pcp),
      raw: resource,
    }
  }

  private static resolveToOne(
    resource: JsonApiResourceObject,
    includedMap: Map<string, JsonApiResourceObject>,
    keys: string[]
  ): JsonApiResourceObject | null {
    const data = readRelationshipData(resource, keys)
    const resolved = resolveRelationData(data, includedMap)
    if (Array.isArray(resolved)) return resolved[0] ?? null
    return resolved ?? null
  }

  private static resolveSource(resource: JsonApiResourceObject): MovementFeedSource | "unknown" {
    const explicitSource = toOptionalString(
      readAttribute(resource, ["source", "movement_source"])
    )
    const normalizedExplicit = explicitSource?.toLowerCase().replace(/-/g, "_")
    if (normalizedExplicit === "components") {
      return "components"
    }
    if (normalizedExplicit === "inventory_movements") {
      return "inventory_movements"
    }

    const type = String(resource.type || "").toLowerCase()
    if (type.includes("component")) return "components"
    if (type.includes("inventory-movement") || type.includes("inventory_movement")) {
      return "inventory_movements"
    }
    return "unknown"
  }

  private static buildBase(tenantId?: number | string): string {
    if (tenantId !== undefined && tenantId !== null) {
      return (this.jsonApiType as string).replace(":tenant_id", String(tenantId))
    }

    const ResourceCtor = this as unknown as new () => BaseResource
    return new ResourceCtor().getJsonApiType()
  }
}
