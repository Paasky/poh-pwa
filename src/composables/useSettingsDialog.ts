import { computed, reactive, ref, watch } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAppStore } from "@/stores/appStore";
import { type EngineOptions, RestartRequiredOptionKeys } from "@/components/Engine/EngineService";
import { defaultTimeOfDay2400 } from "@/components/Engine/environments/timeOfDay";
import { defaultMonth } from "@/components/Engine/environments/season";
import { defaultWeatherType, type WeatherType } from "@/components/Engine/environments/weather";

type LocalEngineOptions = Partial<EngineOptions> & { showGrid?: boolean };

export function useSettingsDialog(opts?: { onRequestReload?: () => void }) {
  const app = useAppStore();
  const settings = useSettingsStore();

  // Public state
  const tab = ref<"game" | "graphics">(settings.lastSettingsTab ?? "game");
  const isSaving = ref(false);
  const showRestartConfirm = ref(false);

  // Local editable copies
  const localPresetId = ref<string>(settings.selectedPresetId);
  const localEngine = reactive<LocalEngineOptions>({ ...settings.engine });

  // Environment models
  const timeOfDay2400 = ref<number>(defaultTimeOfDay2400);
  const isClockRunning = ref<boolean>(false);
  const month = ref<number>(defaultMonth);
  const weatherType = ref<WeatherType>(defaultWeatherType);
  const logicDebug = ref(false);

  // Backups captured on open
  let engineBackup: LocalEngineOptions = { ...settings.engine } as LocalEngineOptions;
  let backupPresetId: string = settings.selectedPresetId;
  let gameBackup = {
    timeOfDay2400: defaultTimeOfDay2400 as number,
    isClockRunning: false as boolean,
    month: defaultMonth as number,
    weatherType: defaultWeatherType as WeatherType,
    manualTilt: settings.engine.manualTilt ?? false,
    showGrid: settings.engine.showGrid ?? true,
    logicDebug: false as boolean,
  };

  // Tab persistence
  watch(
    () => tab.value,
    (t) => {
      if (t === "game" || t === "graphics") {
        settings.lastSettingsTab = t;
        settings.save();
      }
    },
  );

  // Derived/dirty helpers
  const graphicsOptionKeys: (keyof EngineOptions)[] = [
    "renderScale",
    "adaptToDeviceRatio",
    "antialias",
    "preserveDrawingBuffer",
    "stencil",
    "disableWebGL2Support",
    "powerPreference",
    "hdr",
    "useFxaa",
    "useBloom",
    "bloomThreshold",
    "bloomWeight",
  ];

  const isGameDirty = computed(() => {
    return (
      (localEngine.manualTilt ?? false) !== (gameBackup.manualTilt ?? false) ||
      (localEngine.showGrid ?? true) !== (gameBackup.showGrid ?? true) ||
      timeOfDay2400.value !== gameBackup.timeOfDay2400 ||
      isClockRunning.value !== gameBackup.isClockRunning ||
      month.value !== gameBackup.month ||
      weatherType.value !== gameBackup.weatherType ||
      logicDebug.value !== gameBackup.logicDebug
    );
  });

  const isGraphicsDirty = computed(() => {
    if (localPresetId.value !== backupPresetId) return true;
    for (const k of graphicsOptionKeys) {
      if (localEngine[k] !== engineBackup[k]) return true;
    }
    return false;
  });

  function buildGraphicsPatch(): Partial<EngineOptions> {
    return {
      renderScale: localEngine.renderScale,
      adaptToDeviceRatio: localEngine.adaptToDeviceRatio,
      antialias: localEngine.antialias,
      preserveDrawingBuffer: localEngine.preserveDrawingBuffer,
      stencil: localEngine.stencil,
      disableWebGL2Support: localEngine.disableWebGL2Support,
      powerPreference: localEngine.powerPreference,
      hdr: localEngine.hdr,
      useFxaa: localEngine.useFxaa,
      useBloom: localEngine.useBloom,
      bloomThreshold: localEngine.bloomThreshold,
      bloomWeight: localEngine.bloomWeight,
    } as Partial<EngineOptions>;
  }

  // Lifecycle
  function onOpen() {
    // Initialize from persisted settings as a base
    localPresetId.value = settings.selectedPresetId;
    Object.assign(localEngine, settings.engine);
    // Sync with live engine state so UI reflects what the player sees
    try {
      const opts = app.engineService.options;
      localEngine.manualTilt = !!opts.manualTilt;
      localEngine.showGrid = opts.showGrid ?? true;
      timeOfDay2400.value = app.engineService.environmentService.getEffectiveTimeOfDay2400();
      isClockRunning.value = app.engineService.environmentService.getIsClockRunning();
      month.value = app.engineService.environmentService.getMonth();
      weatherType.value = app.engineService.environmentService.getWeatherType();
    } catch {
      // Fallback to defaults if engine not ready
      timeOfDay2400.value = defaultTimeOfDay2400;
      isClockRunning.value = false;
      month.value = defaultMonth;
      weatherType.value = defaultWeatherType;
    }
    // Capture backups after sync
    engineBackup = { ...settings.engine };
    backupPresetId = settings.selectedPresetId;
    gameBackup = {
      timeOfDay2400: timeOfDay2400.value,
      isClockRunning: isClockRunning.value,
      month: month.value,
      weatherType: weatherType.value,
      manualTilt: localEngine.manualTilt ?? false,
      showGrid: localEngine.showGrid ?? true,
      logicDebug: logicDebug.value,
    };
    tab.value = settings.lastSettingsTab ?? "game";
  }

  function onClose() {
    // no-op for now
  }

  // Game tab actions (immediate apply + persist)
  function setShowGrid(v: boolean | null) {
    const val = !!v;
    localEngine.showGrid = val;
    try {
      app.engineService.applyOptions({ showGrid: val });
    } finally {
      settings.engine.showGrid = val;
      settings.save();
    }
  }

  function setManualTilt(v: boolean | null) {
    const val = !!v;
    localEngine.manualTilt = val;
    try {
      app.engineService.applyOptions({ manualTilt: val });
    } finally {
      settings.engine.manualTilt = val;
      settings.save();
    }
  }

  // Debug toggle (live only, no persistence)
  function setLogicDebug(v: boolean | null) {
    const val = !!v;
    logicDebug.value = val;
    try {
      app.engineService.setLogicDebugEnabled(val);
    } catch {
      // ignore
    }
  }

  function setTimeOfDayPersist(v: number) {
    timeOfDay2400.value = v;
    try {
      app.engineService.environmentService.setTimeOfDay(v);
    } finally {
      settings.environment.timeOfDay2400 = v;
      settings.save();
    }
  }

  function setClockRunningPersist(v: boolean | null) {
    const val = !!v;
    isClockRunning.value = val;
    try {
      app.engineService.environmentService.setIsClockRunning(val);
    } finally {
      settings.environment.isClockRunning = val;
      settings.save();
    }
  }

  function setMonthPersist(v: number) {
    month.value = v;
    try {
      app.engineService.environmentService.setMonth(v);
    } finally {
      settings.environment.month = v;
      settings.save();
    }
  }

  function setWeatherPersist(v: WeatherType) {
    weatherType.value = v;
    try {
      app.engineService.environmentService.setWeather(v);
    } finally {
      settings.environment.weatherType = v;
      settings.save();
    }
  }

  function revertGame() {
    try {
      // Engine options
      localEngine.manualTilt = gameBackup.manualTilt;
      localEngine.showGrid = gameBackup.showGrid;
      app.engineService.applyOptions({
        manualTilt: !!gameBackup.manualTilt,
        showGrid: !!gameBackup.showGrid,
      });
      // Persist engine options to settings store
      settings.engine.manualTilt = !!gameBackup.manualTilt;
      settings.engine.showGrid = !!gameBackup.showGrid;
      // Environment
      timeOfDay2400.value = gameBackup.timeOfDay2400;
      isClockRunning.value = gameBackup.isClockRunning;
      month.value = gameBackup.month;
      weatherType.value = gameBackup.weatherType;
      app.engineService.environmentService.setTimeOfDay(gameBackup.timeOfDay2400);
      app.engineService.environmentService.setIsClockRunning(gameBackup.isClockRunning);
      app.engineService.environmentService.setMonth(gameBackup.month);
      app.engineService.environmentService.setWeather(gameBackup.weatherType);
      // Debug
      logicDebug.value = gameBackup.logicDebug;
      app.engineService.setLogicDebugEnabled(gameBackup.logicDebug ?? false);
      // Persist environment to settings store
      settings.environment.timeOfDay2400 = gameBackup.timeOfDay2400;
      settings.environment.isClockRunning = gameBackup.isClockRunning;
      settings.environment.month = gameBackup.month;
      settings.environment.weatherType = gameBackup.weatherType;
      settings.save();
    } catch {
      // silent
    }
  }

  function cancelGame(close: () => void) {
    revertGame();
    close();
  }

  // Graphics tab actions (deferred apply)
  let _pendingSave = false;

  function applyGraphics(close: () => void) {
    if (isSaving.value) return;
    const changedRestart: (keyof EngineOptions)[] = [];
    for (const k of RestartRequiredOptionKeys) {
      if (engineBackup[k] !== localEngine[k]) changedRestart.push(k);
    }
    if (changedRestart.length > 0) {
      _pendingSave = true;
      showRestartConfirm.value = true;
      return;
    }
    // Persist settings then close, then live-apply non-restart in RAF
    isSaving.value = true;
    try {
      settings.selectedPresetId = localPresetId.value;
      Object.assign(settings.engine, buildGraphicsPatch());
      settings.save();
    } catch {
      // ignore
    }
    close();
    requestAnimationFrame(() => {
      try {
        const patch = buildGraphicsPatch();
        app.engineService.applyOptions(patch as EngineOptions);
        app.engineService.setEnvironmentPostProcessingOptions({
          enableFastApproximateAntialiasing: !!localEngine.useFxaa,
          enableBloom: !!localEngine.useBloom,
          bloomThreshold:
            typeof localEngine.bloomThreshold === "number" ? localEngine.bloomThreshold : undefined,
          bloomWeight:
            typeof localEngine.bloomWeight === "number" ? localEngine.bloomWeight : undefined,
        });
      } finally {
        isSaving.value = false;
      }
    });
  }

  function confirmRestartProceed() {
    showRestartConfirm.value = false;
    if (!_pendingSave) return;
    _pendingSave = false;
    settings.selectedPresetId = localPresetId.value;
    Object.assign(settings.engine, buildGraphicsPatch());
    settings.save();
    opts?.onRequestReload?.();
  }

  function confirmRestartCancel() {
    _pendingSave = false;
    showRestartConfirm.value = false;
  }

  function revertGraphics() {
    localPresetId.value = backupPresetId;
    Object.assign(localEngine, { ...engineBackup });
  }

  function cancelGraphics(close: () => void) {
    revertGraphics();
    close();
  }

  // Derived helper
  const restartNeeded = computed(() => {
    for (const k of RestartRequiredOptionKeys) {
      if (engineBackup[k] !== localEngine[k]) return true;
    }
    return false;
  });

  return {
    // state
    tab,
    isSaving,
    isGameDirty,
    isGraphicsDirty,
    showRestartConfirm,
    restartNeeded,

    // models
    localEngine,
    localPresetId,
    timeOfDay2400,
    isClockRunning,
    month,
    weatherType,
    logicDebug,

    // lifecycle
    onOpen,
    onClose,

    // actions
    setShowGrid,
    setManualTilt,
    setLogicDebug,
    setTimeOfDayPersist,
    setClockRunningPersist,
    setMonthPersist,
    setWeatherPersist,
    revertGame,
    cancelGame,
    applyGraphics,
    revertGraphics,
    cancelGraphics,
    confirmRestartProceed,
    confirmRestartCancel,
  };
}

// Helper export for preset change handling (optional, but handy for UI)
// Intentionally no extra exports: keep composable API minimal per KISS
