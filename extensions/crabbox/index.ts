import { definePluginEntry } from "natesclaw/plugin-sdk/plugin-entry";
import { createCrabboxWorkerProvider, resolveNatesclawRoot } from "./src/crabbox-worker-provider.js";

export default definePluginEntry({
  id: "crabbox",
  name: "Crabbox Worker Provider",
  description: "Cloud worker provider backed by the Crabbox CLI",
  register(api) {
    api.registerWorkerProvider(
      createCrabboxWorkerProvider({ natesclawRoot: resolveNatesclawRoot(api.rootDir) }),
    );
  },
});
