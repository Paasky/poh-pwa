EnvironmentService MVP integration checklist (editable)
======================================================

Edit this file as we progress. Items marked with ✓ were completed in this commit.


1) Wire up EnvironmentService and replace existing lights
- [x] Import EnvironmentService into EngineService and add a private field for it. ✓
- [x] Instantiate EnvironmentService after cameras are created. ✓
- [x] Remove/skip legacy initLight() usage (do not call it). ✓
- [x] Skip legacy rebuildPipeline() (post FX handled by EnvironmentService). ✓
- [x] Disable/remove MVP shadow wiring (no ShadowGenerator and no addShadowCaster calls). ✓
- [x] Call environmentService.update(deltaSeconds) in the render loop. ✓
- [x] Dispose environmentService in detach(). ✓
- [x] Ensure hemispheric specular is black to avoid double highlights on water/terrain. ✓

Result: Game boots using EnvironmentService lights/skybox/post FX with offline .env reflections.


2) Housekeeping in meshFromWeld and createWaterMesh
- [x] meshFromWeld expects a HemisphericLight and DirectionalLight present in the scene — satisfied by EnvironmentService. ✓
- [x] Set hemispheric specular to black (done inside EnvironmentService.setupLights). ✓
- [ ] Revisit shader multipliers if intensities change later (DIR_LIGHT_STRENGTH, AMBIENT_STRENGTH). TODO
- [ ] Water does not use PBR yet; optional future change to PBR for IBL reflections. TODO


3) MVP defaults (non‑adjustable at runtime)
- [x] Use default time/season/weather constants in EnvironmentService. ✓
- [x] Use EnvironmentHelper to create skybox and load prefiltered .env for PBR reflections. ✓
- [x] Enable DefaultRenderingPipeline with FXAA + Bloom via service defaults. ✓
- [ ] Expose UI toggles (later; out of scope for MVP). TODO


4) Topic-specific configs and priorities (most impact for least effort first)

4.1) Post‑processing (already partly done)
- Config should include: enableFastApproximateAntialiasing, enableBloom, bloomThreshold, bloomWeight.
- [x] Implemented in src/components/Engine/environments/postFx.ts and wired in EnvironmentService. ✓
- Offline status: complete (no extra packages).

4.2) Lights and sky (part of wiring)
- Config should include: ambientHemisphericLightIntensity, ambientHemisphericSkyColor, ambientHemisphericGroundColor, directionalSunLightDirection, directionalSunLightIntensity, skyboxSizeWorldUnits, environmentTextureUrl, enableShadows (reserved).
- [x] Implemented in EnvironmentServiceConfig with defaults. ✓
- Offline status: complete; /public/env/environment.env included.

4.3) Time of day
- Config should include: clockHoursPerRealMinute, startWithClockRunning, defaultTimeOfDay2400; later: curves for sun direction/intensity and color gradients.
- [x] Defaults exported in environments/timeOfDay.ts; clock advances in update(). ✓
- [x] Visual transitions — sun direction and intensity updated based on time-of-day (EnvironmentService.updateSunFromTimeOfDay). ✓
- [ ] Visual transitions — sky color/skybox response to time-of-day (optional; requires SkyMaterial or skybox swapping). TODO

4.4) Season
- Config should include: defaultSeasonMonth1to12 and a month→color palette for hemi sky/ground; optional ambient intensity scale.
- [x] Defaults exported in environments/season.ts. ✓
- [x] Apply palette to hemispheric colors on setSeason() (implemented in EnvironmentService). ✓

4.5) Weather
- Config should include: weatherType enum and per‑type fog presets; later: particles (rain), lightning, cloud coverage.
- [x] WeatherType enum and default exported in environments/weather.ts. ✓
- [x] Apply fog presets and mood tweaks on setWeather() (implemented in EnvironmentService). ✓


5) Assets and packages (offline)
- [x] Add prefiltered .env environment texture at public/env/environment.env. ✓
- [x] Document its purpose in public/env/README.md. ✓
- [ ] Optional: add more .env variants for different moods/biomes. TODO
- [ ] Optional: add @babylonjs/materials if we later want SkyMaterial (moving sun disc). TODO


6) Acceptance checks
- [x] Engine boots without initLight() and without legacy rebuildPipeline when service active. ✓
- [x] One HemisphericLight and one DirectionalLight exist (created by EnvironmentService). ✓
- [x] Skybox visible; PBR reflections active with the offline .env. ✓
- [x] No ShadowGenerator usage remains at runtime (MVP). ✓
- [x] Terrain shader lights correctly via scene lights; water visuals remain stable. ✓
- [ ] Future: enable optional shadows through EnvironmentService API. TODO


7) Browser warnings and diagnostics (Firefox/WebGL)
- [x] Track known benign warnings in Firefox:
  - WEBGL_debug_renderer_info is deprecated in Firefox (Babylon queries this internally; harmless). ✓
  - WebGL "lazy initialization" warnings on 2D and cubemap textures during first use (driver/browser behavior; harmless). ✓
- [ ] Optional: reduce Babylon console noise in production by limiting log levels (hide info banner):
  - Set BABYLON.Logger.LogLevels = BABYLON.Logger.Warning | BABYLON.Logger.Error at startup. TODO
- [ ] Optional: pre‑warm critical textures (await onLoad / executeWhenReady) to minimize first‑frame lazy init warnings. TODO
- [ ] Optional: audit dynamic textures (water) to ensure an initial draw happens before first bind (already drawing on first frame). TODO


8) UI integration (TestView & GameMenu)
- [x] Bring GameMenu component into TestView and render it over the engine canvas. ✓
- [x] Ensure GameMenu can access the EngineService instance by assigning useAppStore().engineService in TestView. ✓
- [x] Add Environment controls to GameMenu Options dialog and wire to EnvironmentService via EngineService pass-throughs: ✓
  - Time of day (0..2400) — calls setEnvironmentTimeOfDay(). ✓
  - Clock running toggle — calls setEnvironmentClockRunning(). ✓
  - Season month (1..12) — calls setEnvironmentSeason(). ✓
  - Weather type — calls setEnvironmentWeather(). ✓
  - Post FX (FXAA, Bloom, threshold, weight) — calls setEnvironmentPostProcessingOptions(). ✓
- [ ] Optional: reflect current environment state in the UI (getters on EnvironmentService). TODO
- [ ] Optional: move environment settings persistence into settingsStore. TODO


Notes
-----
- Edit this file to track future steps (e.g., shadows, weather fog presets, time‑of‑day sun motion).
- All identifiers in EnvironmentService are verbose by design to remain self‑documenting.


9) Verification: terrain bump maps, TestView persistence, Options Save hang
--------------------------------------------------------------------------

9.1) Terrain bump/normal maps in meshFromWeld
- Context: meshFromWeld uses a custom shader that blends 4 normal maps and decodes them as tangent‑space normals from RGB (0..1 → −1..1). Textures come from /public/textures/bump/*.png.
- Current verification:
  - [x] Texture files exist offline: grass.png, sand.png, rocks.png, snow.png. ✓
  - [x] Shader decodes RGB normals via decodeNormal(), with optional axis inversion flags (uInvertX/uInvertY). ✓
  - [x] StandardMaterial pipeline elsewhere (assets/materials/terrains.ts) also treats these textures as bump/normal maps, so asset semantics are consistent. ✓
- Plan if visuals appear inverted or too strong:
  - [ ] Quick flip test: toggle INVERT_NORMAL_Y in meshFromWeld.ts (many normal maps need a green channel flip in GL). If correct, add a config flag and document. TODO
  - [ ] If any map is a height map (grayscale) rather than a true normal map: either replace asset with a baked normal or add optional on‑GPU derivation (sobel on height) behind a feature flag. TODO
  - [ ] Add a tiny debug overlay toggle to visualize per‑texture weights to confirm blending behaves as expected. TODO

9.2) TestView Options persistence (browser storage)
- Context: Engine options are persisted via settingsStore (localStorage poh.settings). Environment panel values in GameMenu (time of day, clock, season, weather) are reset to defaults on dialog open.
- Current verification:
  - [x] EngineOptions persist through settingsStore.save(). ✓
  - [ ] Environment options (time/season/weather/clock) do NOT persist yet. TODO
- Plan to persist environment options:
  - [ ] Create environmentSettingsStore with storage key (e.g., poh.env) and versioning, storing: { timeOfDay2400, isClockRunning, seasonMonth1to12, weatherType, postFxOverrides? }. TODO
  - [ ] Load these values on GameMenu open and apply them on Save via EnvironmentService pass‑throughs. TODO
  - [ ] Provide reset‑to‑defaults action and migrate if schema version changes. TODO

9.3) Options Save click causes browser hang
- Symptom: Clicking Save in the Options dialog can freeze the tab.
- Analysis (likely causes):
  - Live applying renderScale (engine.setHardwareScalingLevel) can trigger immediate device pixel ratio changes and force a large synchronous resize on the GL canvas inside the same click/frame.
  - Reactive writes plus heavy GPU state changes in the same microtask can block the UI thread (especially on slower GPUs), presenting as a “hang”.
  - Less likely but possible: JSON serialization of reactive proxies on save; mitigated by our clone() but still synchronous.
- Fix plan:
  - [x] Guard against double‑clicks and concurrent saves; disable the Save button while processing. ✓
  - [x] Defer expensive engine operations to the next frame using requestAnimationFrame to let the UI render the dialog close first. ✓
  - [ ] Optionally split saves: first persist settings, close the dialog, then in RAF apply engine changes to avoid blocking the interaction frame. TODO
  - [ ] Consider debouncing renderScale changes or showing a short loading HUD during GPU resize. TODO
  

10) New issues from user report (bump maps visibility; minimap brightness)
--------------------------------------------------------------------------

10.1) Terrain bump/normal maps not visibly affecting shading
- Symptom: Browser downloads textures but surface appears flat; recollection that they had to be “attached” to a light.
- Current architecture note: Our custom ShaderMaterial already samples the normal maps and shades against the scene’s DirectionalLight + HemisphericLight via onBind; no Babylon StandardMaterial linkage is required. If the bump effect is subtle, it is most likely due to lighting balance or normal intensity, not missing attachment.
- Plan & actions:
  - [x] Ensure a DirectionalLight exists (EnvironmentService provides one) and is read by meshFromWeld shader. ✓
  - [x] Increase directional contribution and reduce ambient in the terrain shader to make normal variation pop. ✓
  - [x] Slightly raise the master normal intensity. ✓
  - [ ] Quick A/B: flip green channel (INVERT_NORMAL_Y) to verify normal map handedness if needed. TODO
  - [ ] Optional: add a specular term to the shader for crisper highlights (behind a toggle). TODO
  - [ ] Re‑tune after enabling shadows or changing sun curves (if/when added). TODO

10.2) Minimap screenshot much darker than world; should render with its own camera & lights, ignoring world state
- Requirement: Minimap capture should not depend on current time-of-day, fog, or weather; it should have neutral lighting.
- Plan & actions:
  - [x] In EngineService.captureMinimap(), temporarily disable world fog/lights, create neutral temporary lights (hemi + directional) solely for the capture, perform the screenshot with the minimap camera, then restore previous fog and light intensities. ✓
  - [x] Temporarily hide the global water plane during minimap capture so the overview ignores water effects. ✓
  - [x] Increase temporary minimap light intensities for a brighter overview (hemi = 1.0, directional = 1.4). ✓
  - [ ] Optional: move minimap rendering to a dedicated Scene for full isolation if needed later. TODO
  - [ ] Optional: add config to tweak minimap light direction/intensity independently. TODO
