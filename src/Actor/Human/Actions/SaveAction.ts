import { useDataBucket } from "@/Data/useDataBucket";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { saveManager } from "@/utils/saveManager";
import { useSettingsStore } from "@/stores/settingsStore";
import pkg from "../../../../package.json";

const APP_VERSION = pkg.version;

export class SaveAction {
  /**
   * Performs a save operation.
   * If a name is provided, it uses that name.
   * Otherwise, it defaults to "PlayerName - CultureName".
   */
  static save(name?: string, isAutosave = false) {
    const bucket = useDataBucket();
    const { currentPlayer } = useCurrentContext();

    const saveName = name ?? `${currentPlayer.leader.name} - ${currentPlayer.culture.type.name}`;

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
