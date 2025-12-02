import { ref } from "vue";

export function initFullscreen() {
  document.addEventListener("fullscreenchange", updateFullscreenState);
  document.addEventListener("webkitfullscreenchange", updateFullscreenState);
  document.addEventListener("mozfullscreenchange", updateFullscreenState);
  document.addEventListener("MSFullscreenChange", updateFullscreenState);
  updateFullscreenState();
  toggleFullscreen(true);
}

export function toggleFullscreen(set: boolean | null = null) {
  if (set === true) {
    return void enterFullscreen();
  }
  if (set === false) {
    return void exitFullscreen();
  }

  return isFullscreen.value ? void exitFullscreen() : void enterFullscreen();
}

export function destroyFullscreen() {
  document.removeEventListener("fullscreenchange", updateFullscreenState);
  document.removeEventListener("webkitfullscreenchange", updateFullscreenState);
  document.removeEventListener("mozfullscreenchange", updateFullscreenState);
  document.removeEventListener("MSFullscreenChange", updateFullscreenState);
}

const isFullscreen = ref(false);

function updateFullscreenState() {
  // eslint-disable-next-line
  const d: any = document;
  isFullscreen.value = !!(
    document.fullscreenElement ||
    d.webkitFullscreenElement ||
    d.mozFullScreenElement ||
    d.msFullscreenElement
  );
}

async function enterFullscreen() {
  // eslint-disable-next-line
  const el: any = document.documentElement;
  try {
    if (el.requestFullscreen) {
      // navigationUI: 'hide' is supported in some browsers (like Chrome on desktop)
      await el.requestFullscreen({ navigationUI: "hide" });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  } catch {
    // ignore
  }
}

async function exitFullscreen() {
  // eslint-disable-next-line
  const d: any = document;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (d.webkitExitFullscreen) {
      d.webkitExitFullscreen();
    } else if (d.mozCancelFullScreen) {
      d.mozCancelFullScreen();
    } else if (d.msExitFullscreen) {
      d.msExitFullscreen();
    }
  } catch {
    // ignore
  }
}
