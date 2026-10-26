/** 彻底重置：主题、关系、对话、生活数据、记忆库。 */
const KEYS = [
  "co-space::theme",
  "co-space::boundary",
  "co-space::presence",
  "co-space::chat",
  "co-space::life",
  "co-space::connector",
];

export function resetAll() {
  for (const k of KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* 隐私模式可能不可写 */
    }
  }

  const req = indexedDB.deleteDatabase("co-space::v1");
  req.onsuccess = () => location.reload();
  req.onerror = () => location.reload();
  req.onblocked = () => location.reload();
  window.setTimeout(() => location.reload(), 900);
}
