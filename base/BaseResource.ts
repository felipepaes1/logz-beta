
import { HttpColoquentResponse } from '@/helpers/coloquent-response-helper';
import { HttpClientService } from '../services/http-client.service';
import api_url from '@/services/api';
import { Model, PluralResponse } from 'coloquent';

export class BaseResource extends Model {
    public static httpClientService: HttpClientService;
    public static jsonApiBaseUrl = api_url;
    public static pageSize = 1000;
    public static getApiId: any;
    private static isHttpApiStarted: boolean;

    public constructor() {
        super();
        BaseResource.initHttpApi();
    }

    public static getHttpClient() {
        if (!this.httpClientService) {
            this.httpClientService = new HttpClientService();
        }

        return this.httpClientService;
    }

    public static setPageSize(pageSize: number) {
        this.pageSize = pageSize;

        return this;
    }
    

    protected static getSelectedTenancyId(): string {
        if (typeof window === 'undefined') return '';
        const storedUser = localStorage.getItem('@user_response');
        
        if (storedUser) {
            const userResponse: any = JSON.parse(storedUser);
            const _authData: HttpColoquentResponse = userResponse?.axiosResponse.data;

            return _authData?.data?.['attributes']?.selected_tenancy_id;
        }

        return '';
    }

    protected static creation(action: string, data = {}, model?: BaseResource, jsonApiType?: string) {
        if (!model) {
            model = <BaseResource>(new (<any>this));
        }

        const uri = (jsonApiType ?? model.getJsonApiType()) + '/' + action;

        return this.getHttpClient().post(uri, data);
    }

    protected static action(action: string, data = {}, model?: BaseResource, jsonApiType?: string) {
        if (!model) {
            model = <BaseResource>(new (<any>this));
        }

        const uri = (jsonApiType ?? model.getJsonApiType()) + '/' + action;

        return this.getHttpClient().put(uri, data);
    }

    private static async getParentTenancyIds(): Promise<Array<string>> {
        if (typeof window === 'undefined') return [];
        const storedUser = localStorage.getItem('@user_response');

        const userResponse: any = JSON.parse(storedUser);
        const selectedTenancyId: string = await this.getSelectedTenancyId();
        const included: Array<any> = userResponse?.axiosResponse?.data?.included;
        const selectedTenancy = included?.find(element => element.type == 'tenancies' && element.id == selectedTenancyId);

        return selectedTenancy?.attributes.parent_tenancy_ids ?? [];
    }

    private static async initHttpApi(): Promise<void> {
        return new Promise((resolve) => {
            if (!BaseResource.isHttpApiStarted) {
                BaseResource.getHttpClient();
                BaseResource.httpClientService.setBaseUrl(api_url);
                BaseResource['httpClient'] = BaseResource.httpClientService;
                Model['httpClient'] = BaseResource.httpClientService;
                BaseResource.isHttpApiStarted = true;
            }

            resolve();
        });
    }

    public input(attributePath: string, isRelation?: boolean): any {
        const haystack: Array<string> = attributePath.split('.');

        let data: any = this;

        haystack?.forEach((value, index) => {
            if (index == (haystack.length - 1) && !isRelation) {
                data = value === 'id' ? data?.getApiId() : data?.getAttribute(value);

                return;
            }

            data = data?.getRelation(value);
        });

        return data;
    }
    
    public static async get(): Promise<PluralResponse<InstanceType<M>>> {
        if (!this.isHttpApiStarted) {
            await this.initHttpApi();
            return  this.get();
        }

        return super.get();
    }

    public isInheritedOrShared(): boolean {
        return this.getAttribute('tenancy_id') && this.getAttribute('tenancy_id') != BaseResource.getSelectedTenancyId();
    }

    public async isInherited(): Promise<boolean> {
        const parentTenancyIds = await BaseResource.getParentTenancyIds();

        return this.getAttribute('tenancy_id')
            && parentTenancyIds.includes(this.getAttribute('tenancy_id'));
    }

    public isShared(): boolean {
        return this.isInheritedOrShared() && !this.isInherited();
    }

    public getJsonApiBaseUrl() {
        return api_url;
    }

    public getAttribute(attribute: string) {
        return this.getAttributes()[attribute];
    }

    public setAttribute(attribute: string, value: any) {
        return super.setAttribute(attribute, value);
    }

    public getRelation(relationName: string) {
        return super.getRelation(relationName);
    }

    public clone() {
        const clone = <BaseResource>Object.create(this);

        for (const attributeName in this.getAttributes()) {
            if (attributeName) {
                clone.setAttribute(attributeName, this.getAttribute(attributeName));
            }
        }

        clone.setApiId(this.getApiId());

        for (const relationName in this.getRelations()) {
            if (relationName) {
                const relationValue = this.getRelation(relationName);

                if (Array.isArray(relationValue)) {
                    const clonedRelations: any[] = [];

                    relationValue.forEach((element) => {
                        clonedRelations.push(element.clone());
                    });

                    clone.setRelation(relationName, clonedRelations);
                } else {
                    clone.setRelation(relationName, relationValue?.clone());
                }

                if (relationValue) {
                    clone.setRelation(relationName, relationValue.clone());
                }
            }
        }

        return clone;
    }
}
