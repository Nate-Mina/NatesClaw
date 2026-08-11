/** ACP protocol helpers and Natesclaw agent identity metadata. */
export { normalizeAcpProvenanceMode } from "@natesclaw/acp-core/types";
import { VERSION } from "../version.js";

/** ACP agent identity advertised during protocol initialization. */
export const ACP_AGENT_INFO = {
  name: "natesclaw-acp",
  title: "Natesclaw ACP Gateway",
  version: VERSION,
};
