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
  toOptionalBoolean,
  toOptionalNumber,
  toOptionalString,
  unwrapJsonApiDocument,
  type JsonApiResourceObject,
} from "../Inventory/shared/json-api.adapter"
import type {
  InventoryItemDto,
  InventoryItemMovementRelation,
  InventoryItemParsed,
  InventoryItemsListResult,
  InventoryItemsQuery,
  InventoryItemSingleResult,
} from "./inventory-item.dto"

export class InventoryItemResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/inventory-items"

  public static async list(
    query?: InventoryItemsQuery
  ): Promise<InventoryItemsListResult> {
    const base = this.buildBase()
    const response = await this.getHttpClient().get(base, buildJsonApiQuery(query))
    return this.parseCollection(response)
  }

  public static async show(
    id: number | string,
    query?: InventoryItemsQuery
  ): Promise<InventoryItemSingleResult> {
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
    inventoryItemDto: InventoryItemDto
  ): Promise<InventoryItemSingleResult> {
    const response = await this.action("create-or-update", {
      inventory_item_dto: inventoryItemDto,
    })

    return this.parseSingle(response)
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

  private static parseCollection(response: unknown): InventoryItemsListResult {
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

  private static parseSingle(response: unknown): InventoryItemSingleResult {
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
  ): InventoryItemParsed {
    const movementRelation = readRelationshipData(resource, [
      "movements",
      "inventoryMovements",
      "inventory_movements",
      "inventory-movements",
    ])
    const resolvedMovements = resolveRelationData(movementRelation, includedMap)
    const movements = Array.isArray(resolvedMovements)
      ? resolvedMovements.map((entry) => this.parseMovementRelation(entry))
      : resolvedMovements
        ? [this.parseMovementRelation(resolvedMovements)]
        : undefined

    return {
      id:
        toOptionalNumber(readAttribute(resource, ["id"])) ??
        toOptionalNumber(resource.id) ??
        0,
      tenant_id: toOptionalNumber(
        readAttribute(resource, ["tenant_id", "tenantId"])
      ),
      active: toOptionalBoolean(readAttribute(resource, ["active"])) ?? false,
      name: String(readAttribute(resource, ["name"]) ?? ""),
      code: toOptionalString(readAttribute(resource, ["code"])),
      external_item_id_useall: toOptionalString(
        readAttribute(resource, ["external_item_id_useall", "externalItemIdUseall"])
      ),
      description: toOptionalString(readAttribute(resource, ["description"])),
      category: String(readAttribute(resource, ["category"]) ?? ""),
      unit_type: String(readAttribute(resource, ["unit_type", "unitType"]) ?? ""),
      unit: String(readAttribute(resource, ["unit"]) ?? ""),
      min_quantity: toOptionalNumber(
        readAttribute(resource, ["min_quantity", "minQuantity"])
      ),
      quantity: toOptionalNumber(readAttribute(resource, ["quantity"])),
      pre_ordered:
        toOptionalBoolean(
          readAttribute(resource, ["pre_ordered", "preOrdered"])
        ) ?? undefined,
      observation: toOptionalString(readAttribute(resource, ["observation"])),
      created_at: toOptionalString(readAttribute(resource, ["created_at", "createdAt"])),
      updated_at: toOptionalString(readAttribute(resource, ["updated_at", "updatedAt"])),
      deleted_at: toOptionalString(readAttribute(resource, ["deleted_at", "deletedAt"])),
      movements,
      raw: resource,
    }
  }

  private static parseMovementRelation(
    resource: JsonApiResourceObject
  ): InventoryItemMovementRelation {
    return {
      id:
        toOptionalNumber(readAttribute(resource, ["id"])) ??
        toOptionalNumber(resource.id) ??
        0,
      type: toMovementType(readAttribute(resource, ["type"])),
      quantity: toOptionalNumber(readAttribute(resource, ["quantity"])) ?? null,
      unit_price: toOptionalNumber(
        readAttribute(resource, ["unit_price", "unitPrice"])
      ),
      total_price: toOptionalNumber(
        readAttribute(resource, ["total_price", "totalPrice"])
      ),
      created_at: toOptionalString(readAttribute(resource, ["created_at", "createdAt"])),
      raw: resource,
    }
  }

  private static buildBase(tenantId?: number | string): string {
    if (tenantId !== undefined && tenantId !== null) {
      return (this.jsonApiType as string).replace(":tenant_id", String(tenantId))
    }

    const ResourceCtor = this as unknown as new () => BaseResource
    return new ResourceCtor().getJsonApiType()
  }
}
