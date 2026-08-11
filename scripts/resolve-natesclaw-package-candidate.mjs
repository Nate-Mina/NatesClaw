import { runTsxCliShim } from "./lib/tsx-cli-shim.mjs";

await runTsxCliShim(import.meta.url, {
  implementation: "./resolve-natesclaw-package-candidate.mts",
});
