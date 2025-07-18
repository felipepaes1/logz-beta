import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { TenancyResource } from "../Tenancy/tenancy.resource";
import { CollaboratorResource } from "../Collaborator/collaborator.resource";

export class UserResource extends BaseResource {
    public static jsonApiType = "tenancies/:tenancy_id/system/users";

    public static async acceptPlatformUsageTerms(userId?: string, login?: string): Promise<HttpClientResponse> {
        return this.action(
            'accept-platform-usage-terms',
            { accept_data: { user_id: userId, login: login } },
            undefined,
            'system/users'
        );
    }

    public tenancies() {
        return this.hasMany(TenancyResource, 'tenancies');
    }

    public collaborator() {
        return this.hasOne(CollaboratorResource, 'collaborator');
    }

    public selectedTenancy() {
        return this.hasOne(TenancyResource, 'selectedTenancy');
    }
}
