import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { CollaboratorDto } from "./collaborator.dto";

export class CollaboratorResource extends BaseResource {
    public static jsonApiType = 'tenants/:tenant_id/collaborators';
    protected static table = 'collaborators';

    public constructor() {
        super();
    }

    public static async inviteOrUpdate(collaboratorDto: CollaboratorDto): Promise<CollaboratorResource> {
        return this.action('invite-or-update', {collaborator_dto: collaboratorDto});
    }

    public static async reSendInvite(collaboratorId: string): Promise<HttpClientResponse> {
        return this.action('resend-invite', {collaborator_id: collaboratorId});
    }
}
