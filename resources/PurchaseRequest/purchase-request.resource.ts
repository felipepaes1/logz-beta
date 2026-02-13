import { BaseResource } from "@/base/BaseResource"

export class PurchaseRequestResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/purchase-requests"

  public static async current(params?: {
    item_id?: number | string
    item_ids?: Array<number | string>
  }) {
    const uri = (this as any).jsonApiType + "/current"
    return this.getHttpClient().get(uri, params)
  }
}
