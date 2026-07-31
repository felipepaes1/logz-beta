import MockAdapter from "axios-mock-adapter"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  COMPONENT_OUTPUTS_REPORT_PERIOD_OPTIONS,
  ComponentOutputsReportResource,
} from "@/resources/Report/component-outputs-report.resource"
import { inventoryApiClient } from "@/services/inventory-api.client"

describe("ComponentOutputsReportResource", () => {
  const axiosClient =
    ComponentOutputsReportResource.getHttpClient().getImplementingClient()
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

  it("mapeia os labels para os valores aceitos pela API", () => {
    expect(COMPONENT_OUTPUTS_REPORT_PERIOD_OPTIONS).toEqual([
      { label: "7 dias", value: "7_days" },
      { label: "15 dias", value: "15_days" },
      { label: "30 dias", value: "30_days" },
      { label: "3 meses", value: "3_months" },
      { label: "Todos", value: "all" },
    ])
  })

  it("usa o tenant autenticado, envia o período e solicita uma resposta blob", async () => {
    mockApi
      .onGet("/tenants/42/reports/component-outputs")
      .reply(200, new Blob(["xlsx"]))

    await inventoryApiClient.downloadComponentOutputsReport("15_days")

    expect(mockApi.history.get).toHaveLength(1)
    expect(mockApi.history.get[0]).toMatchObject({
      url: "tenants/42/reports/component-outputs",
      params: { period: "15_days" },
      responseType: "blob",
    })
    expect(mockApi.history.get[0].headers?.Authorization).toBe(
      "Bearer authenticated-token"
    )
  })
})
