import { BaseDTO } from "../../base/Base.dto";
import { ItemGroupDto } from "../ItemGroup/item-group.dto";
import { ItemGroupResource } from "../ItemGroup/item-group.resource";
import { ManufacturerDto } from "../Manufacturer/manufacturer.dto";
import { ManufacturerResource } from "../Manufacturer/manufacturer.resource";
import { ItemResource } from "./item.resource";

export class ItemDto extends BaseDTO {
    public active = true;
    public id?: string;
    public name: string;
    public description: string;
    public code: string;
    public quantity: number;
    public min_quantity: number;

    public avatar_id: string;
    public avatar: any;

    public manufacturerResource: ManufacturerResource;
    public manufacturerDto: ManufacturerDto;

    public itemGroupResource: ItemGroupResource;
    public itemGroupDto: ItemGroupDto;

    public itemResource: ItemResource;

    public createFromColoquentResource(resource: ItemResource): ItemDto {
        this.id = resource?.getApiId();
        this.name = resource?.getAttribute('name');
        this.active = !!resource?.getAttribute('active');
        this.description = resource?.getAttribute('description');
        this.code = resource?.getAttribute('code');
        this.active = !!resource?.getAttribute('active');
        this.quantity = resource?.getAttribute('quantity');
        this.min_quantity = resource?.getAttribute('min_quantity');
        this.itemResource = resource;
        this.manufacturerResource = resource.getRelation('manufacturer');
        this.itemGroupResource = resource.getRelation('itemGroup');
        this.avatar = resource.getRelation('avatar');
        
        if (resource.getRelation('manufacturer')) {
            this.manufacturerDto = new ManufacturerDto().createFromColoquentResource(resource.getRelation('manufacturer'));
        }
        
        this.itemGroupDto = new ItemGroupDto().createFromColoquentResource(resource.getRelation('itemGroup'));

        return this;
    }

    public createFromParentColoquentResource(resource: ItemResource): ItemDto {
        this.createFromColoquentResource(resource);

        return this;
    }

    public bindToSave(): ItemDto {
        if (this.manufacturerResource) {
            this.manufacturerDto = new ManufacturerDto().createFromColoquentResource(this.manufacturerResource);
        }

        if (this.itemGroupResource) {
            this.itemGroupDto = new ItemGroupDto().createFromColoquentResource(this.itemGroupResource);
        }

        this.manufacturerDto.bindToSave();
        this.itemGroupDto.bindToSave();

        return this;
    }
}
