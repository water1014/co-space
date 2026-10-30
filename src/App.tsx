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
// 日记页带阅读器，也懒加载。
const Diary = lazy(() =>
  import("./pages/Diary").then((m) => ({ default: m.Diary })),
);
import { Mit } from "./pages/Mit";
import { Moments } from "./pages/Moments";
import { Studio } from "./pages/Studio";
import { Lounge } from "./pages/Lounge";
import { Module } from "./pages/Module";
import { useRelationEngine } from "./lib/relation/engine";
import { useThemeStore, applyAppearanceVars } from "./stores/themeStore";
import { useMemoryStore } from "./stores/memoryStore";
import { useDiaryStore } from "./stores/diaryStore";
import { seedIfEmpty } from "./lib/db/seed";

export default function App() {
  // 关系状态机只在这里挂一次：UI 不持有任何"该不该开口"的计时器。
  useRelationEngine();

  const appearance = useThemeStore();
  const load = useMemoryStore((s) => s.load);
  const loadDiary = useDiaryStore((s) => s.load);

  useEffect(() => {
    applyAppearanceVars(appearance);
  }, [appearance]);

  useEffect(() => {
    void (async () => {
      await load();
      await seedIfEmpty();
      loadDiary();
    })();
  }, [load, loadDiary]);

  return (
    <AppShell>
      <Suspense
        fallback={<div className="flex h-full items-center justify-center" />}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/together" element={<Together />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/mit" element={<Mit />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/lounge" element={<Lounge />} />
          <Route path="/calendar" element={<Module kind="calendar" />} />
          <Route path="/travel" element={<Module kind="travel" />} />
          <Route path="/music" element={<Module kind="music" />} />
          <Route path="/health" element={<Module kind="health" />} />
          <Route path="/ledger" element={<Module kind="ledger" />} />
          <Route path="/budget" element={<Module kind="budget" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
