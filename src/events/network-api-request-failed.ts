export const networkApiRequestFailedEventName = 'network-api-request-failed';

export interface NetworkApiRequestFailedEventPayload {
  type: 'offline' | 'network';
  url: string;
}

export class NetworkApiRequestFailedEvent extends CustomEvent<NetworkApiRequestFailedEventPayload> {
  constructor(detail: NetworkApiRequestFailedEventPayload) {
    super(networkApiRequestFailedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
