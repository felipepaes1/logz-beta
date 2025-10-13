import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { TenancyResource } from "../Tenancy/tenancy.resource";
import { CollaboratorResource } from "../Collaborator/collaborator.resource";

 export class UserResource extends BaseResource {
    public static jsonApiType = "tenants/:tenant_id/users";

    private static buildBase(tenantId?: number | string): string {
    if (tenantId !== undefined && tenantId !== null) {
      return (this.jsonApiType as string).replace(":tenant_id", String(tenantId));
    }
    return (new (this as any)() as BaseResource).getJsonApiType();
  }

    public static async loadAuthenticated(): Promise<HttpClientResponse> {
      const base = this.buildBase();
      return this.getHttpClient().put(`${base}/load-authenticated`, {});
    }

    public static async saveAuthenticated(payload: unknown): Promise<HttpClientResponse> {
      const base = this.buildBase();
      return this.getHttpClient().put(`${base}/save-auth-user`, { user_dto: payload });
    }

    public static async updatePassword(payload: { user_id: string | number; password: string; current_password?: string }): Promise<HttpClientResponse> {
      const base = this.buildBase();
      return this.getHttpClient().put(`${base}/update-password`, payload);
    }

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
