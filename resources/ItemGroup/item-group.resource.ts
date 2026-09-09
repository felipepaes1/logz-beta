import { BaseResource } from "../../base/BaseResource";
import { ItemGroupDto } from "./item-group.dto"

export class ItemGroupResource extends BaseResource {
  public static jsonApiType = 'tenants/:tenant_id/item-groups';
  protected static table = 'item-groups';

  public static async createOrUpdate(dto: ItemGroupDto): Promise<any> {
    return this.action('invite-or-update', { item_group_dto: this.toSavePayload(dto) });
  }

  public static async saveAsNew(dto: ItemGroupDto): Promise<any> {
    return this.action('invite-or-update', { item_group_dto: this.toSavePayload(dto) });
  }

  private static toSavePayload(dto: ItemGroupDto) {
    const payload: { id?: number; description: string } = {
      description: dto.description,
    };

    if (dto.id !== undefined && dto.id !== null) {
      const numericId = Number(dto.id);
      if (Number.isFinite(numericId)) payload.id = numericId;
    }

    return payload;
  }
}
