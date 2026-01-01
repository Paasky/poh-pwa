import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

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
import { getAllIcons } from "@/types/icons";

// PWA service worker registration (auto updates)
import { registerSW } from "virtual:pwa-register";

// App styles (import AFTER vuetify/styles so our overrides take precedence)
import "@/Player/Human/Assets/main.css";

// Ensure all icons from our central icons.ts are registered
library.add(...getAllIcons());

registerSW({ immediate: true });

const app = createApp(App);
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
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");
