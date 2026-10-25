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
