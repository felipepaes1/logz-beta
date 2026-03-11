import { BaseResource } from "@/base/BaseResource"

export class PurchaseRequestResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/purchase-requests"

  public static async current(params?: {
    item_id?: number | string
    item_ids?: Array<number | string>
  }) {
    const uri = `${this.jsonApiType}/current`
    return this.getHttpClient().get(uri, params)
  }

  public static async generateEntry(
    id: number | string,
    payload: {
      unit_price: number
      quantity?: number
      requested_qty?: number
      order_number?: string
      unitPrice?: number
      quantityRequested?: number
      requestedQty?: number
      orderNumber?: string
    }
  ) {
    const requestId = Number(id)
    if (!Number.isFinite(requestId) || requestId <= 0) {
      throw new Error("Pedido de compra invalido.")
    }

    const base = new (this as unknown as new () => BaseResource)().getJsonApiType()
    return this.getHttpClient().put(`${base}/${requestId}/generate-entry`, payload)
  }
}
