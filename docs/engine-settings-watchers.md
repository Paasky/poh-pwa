# EngineSettings watcher coverage (by owning component)

Principle

- Each engine sub-component watches only the keys it owns and updates itself on change. Do not centralize these watchers
  in EngineService.
- Restart-required keys do not need watchers or runtime actions. The Settings UI will confirm and refresh the page; new
  values will be applied on next boot.

Guideline on local replicas

- Keep local copies of settings to a minimum. Only cache when it’s performance‑critical (e.g., `manualTilt` is checked
  on each zoom/pointer event inside `MainCamera`). For simple toggles (e.g., fog of war on/off), apply once in the
  watcher and avoid local duplicates.

 key                     | status (owner component watches settingsStore.engineSettings.<key> and updates …)                                             
-------------------------|-------------------------------------------------------------------------------------------------------------------------------
 `manualTilt`            | `src/components/Engine/interaction/MainCamera.ts` -> call `setManualTilt(value)` (local `_manualTiltEnabled` is expected)     
 `showGrid`              | `src/components/Engine/overlays/GridOverlay.ts` -> show/hide overlay (e.g., use a `setVisible(value)` or enable/disable root) 
 `enableDebug`           | `src/factories/LogicMeshBuilder.ts` -> call `applyDebugVisibility()` to update `baseHexMesh.visibility`                       
 `enableFogOfWar`        | ok — watcher exists in `src/components/Engine/FogOfWar.ts` (attaches/detaches the FoW post‑process)                           
 `timeOfDay2400`         | `src/components/Engine/EnvironmentService.ts` -> call `setTimeOfDay(value)`                                                   
 `isClockRunning`        | `src/components/Engine/EnvironmentService.ts` -> call `setIsClockRunning(value)`                                              
 `month`                 | `src/components/Engine/EnvironmentService.ts` -> call `setMonth(value)`                                                       
 `weatherType`           | `src/components/Engine/EnvironmentService.ts` -> call `setWeather(value)`                                                     
 `renderScale`           | `src/components/Engine/EngineService.ts` -> call `applyRenderScale(value)`                                                    
 `adaptToDeviceRatio`    | no watcher needed — restart via Settings UI refresh                                                                           
 `antialias`             | no watcher needed — restart via Settings UI refresh                                                                           
 `preserveDrawingBuffer` | no watcher needed — restart via Settings UI refresh                                                                           
 `stencil`               | no watcher needed — restart via Settings UI refresh                                                                           
 `disableWebGL2Support`  | no watcher needed — restart via Settings UI refresh                                                                           
 `powerPreference`       | no watcher needed — restart via Settings UI refresh                                                                           
 `hdr`                   | `src/components/Engine/EnvironmentService.ts` -> toggle/recreate `renderingPipeline` (HDR pipeline)                           
 `useFxaa`               | `src/components/Engine/EnvironmentService.ts` -> `setPostProcessingOptions({ enableFastApproximateAntialiasing: value })`     
 `useBloom`              | `src/components/Engine/EnvironmentService.ts` -> `setPostProcessingOptions({ enableBloom: value })`                           
 `bloomThreshold`        | `src/components/Engine/EnvironmentService.ts` -> `setPostProcessingOptions({ bloomThreshold: value })`                        
 `bloomWeight`           | `src/components/Engine/EnvironmentService.ts` -> `setPostProcessingOptions({ bloomWeight: value })`                           
