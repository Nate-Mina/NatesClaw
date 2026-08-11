# `@natesclaw/ai`

Reusable model API contracts, provider adapters, and streaming primitives from
Natesclaw. The package supports isolated runtime instances; importing it does not
register providers globally.

```ts
import { createLlmRuntime } from "@natesclaw/ai";
import { registerBuiltInApiProviders } from "@natesclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);
```

Provider-neutral contracts, validation, diagnostics, and event streams are
available from the package root and focused subpaths such as
`@natesclaw/ai/event-stream`, `@natesclaw/ai/transports`, and
`@natesclaw/ai/validation`. No second Natesclaw runtime package is required.

Provider ids, credentials, model catalogs, retries, and failover remain
application concerns. Natesclaw supplies those policies around this package.
Host policy (request fetch guarding, secret redaction, strict-tool defaults,
provider plugin hooks, and diagnostics logging) can be injected with
`configureAiTransportHost`; the defaults are inert.

The explicit `@natesclaw/ai/internal/anthropic`, `openai`, `retry-after`,
`runtime`, and `shared` subpaths exist for the Natesclaw application itself.
They carry no semver guarantee and can change or disappear in any release; do
not depend on them outside Natesclaw.
