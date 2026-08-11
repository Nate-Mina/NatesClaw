import { isNatesclawTrustedPluginInstallSpec } from "../plugins/install-provenance.js";

export function validateSystemAgentPluginInstallSpec(spec: string): string | null {
  const trimmed = spec.trim();
  if (!trimmed) {
    return "Plugin install spec is required.";
  }
  if (/\s/.test(trimmed)) {
    return "Natesclaw plugin install accepts one npm or ClawHub package spec.";
  }
  if (/^(?:\.{1,2}\/|\/|~\/|file:|git(?:\+ssh|\+https)?:|https?:)/i.test(trimmed)) {
    // Natesclaw does not install local paths or URLs; those can execute arbitrary package code.
    return "Natesclaw plugin install accepts npm or ClawHub package specs only.";
  }
  if (!isNatesclawTrustedPluginInstallSpec(trimmed)) {
    return "Natesclaw installs only ClawHub, bundled, or official-catalog plugins. Use `natesclaw plugins install <spec>` in a trusted shell to review an arbitrary executable source.";
  }
  return null;
}
