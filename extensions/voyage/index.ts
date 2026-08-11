// Voyage plugin entrypoint registers its Natesclaw integration.
import { definePluginEntry } from "natesclaw/plugin-sdk/plugin-entry";
import { voyageMemoryEmbeddingProviderAdapter } from "./memory-embedding-adapter.js";

export default definePluginEntry({
  id: "voyage",
  name: "Voyage Embeddings",
  description: "Voyage memory embedding provider plugin",
  register(api) {
    api.registerMemoryEmbeddingProvider(voyageMemoryEmbeddingProviderAdapter);
  },
});
