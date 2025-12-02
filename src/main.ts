import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

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
import {
  faBars,
  faBookOpen,
  faCity,
  faCoins,
  faFlask,
  faHandsPraying,
  faLandmark,
  faMagnifyingGlass,
  faMasksTheater,
  faQuestion,
  faRoute,
  faScroll,
  faShield,
  faUpRightAndDownLeftFromCenter,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
// PWA service worker registration (auto updates)
import { registerSW } from "virtual:pwa-register";

library.add(
  faBars,
  faBookOpen,
  faQuestion,
  faMagnifyingGlass,
  faUpRightAndDownLeftFromCenter,
  faXmark,
  faCoins,
  faFlask,
  faMasksTheater,
  faHandsPraying,
  faShield,
  faScroll,
  faRoute,
  faUser,
  faCity,
  faLandmark,
);

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
          primary: "#613f00",
          secondary: "#093300",
          tertiary: "#0e3a68",
          disabled: "#6b7280",
          background: "#0f172a",
          surface: "#1e293b",
          // Additional semantic/icon accents
          gold: "#f59e0b",
          lightBlue: "#60a5fa",
          lightPurple: "#a78bfa",
          darkPurple: "#d333ff",
          lightGray: "#cbd5e1",
          orange: "#f97316",
          gray: "#9ca3af",
          white: "#ffffff",
          red: "#ef4444",
          green: "#22c55e",
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
