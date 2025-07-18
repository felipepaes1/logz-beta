import axios, { AxiosInstance, AxiosRequestConfig, ResponseType } from 'axios';
import { HttpClient } from 'coloquent';
import { HttpColoquentResponse } from '../helpers/coloquent-response-helper';

import { RequestHandler } from './request-handler.service';
import api_url from './api';
import { buildQueryStringFromParams } from '@/utils/http/http-helper';

export class HttpClientService implements HttpClient {
    public withLoader: boolean = true;
    public withErrorAlert: boolean = true;

    private requestHandler: RequestHandler;
    private axiosInstance: AxiosInstance;
    private requestConfig: AxiosRequestConfig = {
        headers: {}
    };

    public constructor() {
        this.requestHandler = new RequestHandler();
        this.axiosInstance = axios.create(
            {
                baseURL: api_url,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }
        );
    }

    public async prepareAuthentication(): Promise<void> {
        const tokenJWT: string = this.userJWT();

        if (tokenJWT) {
            this.requestConfig.headers['Authorization'] = 'Bearer ' + tokenJWT;
        }
    }

    public setBaseUrl(baseUrl: string): void {
        this.axiosInstance.defaults.baseURL = baseUrl;
    }

    public setResponseType(responseType: ResponseType): void {
        this.requestConfig.responseType = responseType;
    }

    public getResponseType(): ResponseType {
        return this.requestConfig.responseType;
    }

    public resetResponseType(): void {
        this.requestConfig.responseType = 'json';
    }

    public setAccept(accept: string): void {
        this.requestConfig.headers['accept'] = accept;
    }

    public getAccept(): string {
        return this.requestConfig.headers['accept'];
    }

    public resetAcceptHeader(): void {
        this.requestConfig.headers['accept'] = 'application/json, text/plain, */*';
    }

    public setWithCredentials(withCredientials: any): void {
        this.axiosInstance.defaults.withCredentials = withCredientials;
    }

    public async get(url: string, params?: any): Promise<any> {
        this.prepareAuthentication();
        url = this.bindUrlForTenancy(url);

        if (params) {
            const query: string = buildQueryStringFromParams(params);

            url = url + "?" + query;
        }

        return <any>this.requestHandler.handle(this.axiosInstance.get(url, this.requestConfig));
    }

    public async delete(url: string): Promise<any> {
        this.prepareAuthentication();
        url = this.bindUrlForTenancy(url);

        return <any>this.requestHandler.handle(this.axiosInstance.delete(url, this.requestConfig));
    }

    public async head(url: string): Promise<any> {
        await this.prepareAuthentication();
        url = this.bindUrlForTenancy(url);

        return <any>this.requestHandler.handle(this.axiosInstance.head(url, this.requestConfig));
    }

    public async post(url: string, data?: any): Promise<any> {
        this.prepareAuthentication();
        url = this.bindUrlForTenancy(url);

        return <any>this.requestHandler.handle(this.axiosInstance.post(url, data, this.requestConfig));
    }

    public async put(url: string, data?: any): Promise<any> {
        this.prepareAuthentication();
        url = this.bindUrlForTenancy(url);

        return <any>this.requestHandler.handle(this.axiosInstance.put(url, data, this.requestConfig));
    }

    public async patch(url: string, data?: any): Promise<any> {
        this.prepareAuthentication();
        url = this.bindUrlForTenancy(url);

        return <any>this.requestHandler.handle(this.axiosInstance.put(url, data, this.requestConfig));
    }

    public getImplementingClient(): AxiosInstance {
        return this.axiosInstance;
    }

    private bindUrlForTenancy(url: string) {
        if (url && this.getSelectedTenancyId()) {
            return (url + '').replace(':tenant_id', this.getSelectedTenancyId());
        } else {
            return url;
        }
    }

    private userJWT(): string {
        const userResponseString = localStorage.getItem('@user_response');

        if (userResponseString) {
            const userResponse: any = JSON.parse(userResponseString);
            const userData: HttpColoquentResponse = userResponse?.axiosResponse.data;

            return userData?.data?.['attributes']?.['token'];
        }

        return '';
    }

    private getSelectedTenancyId(): string {
        return localStorage.getItem('@tenancy_id') || '';
    }
}
