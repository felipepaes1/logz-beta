import MockAdapter from "axios-mock-adapter"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ToolPurchaseRequestReportResource } from "@/resources/Report/tool-purchase-request-report.resource"
import { inventoryApiClient } from "@/services/inventory-api.client"

describe("ToolPurchaseRequestReportResource", () => {
  const axiosClient =
    ToolPurchaseRequestReportResource.getHttpClient().getImplementingClient()
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

  it("usa o tenant autenticado e solicita o relatório como blob sem query parameters", async () => {
    mockApi
      .onGet("/tenants/42/reports/tool-purchase-request")
      .reply(200, new Blob(["xlsx"]))

    await inventoryApiClient.downloadToolPurchaseRequestReport()

    expect(mockApi.history.get).toHaveLength(1)
    expect(mockApi.history.get[0]).toMatchObject({
      url: "tenants/42/reports/tool-purchase-request",
      responseType: "blob",
    })
    expect(mockApi.history.get[0].params).toBeUndefined()
    expect(mockApi.history.get[0].headers?.Authorization).toBe(
      "Bearer authenticated-token"
    )
  })
})
