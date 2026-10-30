import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 真·返回：走浏览器历史（navigate(-1)），回到上一页，
 * 而不是重置回首页。只在没有历史栈（直接深链打开）时回首页兜底。
 */
export function useBack() {
  const navigate = useNavigate();
  return useCallback(() => {
    const state = window.history.state as { idx?: number } | null;
    const idx = state?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);
}
