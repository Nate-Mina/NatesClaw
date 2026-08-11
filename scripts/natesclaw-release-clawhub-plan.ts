#!/usr/bin/env -S node --import tsx
// Natesclaw release ClawHub plan CLI emits release workflow routing as JSON.

import { pathToFileURL } from "node:url";
import {
  buildNatesclawReleaseClawHubPlan,
  parseNatesclawReleaseClawHubPlanArgs,
} from "./lib/natesclaw-release-clawhub-plan.ts";

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = parseNatesclawReleaseClawHubPlanArgs(process.argv.slice(2));
  const plan = await buildNatesclawReleaseClawHubPlan(args);
  console.log(JSON.stringify(plan, null, 2));
}
