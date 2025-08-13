import { AxiosPromise, AxiosRequestConfig, AxiosError } from 'axios';
import { HttpClientResponse } from 'coloquent';
import { AxiosHttpClientPromise } from 'coloquent/dist/httpclient/axios/AxiosHttpClientPromise';

interface HttpErrorResponse {
  config: AxiosRequestConfig;
  headers?: Record<string, any>;
  request?: XMLHttpRequest;
  response?: any;
  status?: number;
  statusText?: string;
  data?: any;
}

export interface HttpError {
  status: number;
  message: string;
}

export class RequestHandler {
  public async handle(promise: AxiosPromise): Promise<HttpClientResponse> {
    const handlerPromise = new Promise((resolve, reject) => {
      promise
        .then((response) => resolve(response))
        .catch((error: AxiosError) => {
          // normaliza a estrutura do erro
          const normalized: HttpErrorResponse = {
            config: error.config as AxiosRequestConfig,
            headers: (error.response?.headers ?? {}) as Record<string, any>,
            request: (error as any).request,
            response: error.response,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          };

          reject(this.proccessRequestError(normalized));
        });
    });

    return new AxiosHttpClientPromise(<any>handlerPromise);
  }

  private proccessRequestError(errorResponse: HttpErrorResponse) {
    if (this.isInvalidOrExpiredToken(errorResponse)) {
      return this.handleInvalidOrExpiredToken();
    }

    if (errorResponse?.status !== 403) {
      return this.handleGenericError(errorResponse);
    }

    this.handleAccessDenied();
  }

  private handleInvalidOrExpiredToken(): void {
    // AuthenticatedUser.clearLocalStorage();
    // window.location.href = '/login';
  }

  private handleGenericError(errorResponse: HttpErrorResponse): {} {
    const message: string =
      typeof errorResponse?.data === 'string'
        ? errorResponse.data
        : errorResponse?.data?.message ||
          'Erro desconhecido. Por favor, contate o suporte.';

    return {
      message,
      status: errorResponse?.status ?? 0,
    };
  }

  private handleAccessDenied(): void {
    // this.router.navigate(['403']);
  }

  private isInvalidOrExpiredToken(errorResponse: HttpErrorResponse): boolean {
    const status = errorResponse?.status;
    const message = errorResponse?.data?.message;
    // mantém sua regra antiga e cobre Unauthenticated
    return (status === 400 && !String(message ?? '').includes('Requested filter(s)')) || message === 'Unauthenticated.';
  }
}
