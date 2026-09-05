import { useEffect, useRef } from "react";

/** Lightweight interactive particle background. Canvas-based, no deps. */
export function ParticlesBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0,
      h = 0;
    const pointer = { x: -9999, y: -9999 };

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }
    let parts: P[] = [];

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.floor((w * h) / 18000));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.6 + 0.4,
      }));
    }

    function accentColor() {
      const cs = getComputedStyle(document.documentElement);
      return cs.getPropertyValue("--accent-1").trim() || "#2563eb";
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      const color = accentColor();
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        // pointer influence
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          const f = (130 - Math.sqrt(d2)) / 130;
          p.vx += (dx / (Math.sqrt(d2) || 1)) * f * 0.08;
          p.vy += (dy / (Math.sqrt(d2) || 1)) * f * 0.08;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.fill();
      }
      // lines
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = color;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x;
          const dy = parts[i].y - parts[j].y;
          const d = dx * dx + dy * dy;
          if (d < 110 * 110) {
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-70"
      aria-hidden
    />
  );
}
