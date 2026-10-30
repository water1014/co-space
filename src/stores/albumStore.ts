import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Photo = {
  id: string;
  dataUrl: string;
  caption: string;
  at: number;
};

type Album = {
  photos: Photo[];
  add: (p: Omit<Photo, "id" | "at">) => void;
  remove: (id: string) => void;
};

let seq = 0;

/** 相册：独立于「记忆」的照片墙，本地持久化。 */
export const useAlbumStore = create<Album>()(
  persist(
    (set) => ({
      photos: [],
      add: (p) => {
        const id = `ph_${Date.now()}_${seq++}`;
        set((s) => ({ photos: [{ ...p, id, at: Date.now() }, ...s.photos] }));
      },
      remove: (id) => set((s) => ({ photos: s.photos.filter((x) => x.id !== id) })),
    }),
    {
      name: "co-space::album",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
