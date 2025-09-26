import { BaseDTO } from "../../base/Base.dto"
import { ItemDto } from "../Item/item.dto"
import { ItemResource } from "../Item/item.resource"
import { ProviderResource } from "./provider.resource"

export class ProviderDto extends BaseDTO {
  public id?: number

  public company_name: string
  public seller?: string
  public phone?: string
  public email?: string
  public delivery_time?: number
  public observation?: string

  public itemResource?: ItemResource
  public itemDto?: ItemDto

  public providerResource?: ProviderResource

  public createFromColoquentResource(resource: ProviderResource): ProviderDto {
    if (!resource || typeof resource.getApiId !== "function") {
      return this
    }

    this.providerResource = resource

    const apiId = (resource as ProviderResource)?.getApiId?.()
    const numId = Number(apiId)
    this.id = Number.isFinite(numId) && numId > 0 ? numId : this.id

    this.company_name = String(resource.getAttribute("company_name") ?? "")
    this.seller = resource.getAttribute("seller") ?? undefined
    this.phone = resource.getAttribute("phone") ?? undefined
    this.email = resource.getAttribute("email") ?? undefined
    {
      const delivery = resource.getAttribute("delivery_time")
      const n = Number(delivery)
      this.delivery_time = Number.isFinite(n) && n >= 0 ? n : undefined
    }
    this.observation = resource.getAttribute("observation") ?? undefined

    this.itemResource = resource.getRelation("item")
    if (this.itemResource) {
      this.itemDto = new ItemDto().createFromColoquentResource(this.itemResource)
    }

    return this
  }

  public createFromParentColoquentResource(resource: ProviderResource): ProviderDto {
    const apiId = (resource as ProviderResource)?.getApiId?.()
    const n = Number(apiId)
    this.id = Number.isFinite(n) && n > 0 ? n : undefined
    this.createFromColoquentResource(resource)
    return this
  }

  public bindToSave(): ProviderDto {

    if (this.itemResource && !this.itemDto) {
      this.itemDto = new ItemDto().createFromColoquentResource(this.itemResource)
    }
    if (this.itemDto) {
      this.itemDto.bindToSave()
    }
    return this
  }
}
