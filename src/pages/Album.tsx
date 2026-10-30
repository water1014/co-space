import { useRef } from "react";
import { BackButton } from "../components/ui/BackButton";
import { useAlbumStore } from "../stores/albumStore";
import { fileToDataUrl } from "../lib/img/resize";
import { IconImages, IconPlus, IconClose } from "../components/ui/icons";

/**
 * 相册：独立照片墙。与「记忆」分开——这里只放你们真实的照片。
 */
export function Album() {
  const photos = useAlbumStore((s) => s.photos);
  const add = useAlbumStore((s) => s.add);
  const remove = useAlbumStore((s) => s.remove);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files).slice(0, 12)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const dataUrl = await fileToDataUrl(f);
        add({ dataUrl, caption: "" });
      } catch {
        /* 忽略单张失败 */
      }
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header className="flex items-center gap-3 px-5 pt-6">
        <BackButton />
        <div className="flex-1">
          <h1 className="page-head-title text-[26px] leading-none text-ink">相册</h1>
          <p className="page-head-sub mt-1 text-[12px]">我们的照片墙</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          aria-label="添加照片"
          className="press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent-soft)]"
        >
          <IconPlus width={18} height={18} />
        </button>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="scroll-area mt-5 min-h-0 flex-1 px-5 pb-10">
        {photos.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-10 flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--line-strong)] py-16 text-ink-faint"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)]">
              <IconImages width={26} height={26} />
            </span>
            <span className="text-[13.5px]">还没有照片，点这里放进第一张</span>
          </button>
        ) : (
          <div className="columns-2 gap-3">
            {photos.map((p) => (
              <figure key={p.id} className="mb-3 break-inside-avoid">
                <div className="group relative overflow-hidden rounded-2xl bg-[var(--surface-2)]">
                  <img src={p.dataUrl} alt={p.caption || "照片"} className="w-full object-cover" />
                  <button
                    onClick={() => remove(p.id)}
                    aria-label="删除"
                    className="press absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                  >
                    <IconClose width={12} height={12} />
                  </button>
                </div>
                <figcaption className="mt-1 px-0.5 text-[10.5px] text-ink-faint">
                  {new Date(p.at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
