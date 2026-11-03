/* 镜花水月对 Sealed Days 原版页面的轻量配置。 */
window.SD_CONFIG = {
  owner: "镜花水月",
  api: "",
  title: "镜花水月 · 藏忆阁"
};
(function () {
  var C = window.SD_CONFIG || {};
  if (C.title) document.title = C.title;
  if (C.owner) document.querySelectorAll("[data-sd-owner]").forEach(function (el) { el.textContent = C.owner; });
})();
