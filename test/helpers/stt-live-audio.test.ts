// STT live audio tests validate live speech-to-text audio fixtures.
import {
  expectNatesclawLiveTranscriptMarker,
  normalizeTranscriptForMatch,
  NATESCLAW_LIVE_TRANSCRIPT_MARKER_RE,
} from "natesclaw/plugin-sdk/provider-test-contracts";
import { describe, expect, it } from "vitest";

describe("normalizeTranscriptForMatch", () => {
  it("normalizes punctuation and common Natesclaw live transcription variants", () => {
    expect(normalizeTranscriptForMatch("Open-Claw integration OK")).toBe("natesclawintegrationok");
    expect(normalizeTranscriptForMatch("Testing OpenFlaw realtime transcription")).toMatch(
      /open(?:claw|flaw)/,
    );
    expect(normalizeTranscriptForMatch("OpenCore xAI realtime transcription")).toMatch(
      NATESCLAW_LIVE_TRANSCRIPT_MARKER_RE,
    );
    expect(normalizeTranscriptForMatch("OpenCL xAI realtime transcription")).toMatch(
      NATESCLAW_LIVE_TRANSCRIPT_MARKER_RE,
    );
    expectNatesclawLiveTranscriptMarker("OpenClar integration OK");
  });
});
