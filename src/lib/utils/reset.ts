/** 彻底重置：关系参数、存在状态、本地记忆库。 */
export function resetLocalData() {
  try {
    localStorage.removeItem("co-space::relation");
    localStorage.removeItem("co-space::presence");
  } catch {
    /* 隐私模式下 localStorage 可能不可写 */
  }

  const req = indexedDB.deleteDatabase("co-space::v1");
  req.onsuccess = () => location.reload();
  req.onerror = () => location.reload();
  // 其它标签页还开着时会 blocked，别一直等。
  req.onblocked = () => location.reload();
  window.setTimeout(() => location.reload(), 800);
}
