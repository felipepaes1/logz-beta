import { ToOneRelation } from "coloquent"
import { BaseResource } from "../../base/BaseResource"
import { ItemResource } from "../Item/item.resource"
import { ProviderDto } from "./provider.dto"

export class ProviderResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/providers"

  public static async createOrUpdate(dto: ProviderDto): Promise<any> {
    return this.action("create-or-update", { provider_dto: dto })
  }

  public static async deleteMany(providersIds: Array<number | string>, tenantId?: number | string): Promise<void> {
        if (!providersIds?.length) return;

        const base = tenantId
          ? (this.jsonApiType as string).replace(':tenant_id', String(tenantId))
          : (new (this as any)() as BaseResource).getJsonApiType();

        const idsCsv = providersIds.join(',');
        const uri = `${base}/${idsCsv}`; 

        await this.getHttpClient().delete(uri);
  }

  public static async saveAsNew(dto: ProviderDto): Promise<any> {
    return this.action("save-as-new", { provider_dto: dto })
  }

  public item(): ToOneRelation {
    return this.hasOne(ItemResource, "item")
  }
}
