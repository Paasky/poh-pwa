import { useDataBucket } from "@/Data/useDataBucket";
import { useCurrentContext } from "@/Common/composables/useCurrentContext";
import { saveManager } from "@/Common/utils/saveManager";
import { useSettingsStore } from "@/App/stores/settingsStore";
import pkg from "../../../../package.json";

const APP_VERSION = pkg.version;

export class SaveAction {
  /**
   * Performs a save operation.
   * If a name is provided, it uses that name.
   * Otherwise, it defaults to "Leader - Culture [UserName] 5000 BCE".
   */
  static save(name?: string, isAutosave = false) {
    const bucket = useDataBucket();
    const { currentPlayer } = useCurrentContext();

    const saveName = name ?? `${currentPlayer.name} ${bucket.year}`;

    const saveData = bucket.toSaveData(saveName, APP_VERSION);
    saveManager.save(saveData, isAutosave);

    // Auto-download if enabled and not an autosave
    if (!isAutosave && useSettingsStore().engineSettings.autoDownloadSaves) {
      saveManager.download(saveData.world.id);
    }
  }

  /**
   * Quick save helper.
   */
  static quickSave() {
    this.save(undefined, false);
  }
}
