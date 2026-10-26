import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/500.css";
import App from "./App";
import "./styles.css";
import { useChatStore } from "./stores/chatStore";
import { usePresenceStore } from "./stores/presenceStore";
import { useBoundaryStore } from "./stores/boundaryStore";
import { useMemoryStore } from "./stores/memoryStore";
import { useLifeStore } from "./stores/lifeStore";
import { useThemeStore } from "./stores/themeStore";

// 开发时把 store 挂到 window，便于手动造一条消息验证拦截层。
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__co = {
    chat: useChatStore,
    presence: usePresenceStore,
    boundary: useBoundaryStore,
    memory: useMemoryStore,
    life: useLifeStore,
    theme: useThemeStore,
  };
}

// 不使用 StrictMode：开发环境的双挂载会让动画与 effect 跑两遍。
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename || undefined}>
    <App />
  </BrowserRouter>,
);
