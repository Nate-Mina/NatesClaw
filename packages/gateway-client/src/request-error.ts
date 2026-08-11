import { formatConnectErrorMessage } from "@natesclaw/gateway-protocol/connect-error-details";
import type { ErrorShape } from "@natesclaw/gateway-protocol/frame-guards";
import { GatewayProtocolRequestError } from "./protocol-request.js";

export class GatewayClientRequestError extends GatewayProtocolRequestError {
  constructor(error: Partial<ErrorShape>) {
    super({
      ...error,
      message: formatConnectErrorMessage({ message: error.message, details: error.details }),
    });
    this.name = "GatewayClientRequestError";
  }
}
