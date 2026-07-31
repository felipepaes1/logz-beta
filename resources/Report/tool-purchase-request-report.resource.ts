import type { AxiosResponse } from "axios"

import { BaseResource } from "@/base/BaseResource"

export type ToolPurchaseRequestReportResponse = AxiosResponse<Blob>

export class ToolPurchaseRequestReportResource extends BaseResource {
  public static jsonApiType =
    "tenants/:tenant_id/reports/tool-purchase-request"

  public static download(): Promise<ToolPurchaseRequestReportResponse> {
    return this.getHttpClient()
      .getImplementingClient()
      .get<Blob>(this.jsonApiType, {
        responseType: "blob",
      })
  }
}
