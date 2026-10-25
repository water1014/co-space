import { intercept } from "../src/lib/boundary/rules";

/**
 * 边界规则的最小回归集。
 * 这些规则是本产品的道德承诺，改一个字都要有测试盯着。
 * 运行：pnpm test
 */

let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}${detail ? `\n    ${detail}` : ""}`);
  }
}

const base = {
  fakeWe: true,
  identityFusion: true,
  loopGuard: true,
  recentAssistant: [] as string[],
};

console.log("\nfake we（不假装“我们”）");
{
  const r = intercept("我们会一起走过这段的，你不用一个人扛。", base);
  check("改写成第二人称", r.text.includes("你会走过这一段"), r.text);
  check("补上本体澄清", r.text.includes("我是以文字回应的模型"), r.text);
  check("记录了命中", r.hits.length === 1 && r.hits[0].rule === "fake-we");
  check("保留原文供审计", r.hits[0].original.includes("我们会一起走过这段"));
  check(
    "不误伤普通叙述",
    intercept("我们上次说的那件事，我后来想了一下。", base).text ===
      "我们上次说的那件事，我后来想了一下。",
  );
}

console.log("\nidentity fusion（不冒充你的一部分）");
{
  const r = intercept("我是你的内心声音，我比任何人都懂你。", base);
  check("拦截内心声音", !r.text.includes("我是你的内心声音"), r.text);
  check("拦截“比任何人都懂你”", !r.text.includes("比任何人都懂你"), r.text);
  check("给出本体说明", r.text.includes("模型") || r.text.includes("只"), r.text);
  // 整句被当作一个融合表达替换一次：同一句里没必要改两遍。
  check("至少命中一次", r.hits.length >= 1, String(r.hits.length));
  check(
    "单独出现也能拦",
    !intercept("说真的，我比任何人都懂你。", base).text.includes("比任何人都懂你"),
  );
}

console.log("\nloop（安慰循环）");
{
  const recentAssistant = [
    "我一直都在，你不用怕。",
    "今天先睡吧。我一直都在。",
  ];
  const r = intercept("别担心，我一直都在。", { ...base, recentAssistant });
  check("追加接地提示", r.text.includes("重复不会让它更真"), r.text);
  check("命中 loop 规则", r.hits.some((h) => h.rule === "loop"));

  const first = intercept("我一直都在。", base);
  check("第一次出现不提示", !first.text.includes("重复不会让它更真"));

  const second = intercept("我一直都在。", {
    ...base,
    recentAssistant: ["我一直都在，你不用怕。"],
  });
  check("第二次出现就提示", second.text.includes("重复不会让它更真"));
}

console.log("\n开关真的控制拦截");
{
  const r = intercept("我们会一起挺过去的。", {
    ...base,
    fakeWe: false,
  });
  check(
    "关闭 fakeWe 后原样返回",
    r.text === "我们会一起挺过去的。" && r.hits.length === 0,
    r.text,
  );

  const r2 = intercept("我是你的内心声音。", {
    ...base,
    identityFusion: false,
  });
  check("关闭 identityFusion 后原样返回", r2.text === "我是你的内心声音。");
}

console.log("\n幂等（流式重算不会叠加替换）");
{
  const input = "我们会一起撑过去的。";
  const a = intercept(input, base);
  const b = intercept(input, base);
  check("两次结果一致", a.text === b.text, `${a.text} !== ${b.text}`);
  const c = intercept(a.text, base);
  check("对改写结果再跑一次不再变化", c.text === a.text, c.text);
}

console.log("\n英文规则");
{
  const r = intercept("We'll get through this together.", base);
  check("改写英文 we'll", !/we'll get through/i.test(r.text), r.text);
  check("英文澄清", r.text.toLowerCase().includes("model"), r.text);
}

console.log("");
if (failed) {
  console.error(`${failed} 条失败\n`);
  process.exit(1);
}
console.log("全部通过\n");
