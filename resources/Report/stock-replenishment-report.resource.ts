import type { AxiosResponse } from "axios"

import { BaseResource } from "@/base/BaseResource"

export const STOCK_REPLENISHMENT_PERIOD_OPTIONS = [
  { label: "Diário", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Últimos 15 dias", value: "15_days" },
  { label: "Último mês", value: "last_month" },
] as const

export type StockReplenishmentPeriod =
  (typeof STOCK_REPLENISHMENT_PERIOD_OPTIONS)[number]["value"]

export type StockReplenishmentReportResponse = AxiosResponse<Blob>

export class StockReplenishmentReportResource extends BaseResource {
  public static jsonApiType =
    "tenants/:tenant_id/reports/stock-replenishment"

  public static download(
    period: StockReplenishmentPeriod
  ): Promise<StockReplenishmentReportResponse> {
    return this.getHttpClient()
      .getImplementingClient()
      .get<Blob>(this.jsonApiType, {
        params: { period },
        responseType: "blob",
      })
  }
}
