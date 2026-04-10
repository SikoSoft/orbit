import { config } from '../models/Config';
import { ForbiddenApiRequestEvent } from '@/events/forbidden-api-request';
import {
  NetworkApiRequestFailedEvent,
  type NetworkApiRequestFailedEventPayload,
} from '@/events/network-api-request-failed';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

export interface ApiResponse<ResponseBodyType> {
  status: number;
  isOk: boolean;
  response: ResponseBodyType;
}

export type ApiResult<ResponseBodyType> = ApiResponse<ResponseBodyType> | null;

export type ApiErrorType = 'http' | 'offline' | 'network';

export interface ApiErrorContext {
  type: ApiErrorType;
  url: string;
  status?: number;
  error?: unknown;
}

export const emptyResponseCodes = [202, 204];
export const okResponseCodes = [200, 201, 202, 204];
export const serverErrorResponseCodes = [500, 502, 503, 504];

export interface RequestConfig {
  method: string | undefined;
  headers: HeadersInit;
  body: BodyInit;
}

export interface ApiConfig {
  authToken: string;
  baseUrl: string;
  errorHandler: (context: ApiErrorContext) => void;
}

export class Api {
  private authToken: string;
  private lastNetworkErrorToastAt: number = 0;

  constructor(private config: ApiConfig) {
    this.authToken = config.authToken;
  }

  private handleError(url: URL, error: unknown): void {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    this.config.errorHandler({
      type: isOffline ? 'offline' : 'network',
      url: url.href,
      error,
    });
  }

  shouldShowNetworkErrorToast(now: number): boolean {
    if (now - this.lastNetworkErrorToastAt <= 5000) {
      return false;
    }

    this.lastNetworkErrorToastAt = now;
    return true;
  }

  async httpRequest<ResponseType>(
    path: string,
    config: RequestInit,
  ): Promise<ApiResult<ResponseType>> {
    let json: unknown;

    const headers = new Headers(config.headers);

    headers.append('authorization', this.authToken);

    const abortController = new AbortController();

    const url = new URL(path, this.config.baseUrl);
    const request = new Request(url, {
      ...config,
      headers,
      signal: abortController.signal,
    });

    try {
      const response = await fetch(request);

      if (response.ok && !emptyResponseCodes.includes(response.status)) {
        json = await response.json();
      }

      if (!okResponseCodes.includes(response.status)) {
        this.config.errorHandler({
          type: 'http',
          status: response.status,
          url: url.href,
        });
      }

      return {
        status: response.status,
        isOk: okResponseCodes.includes(response.status),
        response: json as ResponseType,
      };
    } catch (error) {
      this.handleError(url, error);
      console.error(`Api encountered an error performing request: ${error}`);
    }

    return null;
  }

  async get<ResponseType>(
    path: string,
    config?: RequestInit,
  ): Promise<ApiResult<ResponseType>> {
    return await this.httpRequest<ResponseType>(path, {
      method: 'get',
      ...config,
    });
  }

  async post<RequestType, ResponseType>(
    path: string,
    body: RequestType,
    config?: RequestInit,
  ): Promise<ApiResult<ResponseType>> {
    return await this.httpRequest<ResponseType>(path, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      ...config,
    });
  }

  async put<RequestType, ResponseType>(
    path: string,
    body: RequestType,
    config?: RequestInit,
  ): Promise<ApiResult<ResponseType>> {
    return await this.httpRequest<ResponseType>(path, {
      method: 'put',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      ...config,
    });
  }

  async delete<ResponseType>(
    path: string,
    config?: RequestInit,
  ): Promise<ApiResult<ResponseType>> {
    return await this.httpRequest<ResponseType>(path, {
      method: 'delete',
      ...config,
    });
  }

  setAuthToken(authToken: string): void {
    this.authToken = authToken;
  }
}

export const api = new Api({
  authToken: '',
  baseUrl: config.apiUrl,
  errorHandler: ({ status, type, url }: ApiErrorContext): void => {
    if (type === 'http' && status === 403) {
      window.dispatchEvent(new ForbiddenApiRequestEvent({ url }));
      return;
    }

    if (type === 'offline' || type === 'network') {
      const payload: NetworkApiRequestFailedEventPayload = {
        type,
        url,
      };
      window.dispatchEvent(new NetworkApiRequestFailedEvent(payload));

      const now = Date.now();
      if (api.shouldShowNetworkErrorToast(now)) {
        addToast(
          translate(
            type === 'offline' ? 'offlineDetected' : 'networkUnavailable',
          ),
          NotificationType.ERROR,
        );
      }
    }
  },
});
