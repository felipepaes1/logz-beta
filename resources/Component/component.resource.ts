import { ToOneRelation } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { CollaboratorResource } from "../Collaborator/collaborator.resource";
import { ItemResource } from "../Item/item.resource";
import { MachineResource } from "../Machine/machine.resource";
import { ComponentDto } from "./component.dto";
import { AttachmentResource } from "../Attachment/attachment.resourse";

export class ComponentResource extends BaseResource {
    public static jsonApiType: string = 'tenants/:tenant_id/components';
    protected static  table = 'components';

    public static createOrUpdate(componentDto: ComponentDto): Promise<any> {
        return this.action('create-or-update', {component_dto: componentDto});
    }

    public collaborator(): ToOneRelation {
        return this.hasOne(CollaboratorResource, 'collaborator');
    }

    public item(): ToOneRelation {
        return this.hasOne(ItemResource, 'item');
    }

    public avatar(): ToOneRelation{
        return this.hasOne(AttachmentResource, 'avatar');
    }

    public machine(): ToOneRelation {
        return this.hasOne(MachineResource, 'machine');
    }
}
