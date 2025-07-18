import { BaseDTO } from "../../base/Base.dto";
import { CollaboratorDto } from "../Collaborator/collaborator.dto";
import { CollaboratorResource } from "../Collaborator/collaborator.resource";
import { ItemDto } from "../Item/item.dto";
import { ItemResource } from "../Item/item.resource";
import { ItemGroupResource } from "../ItemGroup/item-group.resource";
import { MachineDto } from "../Machine/machine.dto";
import { MachineResource } from "../Machine/machine.resource";
import { PcpDto } from "../Pcp/pcp.dto";
import { PcpResource } from "../Pcp/pcp.resource";
import { UserResource } from "../User/user.resource";
import { ComponentTypeEnum } from "./component.enum";
import { standardComponentTypeOption } from "./component.meta";
import { ComponentResource } from "./component.resource";

export class ComponentDto extends BaseDTO {
    public id?: string;
    public quantity: number;
    public type: ComponentTypeEnum;
    public created_at: string;
    public unitPrice: number;
    public totalPrice: number;
    public orderNumber: string;
    public avatar: any;


    public pcp: string;
    public production_order_id: string;
    public active: boolean = true;
    public justification: string;
    public created_at: string;
    public unitPrice: number;
    public totalPrice: number;
    public orderNumber: string;

    public isEditing: boolean = true;
    public componentType: any = standardComponentTypeOption;

    public componentResource: ComponentResource;

    public itemDto: ItemDto;
    public itemResource: ItemResource;
    public itemGroupResource: ItemGroupResource;

    public collaboratorResource: CollaboratorResource;
    public collaboratorDto: CollaboratorDto;
    public userResource: UserResource;

    public machineResource: MachineResource;
    public machineDto: MachineDto;

    public pcpResource: PcpResource;
    public pcpDto: PcpDto;

    public createFromColoquentResource(resource: ComponentResource): ComponentDto {
        if (!resource) {
            return;
        }

        this.componentResource = resource;
        this.collaboratorDto = new CollaboratorDto().createFromColoquentResource(resource.getRelation('collaborator'));
        this.collaboratorResource = resource.getRelation('collaborator');

        if (resource.getRelation('item')) {
            this.itemDto = new ItemDto().createFromColoquentResource(resource.getRelation('item'));
            this.itemResource = resource.getRelation('item');
        }

        if (resource.getRelation('machine')) {
            this.machineDto = new MachineDto().createFromColoquentResource(resource.getRelation('machine'));
            this.machineResource = resource.getRelation('machine');
        }

        this.id = resource.getApiId();
        this.quantity = resource.getAttribute('quantity');
        this.justification = resource.getAttribute('justification');
        this.type = resource.getAttribute('type');
        this.unitPrice = resource.getAttribute('unit_price');
        this.totalPrice = resource.getAttribute('total_price');
        this.orderNumber = resource.getAttribute('order_number');
        this.pcpDto = new PcpDto().createFromColoquentResource(resource.getRelation('pcp'));
        this.pcpResource = resource.getRelation('pcp');
        this.created_at = resource.getAttribute('created_at');
        this.isEditing = false;

        return this;
    }

    public bindToSave(): ComponentDto {
        if (this.machineResource) {
            this.machineDto = new MachineDto().createFromColoquentResource(this.machineResource);
        }

        if (this.itemResource) {
            this.itemDto = new ItemDto().createFromColoquentResource(this.itemResource);
        }

        if (this.collaboratorResource) {
            this.collaboratorDto = new CollaboratorDto().createFromColoquentResource(this.collaboratorResource);
        }

        if (this.pcpResource) {
            this.pcpDto = new PcpDto().createFromColoquentResource(this.pcpResource);
        }

        if (this.pcpDto?.id){
            this.production_order_id = this.pcpDto.id;
        }

        return this;
    }
}
