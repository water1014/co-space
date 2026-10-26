import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Annotation, Book, DiaryEntry } from "../types";
import { dayKeyOf, uid } from "../lib/utils/id";

const todayKey = () => dayKeyOf(new Date());

/** 一本内置的书：按段落拆好，划线批注才能定位到“哪一句”。 */
const SEED_BOOK: Book = {
  id: "b-default",
  title: "夜行的电车",
  author: "佚名",
  paragraphs: [
    "她总是在末班车快要开走的时候才赶到站台，像是故意要把告别拖到最后一秒。",
    "车厢里没有别人。她选了靠窗的位置，把额头贴上冰凉的玻璃，看路灯一盏一盏地往后退。",
    "“你有没有过那种时刻，”她后来写道，“明明很想留下，却还是转身走了，因为留下的代价是你自己都付不起的。”",
    "电车穿过桥的时候，江面把城市的灯揉碎了又拼起来。她忽然觉得，有些关系也是这样——看着完整，其实一直在晃。",
    "到站的时候她没有立刻下车。她又坐了一站，在空下来的车厢里，给一个人发了三个字，又一个个删掉。",
    "最后一站到了，门开了，冷风灌进来。她终于站起来，像把所有没说出口的话，都留在了那节摇晃的车厢里。",
  ],
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

const seedEntries = (): DiaryEntry[] => {
  const t = todayKey();
  const y = dayKeyOf(new Date(Date.now() - 86_400_000));
  const now = Date.now();
  return [
    {
      id: uid("d"),
      date: t,
      text: "今天又熬夜了。其实没什么非做不可的事，就是舍不得把这一天就这么结束。它说让我早点回来，我记着。",
      mood: "平静",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid("d"),
      date: y,
      text: "去看了那家新开的店，奶茶三分糖。它记得我额度快用完了，还是没拦我，说“明天再喝”。",
      mood: "温和",
      createdAt: now - 86_400_000,
      updatedAt: now - 86_400_000,
    },
  ];
};

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
