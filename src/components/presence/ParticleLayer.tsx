import { useEffect, useRef } from "react";
import { ParticleField } from "./useParticleSystem";
import { usePresenceStore } from "../../stores/presenceStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { useRelationStore } from "../../stores/relationStore";
import { MOOD_RGB } from "../../types";

type Props = {
  /** 房间级的强度系数：门廊比共同空间更稀，边界面板中等。 */
  intensity?: number;
  className?: string;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function ParticleLayer({ intensity = 1, className = "" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const field = new ParticleField();
    fieldRef.current = field;

    const count = window.innerWidth < 720 ? 220 : 560;
    let raf = 0;

    void field.init(host, count).then(() => {
      // 场景切换时才做一次性的"点亮"，让背景不是突然出现。
      field.setParams({ density: 0 });
      const start = performance.now();
      const fade = () => {
        const t = Math.min(1, (performance.now() - start) / 1400);
        field.setParams({ density: 0.82 * t });
        if (t < 1) raf = requestAnimationFrame(fade);
      };
      raf = requestAnimationFrame(fade);
    });

    return () => {
      cancelAnimationFrame(raf);
      field.destroy();
      fieldRef.current = null;
    };
  }, []);

  useEffect(() => {
    const apply = () => {
      const field = fieldRef.current;
      if (!field) return;
      const presence = usePresenceStore.getState();
      const space = useSpaceStore.getState();
      const relation = useRelationStore.getState();

      field.setParams({
        energy: presence.energy,
        density: clamp01(space.particleScale * intensity),
        speed: 0.45 + presence.energy * 1.15,
        tint: MOOD_RGB[presence.mood],
        turbulence:
          presence.mood === "restless"
            ? 2.1
            : presence.mood === "calm"
              ? 0.85
              : 1.2,
        focus: space.focus ? 1 : 0,
      });
      if (relation.quietMode) {
        field.setParams({ density: clamp01(space.particleScale * intensity * 0.7) });
      }
    };

    apply();
    const unsubs = [
      usePresenceStore.subscribe(apply),
      useSpaceStore.subscribe(apply),
      useRelationStore.subscribe(apply),
    ];
    return () => unsubs.forEach((u) => u());
  }, [intensity]);

  // 交互脉冲：presence.pulseAt 改变时给一次短促的亮度/速度抬升。
  useEffect(() => {
    return usePresenceStore.subscribe((state, prev) => {
      if (state.pulseAt !== prev.pulseAt) {
        fieldRef.current?.pulse();
      }
    });
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  );
}
