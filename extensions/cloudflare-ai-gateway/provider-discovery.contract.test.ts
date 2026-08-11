// Cloudflare Ai Gateway tests cover provider discovery.contract plugin behavior.
import { describeCloudflareAiGatewayProviderDiscoveryContract } from "natesclaw/plugin-sdk/provider-test-contracts";

describeCloudflareAiGatewayProviderDiscoveryContract(() => import("./index.js"));
