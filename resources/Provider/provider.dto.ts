import { BaseDTO } from "../../base/Base.dto"
import { ItemDto } from "../Item/item.dto"
import { ItemResource } from "../Item/item.resource"
import { ProviderResource } from "./provider.resource"

export class ProviderDto extends BaseDTO {
  public id?: string

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

    this.id = resource.getApiId()
    this.company_name = resource.getAttribute("company_name")
    this.seller = resource.getAttribute("seller")
    this.phone = resource.getAttribute("phone")
    this.email = resource.getAttribute("email")
    this.delivery_time = resource.getAttribute("delivery_time")
    this.observation = resource.getAttribute("observation")

    this.itemResource = resource.getRelation("item")
    if (this.itemResource) {
      this.itemDto = new ItemDto().createFromColoquentResource(this.itemResource)
    }

    return this
  }

  public createFromParentColoquentResource(resource: ProviderResource): ProviderDto {
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
