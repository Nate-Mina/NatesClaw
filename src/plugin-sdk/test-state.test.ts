import { describe, expect, it } from "vitest";
import {
  createNatesclawTestState as createNatesclawTestStateDirect,
  withNatesclawTestState as withNatesclawTestStateDirect,
} from "../test-utils/natesclaw-test-state.js";
import { createNatesclawTestState, withNatesclawTestState } from "./test-state.js";

describe("test-state SDK seam", () => {
  it("re-exports the canonical isolated state lifecycle", () => {
    expect(createNatesclawTestState).toBe(createNatesclawTestStateDirect);
    expect(withNatesclawTestState).toBe(withNatesclawTestStateDirect);
  });
});
