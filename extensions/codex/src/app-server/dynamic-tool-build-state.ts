type NatesclawCodingToolsFactory =
  (typeof import("natesclaw/plugin-sdk/agent-harness"))["createNatesclawCodingTools"];

/** Mutable dependency seam shared by dynamic-tool construction and its behavioral tests. */
export const dynamicToolBuildState: {
  NatesclawCodingToolsFactory?: NatesclawCodingToolsFactory;
} = {};
