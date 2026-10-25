import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { useChatStore } from "./stores/chatStore";
import { usePresenceStore } from "./stores/presenceStore";
import { useRelationStore } from "./stores/relationStore";
import { useSpaceStore } from "./stores/spaceStore";
import { useMemoryStore } from "./stores/memoryStore";

// 不使用 StrictMode：PixiJS 的 Application 在开发环境的双挂载里会
// 初始化两次画布，视觉上表现为粒子闪一下。生产构建无差异。
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

// 开发时把 store 挂到 window，便于手动造一条消息验证拦截层。
// 生产构建里这一段会被 tree-shake 掉。
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__co = {
    chat: useChatStore,
    presence: usePresenceStore,
    relation: useRelationStore,
    space: useSpaceStore,
    memory: useMemoryStore,
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename || undefined}>
    <App />
  </BrowserRouter>,
);
