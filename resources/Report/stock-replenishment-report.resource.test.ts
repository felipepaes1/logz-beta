import MockAdapter from "axios-mock-adapter"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  STOCK_REPLENISHMENT_PERIOD_OPTIONS,
  StockReplenishmentReportResource,
} from "@/resources/Report/stock-replenishment-report.resource"
import { inventoryApiClient } from "@/services/inventory-api.client"

describe("StockReplenishmentReportResource", () => {
  const axiosClient =
    StockReplenishmentReportResource.getHttpClient().getImplementingClient()
  let mockApi: MockAdapter

  beforeEach(() => {
    localStorage.setItem("@tenancy_id", "42")
    localStorage.setItem("@token", "authenticated-token")
    mockApi = new MockAdapter(axiosClient)
  })

  afterEach(() => {
    mockApi.restore()
    localStorage.clear()
  })

  it("mapeia os períodos para os valores aceitos pela API", () => {
    expect(STOCK_REPLENISHMENT_PERIOD_OPTIONS).toEqual([
      { label: "Diário", value: "daily" },
      { label: "Semanal", value: "weekly" },
      { label: "Últimos 15 dias", value: "15_days" },
      { label: "Último mês", value: "last_month" },
    ])
  })

  it("usa o tenant autenticado, envia o período e solicita uma resposta blob", async () => {
    mockApi
      .onGet("/tenants/42/reports/stock-replenishment")
      .reply(200, new Blob(["xlsx"]))

    await inventoryApiClient.downloadStockReplenishmentReport("weekly")

    expect(mockApi.history.get).toHaveLength(1)
    expect(mockApi.history.get[0]).toMatchObject({
      url: "tenants/42/reports/stock-replenishment",
      params: { period: "weekly" },
      responseType: "blob",
    })
    expect(mockApi.history.get[0].headers?.Authorization).toBe(
      "Bearer authenticated-token"
    )
  })
})
