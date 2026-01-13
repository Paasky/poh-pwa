import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./App/router";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import { aliases, fa } from "vuetify/iconsets/fa-svg";

// Offline fonts via @fontsource
import "@fontsource/dm-sans/200.css";
import "@fontsource/poiret-one/400.css";

// Font Awesome setup
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { getAllIcons } from "@/Common/Static/Icon";

// PWA service worker registration (auto updates)
import { registerSW } from "virtual:pwa-register";

// App styles (import AFTER vuetify/styles so our overrides take precedence)
import "@/Actor/Human/Assets/main.css";
import { errorService } from "@/App/services/errorService";

// Ensure all icon from our central icon.ts are registered
library.add(...getAllIcons());

registerSW({ immediate: true });

const app = createApp(App);

// 1. Vue-specific errors
app.config.errorHandler = (err, instance, info) => {
  errorService.handle(err, { source: "Vue", info });
};

// 2. Global Unhandled Rejections (Async/Promise errors)
window.addEventListener("unhandledrejection", (event) => {
  errorService.handle(event.reason, { source: "Promise" });
});

const vuetify = createVuetify({
  icons: {
    defaultSet: "fa",
    aliases,
    sets: { fa },
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        dark: true,
        colors: {
          // Palette
          primary: "#805C0F",
          secondary: "#082c00",
          tertiary: "#0e3a68",
          disabled: "#333333",
          background: "#0f172a",
          surface: "#1e293b",
          error: "#880909",
          // Additional semantic/icon accents
          gold: "#f59e0b",
          lightBlue: "#60a5fa",
          lightPurple: "#a78bfa",
          darkPurple: "#d333ff",
          lightGray: "#cbd5e1",
          orange: "#f97316",
          gray: "#9ca3af",
          white: "#ffffff",
          red: "#881111",
          lightRed: "#f66",
          green: "#22c55e",
          lightGreen: "#5f8",
        },
      },
    },
  },
});
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(router);
app.use(vuetify);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");
