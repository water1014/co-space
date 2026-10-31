import fs from "node:fs";
import path from "node:path";

/**
 * GitHub Pages 的 SPA 回退：
 * 未知路径会返回 404.html，它把原始路径塞进 sessionStorage 再跳回 index.html，
 * React Router 接管后按原始路径渲染。
 */
const dist = path.resolve("dist");
const indexPath = path.join(dist, "index.html");
const base = process.env.VITE_BASE_PATH ?? "/co-space/";
const normalizedBase = base.endsWith("/") ? base : `${base}/`;

if (!fs.existsSync(indexPath)) {
  console.error("[postbuild] dist/index.html 不存在，构建可能失败了");
  process.exit(1);
}

const html = fs.readFileSync(indexPath, "utf8");
const inject = `<script>(function(){try{sessionStorage.setItem("spa:redirect",location.pathname+location.search+location.hash);}catch(e){}location.replace(${JSON.stringify(
  normalizedBase,
)});})();</script>`;

const fallback = html.replace(/<head>/i, `<head>${inject}`);
fs.writeFileSync(path.join(dist, "404.html"), fallback);

// GitHub Pages 默认走 Jekyll；空的 .nojekyll 让 _assets 这类目录名不被忽略。
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

console.log(`[postbuild] 404.html 已生成，回退目标 ${normalizedBase}`);

// 将老师原版 Sealed Days 静态页面与资源一并复制到 Pages 产物。
// vendor 位于仓库根目录，不属于 Vite 默认 publicDir，必须显式复制。
const vendorSource = path.resolve("vendor/sealed-days");
const vendorTarget = path.join(dist, "vendor", "sealed-days");
if (fs.existsSync(vendorSource)) {
  fs.mkdirSync(vendorTarget, { recursive: true });
  fs.cpSync(vendorSource, vendorTarget, { recursive: true });
  console.log("[postbuild] Sealed Days 原版树资源已复制到 dist/vendor/sealed-days");
} else {
  console.error("[postbuild] 缺少 vendor/sealed-days，无法发布原版记忆树");
  process.exit(1);
}
