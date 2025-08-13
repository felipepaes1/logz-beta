import { HttpColoquentResponse, processSingularResponse } from '../../helpers/coloquent-response-helper';
import { CompanyResource } from '../Company/company.resource';

import { TenancyResource } from '../Tenancy/tenancy.resource';
import { UserResource } from '../User/user.resource';

export interface Tenancy {
    id: string;
    name: string;
}

export class AuthenticatedUser {
    private static userResource: UserResource;

    public static get id(): string | undefined {
        return this.userResource.getApiId();
    }

    public static get selectedCompany(): CompanyResource {
        return this.getRelation('selectedTenancy')?.getRelation('company') ?? new CompanyResource();
    }

    public static get selectedTenancy(): TenancyResource {
        return this.getRelation('selectedTenancy') ?? new TenancyResource();
    }

    public static async instance(): Promise<UserResource> {
        return await this.loadUserResource();
    }

    public static getAttribute(name: string): any {
        return this.userResource?.getAttribute(name);
    }

    public static getRelation(name: string): any {
        return this.userResource?.getRelation(name);
    }

    public static setAttribute(name: string, value: any): AuthenticatedUser {
        this.userResource.setAttribute(name, value);

        return AuthenticatedUser;
    }

    public static setRelation(name: string, value: any): AuthenticatedUser {
        this.userResource.setRelation(name, value);

        return AuthenticatedUser;
    }

    public static async clearLocalStorage(): Promise<void> {
        this.userResource = new UserResource();
        localStorage.removeItem('@user_response');
    }

    public static async saveOnLocalStorage(response: HttpColoquentResponse): Promise<void> {
        await this.clearLocalStorage();

        const formattedResponse: any = {
            axiosResponse: {
                data: {
                    data: response.data,
                    included: response.included
                }
            }
        };

        const tempUserResource =  <UserResource>processSingularResponse(
            {
                data: [response.data],
                included: response.included,
                coloquentResource: UserResource,
                jsonApiType: 'users',
                response: formattedResponse
            }
        );

        localStorage.setItem('@tenancy_id', String(tempUserResource.getAttribute('tenant_id')) ?? '');
        localStorage.setItem('@tenancy_name', 'Nome empresa');
        localStorage.setItem('@user_response', JSON.stringify(formattedResponse));
        const token = String(tempUserResource.getAttribute('token') ?? '');
        localStorage.setItem("@token", token);
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `token=${token}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
    }

    public static loadUserResource(): Promise<UserResource> {
        return new Promise(async (resolve, reject) => {
            const userResponseString = localStorage.getItem('@user_response');

            if (userResponseString) {
                const userResponse: any = JSON.parse(userResponseString);

                const userData: HttpColoquentResponse = userResponse?.axiosResponse.data;

                this.userResource = <UserResource>processSingularResponse(
                    {
                        data: [userData?.data],
                        included: userData?.included,
                        coloquentResource: UserResource,
                        jsonApiType: 'users',
                        response: userResponse
                    }
                );
                resolve(this.userResource);
            }
        });
    }

    public static loadTenancy(): Promise<Tenancy> {
        return new Promise(async (resolve, reject) => {
            const tenancyId = localStorage.getItem('@tenancy_id');
            const tenancyName = localStorage.getItem('@tenancy_name');

            if (!tenancyId || !tenancyName) {
                reject();
            }

            resolve(
                {
                    id: tenancyId ?? '',
                    name: tenancyName ?? ''
                }
            );
        });
    }

    public static async clearTenancy(): Promise<void> {
        localStorage.removeItem('@tenancy_id');
        localStorage.removeItem('@tenancy_name');
    }

    public static async setTenancy(tenancy: Tenancy){
        localStorage.setItem('@tenancy_id', tenancy.id);

        return localStorage.setItem('@tenancy_name', tenancy.name);
    }
}
