"use client"

import * as React from "react"
import { inventoryApiClient } from "@/services/inventory-api.client"
import type {
  InventoryItemDto,
  InventoryItemParsed,
  InventoryItemsQuery,
} from "@/resources/InventoryItem/inventory-item.dto"
import type {
  InventoryMovementDto,
  InventoryMovementParsed,
  InventoryMovementsQuery,
} from "@/resources/InventoryMovement/inventory-movement.dto"
import type { MovementFeedParsed, MovementsFeedQuery } from "@/resources/Movement/movement.dto"

interface InventoryModuleError {
  status?: number
  message: string
}

function toInventoryModuleError(error: unknown): InventoryModuleError {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      status?: number
      message?: string
      response?: { status?: number }
    }
    return {
      status: err.status ?? err.response?.status,
      message: err.message ?? "Não foi possível carregar dados de inventário.",
    }
  }

  return {
    message: "Não foi possível carregar dados de inventário.",
  }
}

export function useInventoryModule() {
  const [items, setItems] = React.useState<InventoryItemParsed[]>([])
  const [movements, setMovements] = React.useState<InventoryMovementParsed[]>([])
  const [feed, setFeed] = React.useState<MovementFeedParsed[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<InventoryModuleError | null>(null)

  const loadInventoryItems = React.useCallback(async (query?: InventoryItemsQuery) => {
    const response = await inventoryApiClient.getInventoryItems(query)
    setItems(response.data)
    return response.data
  }, [])

  const loadInventoryMovements = React.useCallback(
    async (query?: InventoryMovementsQuery) => {
      const response = await inventoryApiClient.getInventoryMovements(query)
      setMovements(response.data)
      return response.data
    },
    []
  )

  const loadUnifiedMovements = React.useCallback(async (query?: MovementsFeedQuery) => {
    const response = await inventoryApiClient.getMovements(query)
    setFeed(response.data)
    return response.data
  }, [])

  const bootstrap = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadInventoryItems({
          include: ["movements"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
        loadInventoryMovements({
          include: ["inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
        loadUnifiedMovements({
          include: ["item", "inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
      ])
    } catch (err: unknown) {
      setError(toInventoryModuleError(err))
    } finally {
      setIsLoading(false)
    }
  }, [loadInventoryItems, loadInventoryMovements, loadUnifiedMovements])

  const saveInventoryItem = React.useCallback(async (dto: InventoryItemDto) => {
    const response = await inventoryApiClient.putInventoryItemCreateOrUpdate(dto)
    await loadInventoryItems({
      include: ["movements"],
      sort: "-created_at",
      page: { limit: 50, offset: 0 },
    })
    return response.data
  }, [loadInventoryItems])

  const deleteInventoryItem = React.useCallback(async (id: number | string) => {
    await inventoryApiClient.deleteInventoryItem(id)
    await loadInventoryItems({
      include: ["movements"],
      sort: "-created_at",
      page: { limit: 50, offset: 0 },
    })
  }, [loadInventoryItems])

  const saveInventoryMovement = React.useCallback(
    async (dto: InventoryMovementDto) => {
      const response = await inventoryApiClient.putInventoryMovementCreateOrUpdate(dto)
      await Promise.all([
        loadInventoryMovements({
          include: ["inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
        loadUnifiedMovements({
          include: ["item", "inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
      ])
      return response.data
    },
    [loadInventoryMovements, loadUnifiedMovements]
  )

  const deleteInventoryMovementWithJustification = React.useCallback(
    async (id: number | string, justification: string) => {
      await inventoryApiClient.putInventoryMovementDeleteWithJustification(
        id,
        justification
      )

      await Promise.all([
        loadInventoryMovements({
          include: ["inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
        loadUnifiedMovements({
          include: ["item", "inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
      ])
    },
    [loadInventoryMovements, loadUnifiedMovements]
  )

  const deleteInventoryMovement = React.useCallback(
    async (id: number | string) => {
      await inventoryApiClient.deleteInventoryMovement(id)
      await Promise.all([
        loadInventoryMovements({
          include: ["inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
        loadUnifiedMovements({
          include: ["item", "inventoryItem", "collaborator", "machine", "pcp"],
          sort: "-created_at",
          page: { limit: 50, offset: 0 },
        }),
      ])
    },
    [loadInventoryMovements, loadUnifiedMovements]
  )

  return {
    items,
    movements,
    feed,
    isLoading,
    error,
    bootstrap,
    loadInventoryItems,
    loadInventoryMovements,
    loadUnifiedMovements,
    saveInventoryItem,
    deleteInventoryItem,
    saveInventoryMovement,
    deleteInventoryMovementWithJustification,
    deleteInventoryMovement,
  }
}
