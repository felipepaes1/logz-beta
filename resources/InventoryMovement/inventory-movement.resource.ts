import { BaseResource } from "../../base/BaseResource"
import {
  asCollection,
  asSingle,
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
  InventoryMovementDto,
  InventoryMovementParsed,
  InventoryMovementsListResult,
  InventoryMovementsQuery,
  InventoryMovementSingleResult,
} from "./inventory-movement.dto"

export class InventoryMovementResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/inventory-movements"

  public static async list(
    query?: InventoryMovementsQuery
  ): Promise<InventoryMovementsListResult> {
    const base = this.buildBase()
    const response = await this.getHttpClient().get(base, buildJsonApiQuery(query))
    return this.parseCollection(response)
  }

  public static async show(
    id: number | string,
    query?: InventoryMovementsQuery
  ): Promise<InventoryMovementSingleResult> {
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return { data: null, raw: { data: null } }
    }

    const base = this.buildBase()
    const response = await this.getHttpClient().get(
      `${base}/${idNum}`,
      buildJsonApiQuery(query)
    )

    return this.parseSingle(response)
  }

  public static async createOrUpdate(
    inventoryMovementDto: InventoryMovementDto
  ): Promise<InventoryMovementSingleResult> {
    const response = await this.action("create-or-update", {
      inventory_movement_dto: inventoryMovementDto,
    })

    return this.parseSingle(response)
  }

  public static async deleteWithJustification(
    id: number | string,
    justification: string
  ): Promise<unknown> {
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) return null

    return this.action("delete-with-justification", {
      id: idNum,
      justification,
    })
  }

  public static async destroy(
    id: number | string,
    tenantId?: number | string
  ): Promise<void> {
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) return

    const base = this.buildBase(tenantId)
    await this.getHttpClient().delete(`${base}/${idNum}`)
  }

  private static parseCollection(response: unknown): InventoryMovementsListResult {
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

  private static parseSingle(response: unknown): InventoryMovementSingleResult {
    const raw = unwrapJsonApiDocument(response)
    const includedMap = buildIncludedMap(raw.included)
    const resource = asSingle(raw.data)

    return {
      data: resource ? this.parseResource(resource, includedMap) : null,
      meta: raw.meta,
      links: raw.links,
      raw,
    }
  }

  private static parseResource(
    resource: JsonApiResourceObject,
    includedMap: Map<string, JsonApiResourceObject>
  ): InventoryMovementParsed {
    const inventoryItem = this.resolveToOne(resource, includedMap, [
      "inventoryItem",
      "inventory_item",
      "inventory-item",
      "item",
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
      quantity: toOptionalNumber(readAttribute(resource, ["quantity"])) ?? 0,
      type: toMovementType(readAttribute(resource, ["type"])) ?? "IN",
      unit_price: toOptionalNumber(
        readAttribute(resource, ["unit_price", "unitPrice"])
      ),
      total_price: toOptionalNumber(
        readAttribute(resource, ["total_price", "totalPrice"])
      ),
      order_number: toOptionalString(
        readAttribute(resource, ["order_number", "orderNumber"])
      ),
      production_order_id: toOptionalNumber(
        readAttribute(resource, ["production_order_id", "productionOrderId", "pcp_id"])
      ),
      external_key: toOptionalString(
        readAttribute(resource, ["external_key", "externalKey"])
      ),
      justification: toOptionalString(readAttribute(resource, ["justification"])),
      inventory_item_id: toOptionalNumber(
        readAttribute(resource, ["inventory_item_id", "inventoryItemId", "item_id"])
      ),
      collaborator_id: toOptionalNumber(
        readAttribute(resource, ["collaborator_id", "collaboratorId"])
      ),
      machine_id: toOptionalNumber(
        readAttribute(resource, ["machine_id", "machineId"])
      ),
      inventoryItem: toRelationSummary(inventoryItem),
      collaborator: toRelationSummary(collaborator),
      machine: toRelationSummary(machine),
      pcp: toRelationSummary(pcp),
      created_at: toOptionalString(readAttribute(resource, ["created_at", "createdAt"])),
      updated_at: toOptionalString(readAttribute(resource, ["updated_at", "updatedAt"])),
      deleted_at: toOptionalString(readAttribute(resource, ["deleted_at", "deletedAt"])),
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

  private static buildBase(tenantId?: number | string): string {
    if (tenantId !== undefined && tenantId !== null) {
      return (this.jsonApiType as string).replace(":tenant_id", String(tenantId))
    }

    const ResourceCtor = this as unknown as new () => BaseResource
    return new ResourceCtor().getJsonApiType()
  }
}
