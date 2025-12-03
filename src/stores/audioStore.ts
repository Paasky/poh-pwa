import { defineStore } from "pinia";

export const useAudioStore = defineStore("audio", {
  state: () => ({
    currentAudio: null as null | HTMLAudioElement,
  }),
  actions: {
    stopQuote() {
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch {
          // ignore
        }
        this.currentAudio = null;
      }
    },
    playQuote(src: string) {
      // Stop any existing playback before starting a new one
      this.stopQuote();
      const audio = new Audio(src);
      this.currentAudio = audio;
      audio.play().catch(() => {});
      audio.addEventListener("ended", () => {
        if (this.currentAudio === audio) this.currentAudio = null;
      });
    },
  },
});
