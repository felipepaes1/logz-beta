import axios, { AxiosInstance, AxiosRequestConfig, ResponseType, AxiosError } from 'axios';
import { HttpClient } from 'coloquent';
import { HttpColoquentResponse } from '../helpers/coloquent-response-helper';

import { RequestHandler } from './request-handler.service';
import api_url from './api';
import { buildQueryStringFromParams } from '@/utils/http/http-helper';

function isBrowser() {
  return typeof window !== 'undefined';
}

function getCookie(name: string): string {
  if (!isBrowser()) return '';
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

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
    this.axiosInstance = axios.create({
      baseURL: api_url,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // === Interceptor de REQUISIÇÃO ===
    this.axiosInstance.interceptors.request.use((config) => {
      // 1) Injeta Authorization sempre
      const tokenJWT = this.userJWT();
      if (tokenJWT) {
        config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${tokenJWT}` };
      }

      // 2) Interpola :tenant_id se presente
      if (config.url && config.url.includes(':tenant_id')) {
        const tid = this.getSelectedTenancyId();
        if (!tid) {
          // Cancela ANTES de sair para a rede (evita 401/404 por URL inválida)
          const err = new axios.Cancel('Missing tenancy id (@tenancy_id).');
          throw err;
        }
        const [path, qs] = config.url.split('?');
        const interpolated = path.replace(':tenant_id', tid);
        config.url = qs ? `${interpolated}?${qs}` : interpolated;
      }

      return config;
    });

    // === Interceptor de RESPOSTA ===
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        // Ignora cancelamentos do interceptor acima
        if (axios.isCancel(error)) {
          return Promise.reject({ status: 0, message: String(error.message || 'Request cancelled') });
        }

        if (this.isUnauthorized(error)) {
          this.clearAuthAndRedirect();
        }
        return Promise.reject(error);
      }
    );
  }

  // Mantido por compatibilidade com chamadores existentes
  public async prepareAuthentication(): Promise<void> {
    const tokenJWT: string = this.userJWT();
    if (tokenJWT) {
      this.requestConfig.headers = this.requestConfig.headers ?? {};
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
    return this.requestConfig.responseType as ResponseType;
  }

  public resetResponseType(): void {
    this.requestConfig.responseType = 'json';
  }

  public setAccept(accept: string): void {
    this.requestConfig.headers = this.requestConfig.headers ?? {};
    this.requestConfig.headers['accept'] = accept;
  }

  public getAccept(): string {
    return (this.requestConfig.headers as any)?.['accept'];
  }

  public resetAcceptHeader(): void {
    this.requestConfig.headers = this.requestConfig.headers ?? {};
    this.requestConfig.headers['accept'] = 'application/json, text/plain, */*';
  }

  public setWithCredentials(withCredientials: any): void {
    this.axiosInstance.defaults.withCredentials = withCredientials;
  }

  public async get(url: string, params?: any): Promise<any> {
    await this.prepareAuthentication();
    url = this.bindUrlForTenancy(url);

    if (params) {
      const query: string = buildQueryStringFromParams(params);
      if (query && query.length > 0) {
        url = url + (url.includes("?") ? "&" : "?") + query;
      }
    }

    return <any>this.requestHandler.handle(this.axiosInstance.get(url, this.requestConfig));
  }

  public async delete(url: string): Promise<any> {
    await this.prepareAuthentication();
    url = this.bindUrlForTenancy(url);

    return <any>this.requestHandler.handle(this.axiosInstance.delete(url, this.requestConfig));
  }

  public async head(url: string): Promise<any> {
    await this.prepareAuthentication();
    url = this.bindUrlForTenancy(url);

    return <any>this.requestHandler.handle(this.axiosInstance.head(url, this.requestConfig));
  }

  public async post(url: string, data?: any): Promise<any> {
    await this.prepareAuthentication();
    url = this.bindUrlForTenancy(url);

    return <any>this.requestHandler.handle(this.axiosInstance.post(url, data, this.requestConfig));
  }

  public async put(url: string, data?: any): Promise<any> {
    await this.prepareAuthentication();
    url = this.bindUrlForTenancy(url);

    return <any>this.requestHandler.handle(this.axiosInstance.put(url, data, this.requestConfig));
  }

  public async patch(url: string, data?: any): Promise<any> {
    await this.prepareAuthentication();
    url = this.bindUrlForTenancy(url);

    return <any>this.requestHandler.handle(this.axiosInstance.patch(url, data, this.requestConfig));
  }

  public getImplementingClient(): AxiosInstance {
    return this.axiosInstance;
  }

  private bindUrlForTenancy(url: string) {
  const tid = this.getSelectedTenancyId();
  if (url && tid && (url + '').includes(':tenant_')) {
    const [path, qs] = (url + '').split('?');
    const interpolated = path
      .replace(/:tenant_id/g, tid)
      .replace(/:tenancy_id/g, tid);
    return qs ? `${interpolated}?${qs}` : interpolated;
  }
  return url;
  }

  // Lê token de @token → @user_response → cookie
  private userJWT(): string {
    if (!isBrowser()) return '';

    const direct = localStorage.getItem('@token');
    if (direct && direct !== 'undefined') {
      return direct;
    }

    const userResponseString = localStorage.getItem('@user_response');
    if (userResponseString) {
      try {
        const userResponse: any = JSON.parse(userResponseString);
        const userData: HttpColoquentResponse = userResponse?.axiosResponse?.data;
        const t = userData?.data?.['attributes']?.['token'];
        if (t) return String(t);
      } catch {}
    }

    const cookieToken = getCookie('token');
    return cookieToken || '';
  }

  private getSelectedTenancyId(): string {
    if (!isBrowser()) return '';
    return localStorage.getItem('@tenancy_id') || '';
  }

  private isUnauthorized(error: any): boolean {
    const status = error?.response?.status;
    const msg = error?.response?.data?.message;
    return status === 401 || msg === 'Unauthenticated.';
  }

  private clearAuthAndRedirect(): void {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem('@user_response');
      localStorage.removeItem('@tenancy_id');
      localStorage.removeItem('@tenancy_name');
      localStorage.removeItem('@token');
      document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
    } finally {
      window.location.href = '/login';
    }
  }
}
