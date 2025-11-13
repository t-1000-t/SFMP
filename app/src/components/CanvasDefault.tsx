import React, { useRef, useEffect, useState } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
};

const Lesson11: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"none" | "attract" | "repel">("none");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    new ResizeObserver(resize).observe(canvas);
    resize();

    const particles: Particle[] = [];
    const spawn = (x: number, y: number, count = 5) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          r: 2 + Math.random() * 2,
          color: `hsl(${200 + Math.random() * 100},80%,60%)`,
        });
      }
    };
    spawn(canvas.clientWidth / 2, canvas.clientHeight / 2, 150);

    const mouse = { x: 0, y: 0, down: false, px: 0, py: 0 };
    const move = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const down = () => {
      mouse.down = true;
    };
    const up = () => {
      mouse.down = false;
    };
    const click = (e: MouseEvent) => {
      if (e.shiftKey) spawn(mouse.x, mouse.y, 30);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("click", click);

    const gravity = 120;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      for (const p of particles) {
        // mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 30000 && d2 > 4) {
          const inv = 1 / Math.sqrt(d2);
          const fx = dx * inv;
          const fy = dy * inv;
          const force = 5000 / d2;
          if (mode === "attract") {
            p.vx += fx * force * dt;
            p.vy += fy * force * dt;
          } else if (mode === "repel") {
            p.vx -= fx * force * dt;
            p.vy -= fy * force * dt;
          }
        }

        // drag motion (if holding mouse)
        if (mouse.down) {
          const mdx = mouse.x - mouse.px;
          const mdy = mouse.y - mouse.py;
          if (d2 < 25000) {
            p.vx += mdx * 10 * dt;
            p.vy += mdy * 10 * dt;
          }
        }

        // gravity & motion
        p.vy += gravity * dt * 0.1;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.99;
        p.vy *= 0.99;

        // wrap edges
        if (p.x < 0) p.x += canvas.clientWidth;
        if (p.x > canvas.clientWidth) p.x -= canvas.clientWidth;
        if (p.y < 0) p.y += canvas.clientHeight;
        if (p.y > canvas.clientHeight) p.y -= canvas.clientHeight;
      }

      // draw
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("click", click);
    };
  }, [mode]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#05070a" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "#cfe",
          background: "#0a0f16cc",
          padding: "8px 10px",
          borderRadius: 8,
          fontFamily: "system-ui",
          fontSize: 13,
        }}
      >
        <strong>Lesson 11 — Interactive Physics Editing</strong>
        <br />
        Mode: <b>{mode}</b> (Press A = Attract, R = Repel, N = None)
        <br />
        <small>Shift-Click = Spawn Particles • Drag = Push Particles</small>
      </div>
      <KeyHandler setMode={setMode} />
    </div>
  );
};

const KeyHandler: React.FC<{
  setMode: (m: "none" | "attract" | "repel") => void;
}> = ({ setMode }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "a") setMode("attract");
      if (e.key.toLowerCase() === "r") setMode("repel");
      if (e.key.toLowerCase() === "n") setMode("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMode]);
  return null;
};

export default Lesson11;
