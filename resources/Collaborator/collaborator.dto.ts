import { BaseDTO } from "../../base/Base.dto";
import { CollaboratorResource } from "./collaborator.resource";

export class CollaboratorDto extends BaseDTO {
    public id?: string;
    public tenant_id: number;
    public active = true;
    public user_id: number;
    public name: string;
    public code: string;
    public document_number: string;
    public phone: string;

    public collaboratorResource: CollaboratorResource;

    public createFromColoquentResource(collaboratorResource: CollaboratorResource): CollaboratorDto {
        this.collaboratorResource = collaboratorResource;
        this.id = collaboratorResource.getApiId();
        this.tenant_id = collaboratorResource.getAttribute('tenant_id');
        this.active = !!collaboratorResource.getAttribute('active');
        this.user_id = collaboratorResource.getAttribute('user_id');
        this.name = collaboratorResource.getAttribute('name');
        this.code = collaboratorResource.getAttribute('code');
        this.document_number = collaboratorResource.getAttribute('document_number');
        this.phone = collaboratorResource.getAttribute('phone');

        return this;
    }

    public bindToSave(): CollaboratorDto {
        return this;
    }
}
