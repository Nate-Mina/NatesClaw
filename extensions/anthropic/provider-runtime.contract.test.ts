// Anthropic tests cover provider runtime.contract plugin behavior.
import { describeAnthropicProviderRuntimeContract } from "natesclaw/plugin-sdk/provider-test-contracts";

describeAnthropicProviderRuntimeContract(() => import("./index.js"));
