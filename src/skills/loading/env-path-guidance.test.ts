// Env path guidance tests cover user-facing guidance for skill path environment config.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");

type GuidanceCase = {
  file: string;
  required?: string[];
  forbidden?: string[];
};

const CASES: GuidanceCase[] = [
  {
    file: "skills/session-logs/SKILL.md",
    required: ["NATESCLAW_STATE_DIR"],
    forbidden: [
      "for f in ~/.natesclaw/agents/<agentId>/sessions/*.jsonl",
      'rg -l "phrase" ~/.natesclaw/agents/<agentId>/sessions/*.jsonl',
      "~/.natesclaw/agents/<agentId>/sessions/<id>.jsonl",
    ],
  },
  {
    file: "skills/gh-issues/SKILL.md",
    required: ["NATESCLAW_CONFIG_PATH"],
    forbidden: ["cat ~/.natesclaw/natesclaw.json"],
  },
  {
    file: "extensions/canvas/skills/canvas/SKILL.md",
    required: ["NATESCLAW_CONFIG_PATH"],
    forbidden: ["cat ~/.natesclaw/natesclaw.json"],
  },
  {
    file: "skills/openai-whisper-api/SKILL.md",
    required: ["NATESCLAW_CONFIG_PATH"],
  },
  {
    file: "skills/sherpa-onnx-tts/SKILL.md",
    required: [
      "NATESCLAW_STATE_DIR",
      "NATESCLAW_CONFIG_PATH",
      'STATE_DIR="${NATESCLAW_STATE_DIR:-$HOME/.natesclaw}"',
    ],
    forbidden: [
      'SHERPA_ONNX_RUNTIME_DIR: "~/.natesclaw/tools/sherpa-onnx-tts/runtime"',
      'SHERPA_ONNX_MODEL_DIR: "~/.natesclaw/tools/sherpa-onnx-tts/models/vits-piper-en_US-lessac-high"',
      "<state-dir>",
    ],
  },
  {
    file: "skills/coding-agent/SKILL.md",
    required: [
      "NATESCLAW_STATE_DIR",
      "CODEX_WORKER_HOME",
      'CODEX_HOME="$CODEX_WORKER_HOME" codex login status',
      "env -u CODEX_API_KEY -u CODEX_ACCESS_TOKEN -u OPENAI_API_KEY",
    ],
    forbidden: [
      "NEVER start Codex in ~/.natesclaw/",
      'command:"codex exec - < \\"$PROMPT\\""',
      "CODEX_HOME=~/.codex",
      "CODEX_HOME=/absolute/codex-worker-home",
    ],
  },
];

describe("bundled skill env-path guidance", () => {
  it.each(CASES)(
    "keeps $file aligned with NATESCLAW env overrides",
    ({ file, required, forbidden }) => {
      const content = fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
      for (const needle of required ?? []) {
        expect(content).toContain(needle);
      }
      for (const needle of forbidden ?? []) {
        expect(content).not.toContain(needle);
      }
    },
  );
  it("isolates every bundled Codex worker launch from ambient auth", () => {
    const content = fs.readFileSync(path.join(REPO_ROOT, "skills/coding-agent/SKILL.md"), "utf8");
    const launches = content.split("\n").filter((line) => line.includes("codex exec -"));

    expect(launches).toHaveLength(2);
    for (const launch of launches) {
      expect(launch).toContain("env -u CODEX_API_KEY -u CODEX_ACCESS_TOKEN -u OPENAI_API_KEY");
      expect(launch).toContain('CODEX_HOME=\\"$HOME/.codex-coding-agent\\"');
    }
  });
});
