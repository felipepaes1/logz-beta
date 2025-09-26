import { ToOneRelation } from "coloquent"
import { BaseResource } from "../../base/BaseResource"
import { ItemResource } from "../Item/item.resource"
import { ProviderDto } from "./provider.dto"

export class ProviderResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/providers"

  public static async createOrUpdate(dto: ProviderDto): Promise<ProviderResource> {
    const res = await this.action("create-or-update", { provider_dto: dto })
    return res as ProviderResource
  }

  public static async destroy(id: number | string, tenantId?: number | string): Promise<void> {
    if (!id && id !== 0) return
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) return
    const base = this.buildBase(tenantId)
    const uri = `${base}/${idNum}`
    await this.getHttpClient().delete(uri)
  }

  public static async saveAsNew(dto: ProviderDto): Promise<any> {
    return this.action("save-as-new", { provider_dto: dto })
  }

  public item(): ToOneRelation {
    return this.hasOne(ItemResource, "item")
  }

  private static buildBase(tenantId?: number | string): string {
    if (tenantId !== undefined && tenantId !== null) {
      return (this.jsonApiType as string).replace(":tenant_id", String(tenantId))
    }
    return (new (this as any)() as BaseResource).getJsonApiType()
  }
}
