import { ToOneRelation } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { ManufacturerResource } from "../Manufacturer/manufacturer.resource";
import { ItemGroupResource } from "../ItemGroup/item-group.resource";
import { MachineResource } from "../Machine/machine.resource";
import { ItemDto } from "./item.dto";
import { AttachmentResource } from "../Attachment/attachment.resourse";

export class ItemResource extends BaseResource {
    public static jsonApiType = 'tenants/:tenant_id/items';

    public static async createOrUpdate(itemDto: ItemDto): Promise<any> {
        return this.action('create-or-update', {item_dto: itemDto});
    }

    public static async deleteMany(itemIds: Array<number | string>, tenantId?: number | string): Promise<void> {
        if (!itemIds?.length) return;

        const base = tenantId
          ? (this.jsonApiType as string).replace(':tenant_id', String(tenantId))
          : (new (this as any)() as BaseResource).getJsonApiType();

        const idsCsv = itemIds.join(',');
        const uri = `${base}/${idsCsv}`; 

        await this.getHttpClient().delete(uri);
    }

    public static async dismarkAsPreOrdered(itemIds: Array<number | string>): Promise<any> {
        return this.action('dismark-as-pre-ordered', { item_ids: itemIds });
    }

    public static async markAsPreOrdered(itemIds: Array<number | string>): Promise<any> {
        return this.action('mark-as-pre-ordered', { item_ids: itemIds });
    }

    public static async saveAsNew(itemDto: ItemDto): Promise<any> {
        return this.action('save-as-new', {item_dto: itemDto});
    }

    public manufacturer(): ToOneRelation {
        return this.hasOne(ManufacturerResource, 'manufacturer');
    }

    public itemGroup(): ToOneRelation {
        return this.hasOne(ItemGroupResource, 'itemGroup');
    }

    public avatar(): ToOneRelation{
        return this.hasOne(AttachmentResource, 'avatar');
    }

    public machine(): ToOneRelation {
        return this.hasOne(MachineResource, 'machine');
    }
}
