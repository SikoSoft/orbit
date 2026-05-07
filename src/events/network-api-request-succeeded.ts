export const networkApiRequestSucceededEventName =
  'network-api-request-succeeded';

export type NetworkApiRequestSucceededPayload = Record<string, never>;

export class NetworkApiRequestSucceededEvent extends CustomEvent<NetworkApiRequestSucceededPayload> {
  constructor(detail: NetworkApiRequestSucceededPayload) {
    super(networkApiRequestSucceededEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
