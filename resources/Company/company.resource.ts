import { BaseResource } from '../../base/BaseResource';
import api_url from '../../services/api';

export class CompanyResource extends BaseResource {
    public static jsonApiType = 'tenancies/:tenancy_id/system/companies';

    public getAvatarUrl(): string | undefined {
        const avatarUrl: string = this.getRelation('avatar')?.getRelation('attachment')?.getAttribute('url');

        if (avatarUrl) {
            return `${api_url}/${avatarUrl}?mode=R`;
        }

        return;
    }
}
