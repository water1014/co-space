import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppFrame } from "./components/layout/AppFrame";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { Memory } from "./pages/Memory";
import { Together } from "./pages/Together";
import { Mit } from "./pages/Mit";
import { useRelationEngine } from "./lib/relation/engine";
import { useThemeStore } from "./stores/themeStore";
import { useMemoryStore } from "./stores/memoryStore";
import { seedIfEmpty } from "./lib/db/seed";

export default function App() {
  // 关系状态机只在这里挂一次：UI 不持有任何"该不该开口"的计时器。
  useRelationEngine();

  const theme = useThemeStore((s) => s.theme);
  const load = useMemoryStore((s) => s.load);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    void (async () => {
      await load();
      await seedIfEmpty();
    })();
  }, [load]);

  return (
    <AppFrame>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/together" element={<Together />} />
        <Route path="/mit" element={<Mit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppFrame>
  );
}
