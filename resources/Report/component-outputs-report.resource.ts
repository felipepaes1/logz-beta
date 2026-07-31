import type { AxiosResponse } from "axios"

import { BaseResource } from "@/base/BaseResource"

export const COMPONENT_OUTPUTS_REPORT_PERIOD_OPTIONS = [
  { label: "7 dias", value: "7_days" },
  { label: "15 dias", value: "15_days" },
  { label: "30 dias", value: "30_days" },
  { label: "3 meses", value: "3_months" },
  { label: "Todos", value: "all" },
] as const

export type ComponentOutputsReportPeriod =
  (typeof COMPONENT_OUTPUTS_REPORT_PERIOD_OPTIONS)[number]["value"]

export type ComponentOutputsReportResponse = AxiosResponse<Blob>

export class ComponentOutputsReportResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/reports/component-outputs"

  public static download(
    period: ComponentOutputsReportPeriod
  ): Promise<ComponentOutputsReportResponse> {
    return this.getHttpClient()
      .getImplementingClient()
      .get<Blob>(this.jsonApiType, {
        params: { period },
        responseType: "blob",
      })
  }
}
