import { BaseResource } from "../../base/BaseResource";
import { ItemGroupDto } from "./item-group.dto"

export class ItemGroupResource extends BaseResource {
    public static jsonApiType = 'tenants/:tenant_id/item-groups';
    protected static table = 'item-groups';

    public static async createOrUpdate(dto: ItemGroupDto): Promise<any> {
        return this.action('invite-or-update', { item_group_dto: dto });
    }

    public static async saveAsNew(dto: ItemGroupDto): Promise<any> {
        return this.action('invite-or-update', { item_group_dto: dto });
    }
}
