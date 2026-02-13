import { BaseDTO } from "../../base/Base.dto";
import { ItemGroupDto } from "../ItemGroup/item-group.dto";
import { ItemGroupResource } from "../ItemGroup/item-group.resource";
import { ManufacturerDto } from "../Manufacturer/manufacturer.dto";
import { ManufacturerResource } from "../Manufacturer/manufacturer.resource";
import { ItemResource } from "./item.resource";
import { ProviderResource } from "../Provider/provider.resource";
import { ProviderDto } from "../Provider/provider.dto";

export class ItemDto extends BaseDTO {
    public active = true;
    public id?: string;
    public name: string;
    public description?: string;
    public observation?: string | null;
    public code: string;
    public quantity: number;
    public min_quantity: number;

    public avatar_id?: number | string | null;
    public avatar?: any;

    public manufacturerResource?: ManufacturerResource;
    public manufacturerDto: ManufacturerDto;

    public itemGroupResource?: ItemGroupResource;
    public itemGroupDto: ItemGroupDto;

    public itemResource: ItemResource;

    public providerResource?: ProviderResource;
    public providerDto?: ProviderDto;
    public provider_id?: number;
    public supplier?: string;

    public createFromColoquentResource(resource: ItemResource): ItemDto {

        if (!resource || typeof resource.getApiId !== "function") {
            return this
        }
        
        this.id = resource?.getApiId();
        this.name = resource?.getAttribute('name');
        this.active = !!resource?.getAttribute('active');
        this.description = resource?.getAttribute('description');
        this.observation = resource?.getAttribute('observation') ?? null;
        this.code = resource?.getAttribute('code');
        this.active = !!resource?.getAttribute('active');
        this.quantity = resource?.getAttribute('quantity');
        this.min_quantity = resource?.getAttribute('min_quantity');
        this.itemResource = resource;
        this.manufacturerResource = resource.getRelation('manufacturer');
        this.itemGroupResource = resource.getRelation('itemGroup');
        this.avatar = resource.getRelation('avatar');
        this.avatar_id =
          resource?.getAttribute?.('avatar_id') ??
          this.avatar?.getApiId?.() ??
          this.avatar?.getAttribute?.('id') ??
          null;
        this.providerResource = resource.getRelation?.('provider');
        this.provider_id = Number(resource?.getAttribute?.('provider_id') ?? this.providerResource?.getApiId?.() ?? NaN) || undefined;
        this.supplier =
          (this.providerResource?.getAttribute?.('company_name') ??
           this.providerResource?.getAttribute?.('name') ??
           resource?.getAttribute?.('supplier')) || undefined;
        
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

        if (this.providerResource) {
            this.providerDto = new ProviderDto().createFromColoquentResource(this.providerResource);
        } else if (this.provider_id) {
            const providerDto = new ProviderDto();
            providerDto.id = this.provider_id;
            this.providerDto = providerDto;
        } else {
            this.providerDto = undefined;
        }

        this.manufacturerDto?.bindToSave?.();
        this.itemGroupDto?.bindToSave?.();
        this.providerDto?.bindToSave?.();

        return this;
    }
}
