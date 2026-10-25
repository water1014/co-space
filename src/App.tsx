import { useEffect } from "react";
import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import { Threshold } from "./rooms/Threshold";
import { SharedSpace } from "./rooms/SharedSpace";
import { MemoryHall } from "./rooms/MemoryHall";
import { BoundaryPanel } from "./rooms/BoundaryPanel";
import { useRelationEngine } from "./lib/relation/engine";
import { usePresenceStore } from "./stores/presenceStore";
import { useSpaceStore } from "./stores/spaceStore";
import { useMemoryStore } from "./stores/memoryStore";
import { MOOD_RGB } from "./types";
import type { RoomId } from "./stores/spaceStore";

const ROOM_BY_PATH: Record<string, RoomId> = {
  "/": "threshold",
  "/space": "space",
  "/memory": "memory",
  "/boundary": "boundary",
};

export default function App() {
  // 关系状态机只在这里挂一次：UI 不持有任何"该不该开口"的计时器。
  useRelationEngine();

  const location = useLocation();
  const navigate = useNavigate();
  const mood = usePresenceStore((s) => s.mood);
  const setRoom = useSpaceStore((s) => s.setRoom);
  const load = useMemoryStore((s) => s.load);

  useEffect(() => {
    setRoom(ROOM_BY_PATH[location.pathname] ?? "space");
  }, [location.pathname, setRoom]);

  useEffect(() => {
    void load();
  }, [load]);

  // 环境色由情绪驱动：整间屋子的光都跟着它，而不是只有一个状态点。
  useEffect(() => {
    const [r, g, b] = MOOD_RGB[mood];
    document.documentElement.style.setProperty("--ambient", `${r} ${g} ${b}`);
  }, [mood]);

  return (
    <Routes>
      <Route path="/" element={<Threshold />} />
      <Route path="/space" element={<SharedSpace />} />
      <Route path="/memory" element={<MemoryHall />} />
      <Route path="/boundary" element={<BoundaryPanel />} />
      <Route path="*" element={<NotFound onBack={() => navigate("/")} />} />
    </Routes>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8">
      <p className="font-serif text-[18px] text-paper/70">这个房间不存在。</p>
      <button
        onClick={onBack}
        className="text-[11px] tracking-[0.2em] text-faint uppercase hover:text-paper/70"
      >
        回门廊
      </button>
    </div>
  );
}
