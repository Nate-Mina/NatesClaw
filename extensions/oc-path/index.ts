// OC Path plugin entrypoint registers its Natesclaw integration.
import { definePluginEntry } from "natesclaw/plugin-sdk/plugin-entry";
import { registerOcPathCli } from "./cli-registration.js";

export default definePluginEntry({
  id: "oc-path",
  name: "OC Path",
  description: "Adds the natesclaw path CLI for oc:// workspace file addressing.",
  register(api) {
    registerOcPathCli(api);
  },
});
