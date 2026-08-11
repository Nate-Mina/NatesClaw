// Migrate Claude plugin entrypoint registers its Natesclaw integration.
import { definePluginEntry } from "natesclaw/plugin-sdk/plugin-entry";
import { buildClaudeMigrationProvider } from "./provider.js";

export default definePluginEntry({
  id: "migrate-claude",
  name: "Claude Migration",
  description: "Imports Claude state into Natesclaw.",
  register(api) {
    api.registerMigrationProvider(buildClaudeMigrationProvider({ runtime: api.runtime }));
  },
});
