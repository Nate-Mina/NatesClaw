// Perplexity plugin entrypoint registers its Natesclaw integration.
import { definePluginEntry } from "natesclaw/plugin-sdk/plugin-entry";
import { createPerplexityWebSearchProvider } from "./src/perplexity-web-search-provider.js";

export default definePluginEntry({
  id: "perplexity",
  name: "Perplexity Plugin",
  description: "Bundled Perplexity plugin",
  register(api) {
    api.registerWebSearchProvider(createPerplexityWebSearchProvider());
  },
});
