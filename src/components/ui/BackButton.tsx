import { useBack } from "../../lib/nav/useBack";
import { IconChevron } from "./icons";

/** 统一的圆形返回键：走浏览器历史返回上一页。 */
export function BackButton({ className = "" }: { className?: string }) {
  const back = useBack();
  return (
    <button
      onClick={back}
      aria-label="返回"
      className={`round-btn press flex h-9 w-9 flex-none items-center justify-center rounded-full transition-colors hover:text-ink ${className}`}
    >
      <IconChevron width={17} height={17} className="rotate-180" />
    </button>
  );
}
