import { BaseResource } from "../../base/BaseResource";
import { ItemDto } from "../Item/item.dto";

export class ItemGroupResource extends BaseResource {
    public static jsonApiType = 'item-groups';
    protected static table = 'item-groups';

    public static async createOrUpdate(itemDto: ItemDto): Promise<any> {
        return this.action('create-or-update', {item_dto: itemDto});
    }

    public static async saveAsNew(itemDto: ItemDto): Promise<any> {
        return this.action('save-as-new', {item_dto: itemDto});
    }
}
