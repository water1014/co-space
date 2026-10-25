import {
  Application,
  Container,
  Particle,
  ParticleContainer,
  Texture,
} from "pixi.js";
import { MOOD_RGB, type Mood } from "../../types";

/**
 * 存在感层。
 *
 * 用 ParticleContainer 而不是一堆 CSS 元素：位置与颜色声明为 dynamic，
 * 其余（rotation / vertex / uvs）保持静态，避免每帧把不变的属性也传上 GPU。
 * 手头这版千级粒子在任何设备上都很轻，但它为以后加到十万级留了同一条路径。
 */

type P = {
  particle: Particle;
  x: number;
  y: number;
  depth: number;
  rank: number;
  speed: number;
  phase: number;
  drift: number;
  alpha: number;
  baseAlpha: number;
};

export type FieldParams = {
  energy: number;
  density: number;
  speed: number;
  tint: [number, number, number];
  turbulence: number;
  pulse: number;
  focus: number;
};

const packColor = (c: [number, number, number], a: number) => {
  const r = Math.round(c[0]);
  const g = Math.round(c[1]);
  const b = Math.round(c[2]);
  const alpha = Math.round(Math.max(0, Math.min(1, a)) * 255);
  return ((r << 24) | (g << 16) | (b << 8) | alpha) >>> 0;
};

function softDotTexture(): Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.28)");
  grad.addColorStop(0.65, "rgba(255,255,255,0.06)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

export class ParticleField {
  private app: Application | null = null;
  private root: Container | null = null;
  private container: ParticleContainer | null = null;
  private texture: Texture | null = null;
  private particles: P[] = [];
  private width = 1;
  private height = 1;
  private elapsed = 0;
  private pointer = { x: 0, y: 0 };
  private pointerTarget = { x: 0, y: 0 };
  private currentTint: [number, number, number] = [201, 168, 124];
  private destroyed = false;
  private cleanupPointer: (() => void) | null = null;
  private pulseEnergy = 0;

  async init(host: HTMLDivElement, maxCount: number) {
    const app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgl",
    });
    if (this.destroyed) {
      app.destroy(true);
      return;
    }
    host.appendChild(app.canvas);
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.display = "block";

    this.app = app;
    this.texture = softDotTexture();
    this.width = app.screen.width;
    this.height = app.screen.height;

    const root = new Container();
    const container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        color: true,
        rotation: false,
        vertex: false,
        uvs: false,
      },
    });
    root.addChild(container);
    app.stage.addChild(root);
    this.root = root;
    this.container = container;

    this.build(maxCount);

    app.renderer.on("resize", (w: number, h: number) => {
      this.width = w;
      this.height = h;
      for (const p of this.particles) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
      }
    });

    const onMove = (e: PointerEvent) => {
      this.pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    this.cleanupPointer = () =>
      window.removeEventListener("pointermove", onMove);

    app.ticker.add((ticker) => {
      this.update(ticker.deltaMS / 1000);
    });
  }

  private build(count: number) {    if (!this.container || !this.texture) return;
    for (let i = 0; i < count; i++) {
      const depth = Math.random();
      const particle = new Particle({
        texture: this.texture,
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 0.05 + depth * depth * 0.16,
        scaleY: 0.05 + depth * depth * 0.16,
        tint: 0xffffff,
        alpha: 0,
      });
      this.container.addParticle(particle);
      const baseAlpha = 0.05 + depth * depth * 0.26;
      this.particles.push({
        particle,
        x: particle.x,
        y: particle.y,
        depth,
        rank: Math.random(),
        speed: 0.35 + depth * 1.5,
        phase: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 1.2,
        alpha: 0,
        baseAlpha,
      });
    }
  }

  private update(dt: number) {
    if (!this.container || !this.root) return;
    this.elapsed += dt;

    const params = this.readParams();

    // 视差：容器整体随指针轻移，不逐粒子计算。
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.03;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.03;
    this.root.x = -this.pointer.x * 9;
    this.root.y = -this.pointer.y * 7;
    this.root.scale.set(1 + Math.sin(this.elapsed * 0.35) * 0.004);
    this.container.alpha = 0.9;

    // 色温平滑靠近目标 mood 色，不硬切。
    for (let i = 0; i < 3; i++) {
      this.currentTint[i] += (params.tint[i] - this.currentTint[i]) * 0.02;
    }

    this.pulseEnergy *= Math.exp(-dt * 1.7);
    const pulse = this.pulseEnergy;
    const speedScale = params.speed * (1 + pulse * 0.85);
    const breathe = 0.72 + Math.sin(this.elapsed * 0.55) * 0.28;

    for (const p of this.particles) {
      const localSpeed = p.speed * speedScale * (0.4 + params.energy * 0.8);
      p.y -= localSpeed * 22 * dt;
      p.x +=
        Math.sin(this.elapsed * 0.42 * p.drift + p.phase) *
        params.turbulence *
        9 *
        dt;
      p.x += this.pointer.x * (0.6 + p.depth * 1.8) * dt * 12;

      if (p.y < -40) {
        p.y = this.height + 30;
        p.x = Math.random() * this.width;
      }
      if (p.x < -40) p.x = this.width + 30;
      if (p.x > this.width + 40) p.x = -30;

      // 密度靠 rank 阈值淡入淡出，不增删粒子，避免闪烁。
      const inField = p.rank < params.density;
      const target = inField
        ? p.baseAlpha *
          (0.5 + 0.5 * breathe) *
          (1 - params.focus * 0.6) *
          (1 + pulse * 0.35) *
          0.78
        : 0;
      p.alpha += (target - p.alpha) * Math.min(1, dt * 3.2);

      p.particle.x = p.x;
      p.particle.y = p.y;
      p.particle.color = packColor(this.currentTint, p.alpha);
    }
  }

  /** 由外部注入参数：粒子层不认识 store，只认识这些数。 */
  params: FieldParams = {
    energy: 0.7,
    density: 0.8,
    speed: 1,
    tint: MOOD_RGB.calm,
    turbulence: 1,
    pulse: 0,
    focus: 0,
  };

  private readParams(): FieldParams {
    return this.params;
  }

  /** 一次交互的脉冲：短时间内粒子更亮、更快，然后自己退回去。 */
  pulse() {
    this.pulseEnergy = 1;
  }

  setParams(next: Partial<FieldParams>) {
    this.params = { ...this.params, ...next };
  }

  setTint(mood: Mood) {
    this.params = { ...this.params, tint: MOOD_RGB[mood] };
  }

  destroy() {
    this.destroyed = true;
    this.cleanupPointer?.();
    this.cleanupPointer = null;
    this.particles = [];
    this.container = null;
    this.root = null;
    this.texture?.destroy(true);
    this.texture = null;
    this.app?.destroy(true, { children: true, texture: false });
    this.app = null;
  }
}
