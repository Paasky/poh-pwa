import { SaveAction } from "@/Actor/Human/Actions/SaveAction";

export type Modifier = "ctrl" | "shift" | "alt" | "meta";

const isMac = (): boolean => /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const getHotkeyLabel = (key: string, modifiers: Modifier[] = ["ctrl"]): string => {
  const mac = isMac();
  const labelMap: Record<Modifier, string> = {
    ctrl: mac ? "⌘" : "Ctrl",
    meta: mac ? "⌘" : "Win",
    alt: mac ? "⌥" : "Alt",
    shift: "⇧",
  };
  const parts = modifiers.map((m) => labelMap[m]);
  parts.push(key.toUpperCase());
  return parts.join(mac ? "" : "+");
};

const _listeners: Array<(e: KeyboardEvent) => void> = [];

export const HotkeyManager = {
  init() {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        SaveAction.quickSave();
      }
    };
    _listeners.push(onKeyDown);
    document.addEventListener("keydown", onKeyDown);
  },

  dispose() {
    _listeners.forEach((fn) => document.removeEventListener("keydown", fn));
    _listeners.length = 0;
  },
};
