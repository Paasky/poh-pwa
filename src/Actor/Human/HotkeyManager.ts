import { onKeyStroke, useUserAgent } from "@vueuse/core";
import { SaveAction } from "@/Actor/Human/Actions/SaveAction";

export type Modifier = "ctrl" | "shift" | "alt" | "meta";

/**
 * Returns an OS-aware hotkey label (e.g., ⌘S on Mac, Ctrl+S on others).
 */
export const getHotkeyLabel = (key: string, modifiers: Modifier[] = ["ctrl"]) => {
  const { isMac } = useUserAgent();

  const labelMap: Record<Modifier, string> = {
    ctrl: isMac.value ? "⌘" : "Ctrl",
    meta: isMac.value ? "⌘" : "Win",
    alt: isMac.value ? "⌥" : "Alt",
    shift: "⇧",
  };

  const parts = modifiers.map((m) => labelMap[m]);
  parts.push(key.toUpperCase());

  return parts.join(isMac.value ? "" : "+");
};

/**
 * Global hotkey orchestrator for the Human Actor.
 */
export const HotkeyManager = {
  init() {
    // Quick Save: Ctrl+S or Cmd+S
    onKeyStroke(["s", "S"], (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        SaveAction.quickSave();
      }
    });

    // Add more global hotkeys here as needed
  },
};
