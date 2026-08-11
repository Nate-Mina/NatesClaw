import { vi } from "vitest";
import type { ApplicationContext } from "./context.ts";

export type ShellKeyboardState = {
  runtime: { context: ApplicationContext };
  handleDocumentKeydown: (event: KeyboardEvent) => void;
};

export function resetAppHostTestGlobals(): void {
  vi.useRealTimers();
  Reflect.deleteProperty(window, "webkit");
  document.documentElement.classList.remove(
    "natesclaw-native-macos",
    "natesclaw-native-nav",
    "natesclaw-native-web-chrome",
  );
  vi.unstubAllGlobals();
}
