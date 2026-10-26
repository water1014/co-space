import { useEffect, useState } from "react";

type Weather =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; temp: number; label: string }
  | { state: "error"; reason: string };

const CODE_MAP: Record<number, string> = {
  0: "晴",
  1: "大致晴",
  2: "多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "小毛雨",
  53: "毛毛雨",
  55: "密毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "强阵雨",
  82: "暴雨",
  95: "雷阵雨",
};

/**
 * 天气优先用 Open-Meteo（无需 key），拿不到定位就不编造。
 * 拿不到就说拿不到——这比显示一个假的 24° 诚实。
 */
export function Weather() {
  const [w, setW] = useState<Weather>({ state: "idle" });

  useEffect(() => {
    let alive = true;
    if (!("geolocation" in navigator)) {
      setW({ state: "error", reason: "这个浏览器不支持定位" });
      return;
    }
    setW({ state: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!alive) return;
        try {
          const { latitude, longitude } = pos.coords;
          const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}` +
            `&longitude=${longitude.toFixed(2)}&current=temperature_2m,weather_code`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(String(res.status));
          const json = (await res.json()) as {
            current?: { temperature_2m: number; weather_code: number };
          };
          if (!json.current) throw new Error("no current");
          if (!alive) return;
          setW({
            state: "ok",
            temp: Math.round(json.current.temperature_2m),
            label: CODE_MAP[json.current.weather_code] ?? "未知",
          });
        } catch {
          if (alive) setW({ state: "error", reason: "天气服务没连上" });
        }
      },
      () => {
        if (alive) setW({ state: "error", reason: "没有定位权限" });
      },
      { timeout: 8000, maximumAge: 600_000 },
    );
    return () => {
      alive = false;
    };
  }, []);

  if (w.state === "ok") {
    return (
      <span className="flex items-baseline gap-1.5">
        <span className="num text-[16px] text-ink">{w.temp}°</span>
        <span className="text-[13px] text-ink-faint">{w.label}</span>
      </span>
    );
  }

  return (
    <span className="text-[13px] text-ink-faint">
      {w.state === "loading" ? "在看天气…" : w.state === "error" ? "天气未连接" : "天气"}
    </span>
  );
}
