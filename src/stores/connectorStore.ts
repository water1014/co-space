import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConnectorId, ModelConfig } from "../types";

type ConnectorState = {
  enabled: Record<ConnectorId, boolean>;
  model: ModelConfig;
  /**
   * API Key 只在内存里活一次：不落 localStorage，刷新即失效。
   * 这类凭据不该因为"方便"而长期留在浏览器里。
   */
  sessionKey: string;

  setConnector: (id: ConnectorId, on: boolean) => void;
  setModel: (patch: Partial<ModelConfig>) => void;
  setSessionKey: (key: string) => void;
};

export const useConnectorStore = create<ConnectorState>()(
  persist(
    (set, get) => ({
      enabled: { map: false, mail: false, files: false, mcp: false },
      model: { baseUrl: "", model: "gpt-4o-mini", hasKey: false },
      sessionKey: "",

      setConnector: (id, on) =>
        set({ enabled: { ...get().enabled, [id]: on } }),

      setModel: (patch) =>
        set({ model: { ...get().model, ...patch } }),

      setSessionKey: (sessionKey) =>
        set({
          sessionKey,
          model: { ...get().model, hasKey: sessionKey.length > 0 },
        }),
    }),
    {
      name: "co-space::connector",
      storage: createJSONStorage(() => localStorage),
      // sessionKey 刻意不持久化
      partialize: (s) => ({
        enabled: s.enabled,
        model: { ...s.model, hasKey: false },
      }),
    },
  ),
);
