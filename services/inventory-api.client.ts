import type {
  InventoryItemDto,
  InventoryItemSingleResult,
  InventoryItemsListResult,
  InventoryItemsQuery,
} from "@/resources/InventoryItem/inventory-item.dto"
import { InventoryItemResource } from "@/resources/InventoryItem/inventory-item.resource"
import type {
  InventoryMovementDto,
  InventoryMovementSingleResult,
  InventoryMovementsListResult,
  InventoryMovementsQuery,
} from "@/resources/InventoryMovement/inventory-movement.dto"
import { InventoryMovementResource } from "@/resources/InventoryMovement/inventory-movement.resource"
import type { MovementsFeedQuery, MovementsFeedResult } from "@/resources/Movement/movement.dto"
import { MovementResource } from "@/resources/Movement/movement.resource"
import {
  ComponentOutputsReportResource,
  type ComponentOutputsReportPeriod,
  type ComponentOutputsReportResponse,
} from "@/resources/Report/component-outputs-report.resource"
import {
  ToolPurchaseRequestReportResource,
  type ToolPurchaseRequestReportResponse,
} from "@/resources/Report/tool-purchase-request-report.resource"
import {
  StockReplenishmentReportResource,
  type StockReplenishmentPeriod,
  type StockReplenishmentReportResponse,
} from "@/resources/Report/stock-replenishment-report.resource"

export const inventoryApiClient = {
  getInventoryItems(query?: InventoryItemsQuery): Promise<InventoryItemsListResult> {
    return InventoryItemResource.list(query)
  },

  getInventoryItem(
    id: number | string,
    query?: InventoryItemsQuery
  ): Promise<InventoryItemSingleResult> {
    return InventoryItemResource.show(id, query)
  },

  putInventoryItemCreateOrUpdate(
    inventoryItemDto: InventoryItemDto
  ): Promise<InventoryItemSingleResult> {
    return InventoryItemResource.createOrUpdate(inventoryItemDto)
  },

  deleteInventoryItem(id: number | string): Promise<void> {
    return InventoryItemResource.destroy(id)
  },

  getInventoryMovements(
    query?: InventoryMovementsQuery
  ): Promise<InventoryMovementsListResult> {
    return InventoryMovementResource.list(query)
  },

  getInventoryMovement(
    id: number | string,
    query?: InventoryMovementsQuery
  ): Promise<InventoryMovementSingleResult> {
    return InventoryMovementResource.show(id, query)
  },

  putInventoryMovementCreateOrUpdate(
    inventoryMovementDto: InventoryMovementDto
  ): Promise<InventoryMovementSingleResult> {
    return InventoryMovementResource.createOrUpdate(inventoryMovementDto)
  },

  putInventoryMovementDeleteWithJustification(
    id: number | string,
    justification: string
  ): Promise<unknown> {
    return InventoryMovementResource.deleteWithJustification(id, justification)
  },

  deleteInventoryMovement(id: number | string): Promise<void> {
    return InventoryMovementResource.destroy(id)
  },

  getMovements(query?: MovementsFeedQuery): Promise<MovementsFeedResult> {
    return MovementResource.list(query)
  },

  downloadComponentOutputsReport(
    period: ComponentOutputsReportPeriod
  ): Promise<ComponentOutputsReportResponse> {
    return ComponentOutputsReportResource.download(period)
  },

  downloadToolPurchaseRequestReport(): Promise<ToolPurchaseRequestReportResponse> {
    return ToolPurchaseRequestReportResource.download()
  },

  downloadStockReplenishmentReport(
    period: StockReplenishmentPeriod
  ): Promise<StockReplenishmentReportResponse> {
    return StockReplenishmentReportResource.download(period)
  },
}
