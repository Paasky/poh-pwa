import { computed, reactive, ref } from "vue";
import { useSettingsStore } from "@/App/stores/settingsStore";
import {
  engineSettingPresets,
  EngineSettings,
  gameSettingKeys,
  graphicsSettingKeys,
  restartRequiredSettingKeys,
} from "@/Actor/Human/EngineSettings";

export function useSettingsDialog(onRequestReload: () => void) {
  const settings = useSettingsStore();

  //////////////////////
  // VARIABLES
  //////////////////////

  const showRestartConfirm = ref(false);

  // Local editable copies (set to store on save-action)
  const localPresetId = ref(settings.selectedPresetId);
  const localGraphicsSettings = reactive<Partial<EngineSettings>>(
    buildGraphicsPatch(settings.engineSettings),
  );

  // Backups captured on init
  let engineSettingsBackup: EngineSettings = { ...settings.engineSettings };
  let presetIdBackup: string = settings.selectedPresetId;

  // User has clicked Save on the Graphics tab, but we need to confirm first
  let _pendingSave = false;

  //////////////////////
  // COMPUTED
  //////////////////////

  const isGameDirty = computed(() => {
    for (const k of gameSettingKeys) {
      if (settings.engineSettings[k] !== engineSettingsBackup[k]) return true;
    }
    return false;
  });

  const isGraphicsDirty = computed(() => {
    for (const k of graphicsSettingKeys) {
      if (localGraphicsSettings[k] !== engineSettingsBackup[k]) return true;
    }
    return false;
  });

  const restartNeeded = computed(() => {
    for (const k of restartRequiredSettingKeys) {
      if (engineSettingsBackup[k] !== localGraphicsSettings[k]) return true;
    }
    return false;
  });

  //////////////////////
  // HELPERS
  //////////////////////

  function buildGamePatch(engineSettings: EngineSettings): Partial<EngineSettings> {
    const patch = {} as Partial<EngineSettings>;
    for (const k of gameSettingKeys) {
      // eslint-disable-next-line
      patch[k] = engineSettings[k] as any;
    }
    return patch;
  }

  function buildGraphicsPatch(engineSettings: EngineSettings): Partial<EngineSettings> {
    const patch = {} as Partial<EngineSettings>;
    for (const k of graphicsSettingKeys) {
      // eslint-disable-next-line
      patch[k] = engineSettings[k] as any;
    }
    return patch;
  }

  //////////////////////
  // ACTIONS
  //////////////////////

  function onOpen() {
    // Capture backups on open
    engineSettingsBackup = { ...settings.engineSettings };
    presetIdBackup = settings.selectedPresetId;

    localPresetId.value = settings.selectedPresetId;
    Object.assign(localGraphicsSettings, buildGraphicsPatch(settings.engineSettings));
  }

  function revertGame() {
    Object.assign(settings.engineSettings, buildGamePatch(engineSettingsBackup));
  }

  function cancelGame(close: () => void) {
    revertGame();
    close();
  }

  function loadPreset(presetId: string) {
    const preset = engineSettingPresets.find((preset) => preset.id === presetId)?.value;
    if (!preset) {
      throw new Error(`No preset found with id ${presetId}`);
    }
    localPresetId.value = presetId;
    Object.assign(localGraphicsSettings, buildGraphicsPatch(preset));
  }

  function applyGraphics(close: () => void) {
    // Needs a restart -> confirm first
    for (const k of restartRequiredSettingKeys) {
      if (localGraphicsSettings[k] !== engineSettingsBackup[k]) {
        _pendingSave = true;
        showRestartConfirm.value = true;
        return;
      }
    }

    settings.selectedPresetId = localPresetId.value;
    Object.assign(settings.engineSettings, localGraphicsSettings);
    settings.save();
    close();
  }

  function confirmRestartProceed() {
    showRestartConfirm.value = false;
    if (!_pendingSave) return;

    _pendingSave = false;
    settings.selectedPresetId = localPresetId.value;
    Object.assign(settings.engineSettings, localGraphicsSettings);

    settings.save();
    onRequestReload();
  }

  function revertGraphics() {
    localPresetId.value = presetIdBackup;
    Object.assign(localGraphicsSettings, buildGraphicsPatch(engineSettingsBackup));
  }

  function cancelGraphics(close: () => void) {
    revertGraphics();
    close();
  }

  function confirmRestartCancel() {
    _pendingSave = false;
    showRestartConfirm.value = false;
  }

  return {
    // state
    isGameDirty,
    isGraphicsDirty,
    localPresetId,
    localGraphicsSettings,
    showRestartConfirm,
    restartNeeded,

    // lifecycle
    onOpen,

    // actions
    revertGame,
    cancelGame,
    loadPreset,
    applyGraphics,
    revertGraphics,
    cancelGraphics,
    confirmRestartProceed,
    confirmRestartCancel,
  };
}
