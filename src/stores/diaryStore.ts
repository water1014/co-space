import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Annotation, Book, DiaryEntry } from "../types";
import { dayKeyOf, uid } from "../lib/utils/id";
import { bookSeed, diarySeed } from "../content";



/** 一本内置的书：按段落拆好，划线批注才能定位到"哪一句"。 */
const SEED_BOOK: Book = {
  id: "b-default",
  title: bookSeed.title,
  author: bookSeed.author,
  paragraphs: bookSeed.paragraphs,
};

type DiaryState = {
  entries: DiaryEntry[];
  books: Book[];
  annotations: Annotation[];
  activeBookId: string;
  loaded: boolean;

  load: () => void;
  upsertEntry: (date: string, text: string, mood: string) => void;
  removeEntry: (id: string) => void;
  setActiveBook: (id: string) => void;
  addAnnotation: (input: {
    bookId: string;
    paraIndex: number;
    quote: string;
    note: string;
    reply: string;
  }) => void;
  removeAnnotation: (id: string) => void;
};

const seedEntries = (): DiaryEntry[] =>
  diarySeed.map((d, i) => {
    const day = new Date(Date.now() - d.daysAgo * 86_400_000);
    // 时间要落在那一天里，卡片上「Tue · 22:07」才不是同一个时刻。
    day.setHours(21 - (i % 3) * 2, 7 + i * 11, 0, 0);
    const at = day.getTime();
    return {
      id: uid("d"),
      date: dayKeyOf(day),
      text: d.text,
      mood: d.mood,
      createdAt: at,
      updatedAt: at,
    };
  });

const seedAnnotations = (bookId: string): Annotation[] => [
  {
    id: uid("an"),
    bookId,
    paraIndex: 2,
    quote:
      "“你有没有过那种时刻，”她后来写道，“明明很想留下，却还是转身走了，因为留下的代价是你自己都付不起的。”",
    note: "这一段我懂。",
    reply:
      "你也说过类似的话。区别是，你转身之后还会回头看一眼——那一下，比“走”本身更让我记得你。",
    createdAt: Date.now(),
  },
];

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      books: [SEED_BOOK],
      annotations: [],
      activeBookId: SEED_BOOK.id,
      loaded: false,

      load: () => {
        if (get().loaded) return;
        set({
          entries: seedEntries(),
          annotations: seedAnnotations(SEED_BOOK.id),
          loaded: true,
        });
      },

      upsertEntry: (date, text, mood) => {
        const now = Date.now();
        const existing = get().entries.find((e) => e.date === date);
        if (existing) {
          set({
            entries: get().entries.map((e) =>
              e.id === existing.id ? { ...e, text, mood, updatedAt: now } : e,
            ),
          });
          return;
        }
        set({
          entries: [
            { id: uid("d"), date, text, mood, createdAt: now, updatedAt: now },
            ...get().entries,
          ],
        });
      },

      removeEntry: (id) =>
        set({ entries: get().entries.filter((e) => e.id !== id) }),

      setActiveBook: (id) => set({ activeBookId: id }),

      addAnnotation: ({ bookId, paraIndex, quote, note, reply }) =>
        set({
          annotations: [
            {
              id: uid("an"),
              bookId,
              paraIndex,
              quote,
              note,
              reply,
              createdAt: Date.now(),
            },
            ...get().annotations,
          ],
        }),

      removeAnnotation: (id) =>
        set({ annotations: get().annotations.filter((a) => a.id !== id) }),
    }),
    {
      name: "co-space::diary",
      storage: createJSONStorage(() => localStorage),
      // 种子只在首次写入；后续以用户数据为准。
      partialize: (s) => ({
        entries: s.entries,
        annotations: s.annotations,
        activeBookId: s.activeBookId,
      }),
    },
  ),
);

/** 针对划线的 mock 回复：短、接得住那一句话，不堆情绪。 */
export function replyToQuote(quote: string, note: string): string {
  const q = quote.slice(0, 24).replace(/[“"”]/g, "");
  if (note) return `你写“${note}”的时候，我想起的是你自己在 ${q}… 这件事上，从不肯放过自己。`;
  return `这段话我读了两遍。你划它，说明它戳到了你没说出口的那一句——${q}…`;
}
