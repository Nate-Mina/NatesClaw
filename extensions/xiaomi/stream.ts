// Xiaomi plugin module implements stream behavior.
import type { ProviderWrapStreamFnContext } from "natesclaw/plugin-sdk/plugin-entry";
import { createDeepSeekV4OpenAICompatibleThinkingWrapper } from "natesclaw/plugin-sdk/provider-stream-shared";
import { isMiMoReasoningModelRef } from "./thinking.js";

export function createMiMoThinkingWrapper(
  baseStreamFn: ProviderWrapStreamFnContext["streamFn"],
  thinkingLevel: ProviderWrapStreamFnContext["thinkingLevel"],
): ProviderWrapStreamFnContext["streamFn"] {
  return createDeepSeekV4OpenAICompatibleThinkingWrapper({
    baseStreamFn,
    thinkingLevel,
    shouldPatchModel: isMiMoReasoningModelRef,
  });
}
