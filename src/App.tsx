import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { Memory } from "./pages/Memory";
// 图表只在共处页用，懒加载，首屏不背这个包。
const Together = lazy(() =>
  import("./pages/Together").then((m) => ({ default: m.Together })),
);
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
    <AppShell>
      <Suspense
        fallback={<div className="flex h-full items-center justify-center" />}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/memory" element={<Memory />} />
          <Route
            path="/together"
            element={<Together />}
          />
          <Route path="/mit" element={<Mit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
