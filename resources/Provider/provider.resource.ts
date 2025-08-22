import { ToOneRelation } from "coloquent"
import { BaseResource } from "../../base/BaseResource"
import { ItemResource } from "../Item/item.resource"
import { ProviderDto } from "./provider.dto"

export class ProviderResource extends BaseResource {
  public static jsonApiType = "tenants/:tenant_id/providers"

  // Ações em estilo plataforma (mesmo de ItemResource)
  public static async createOrUpdate(dto: ProviderDto): Promise<any> {
    return this.action("create-or-update", { provider_dto: dto })
  }

  public static async saveAsNew(dto: ProviderDto): Promise<any> {
    return this.action("save-as-new", { provider_dto: dto })
  }

  // Relações
  public item(): ToOneRelation {
    return this.hasOne(ItemResource, "item")
  }
}
