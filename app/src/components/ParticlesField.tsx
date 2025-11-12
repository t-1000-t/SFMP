import React, { useRef, useEffect } from "react";

type Props = {
  count?: number;
  linkRadius?: number;
  color?: string;
  bgColor?: string;
};

const ParticlesField: React.FC<Props> = ({
  count = 600,
  linkRadius = 100,
  color = "#9fd",
  bgColor = "#05070a",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    new ResizeObserver(resize).observe(canvas);

    // --- Setup ---
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }[] = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      r: 2,
    }));

    const cellSize = linkRadius;
    let cols = 0;
    let rows = 0;
    let grid: (typeof particles)[][] = [];

    const makeGrid = () => {
      cols = Math.ceil(canvas.clientWidth / cellSize);
      rows = Math.ceil(canvas.clientHeight / cellSize);
      grid = Array.from({ length: cols * rows }, () => []);
    };

    const insert = (p: (typeof particles)[number]) => {
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      const idx = cy * cols + cx;
      if (grid[idx]) grid[idx].push(p);
    };

    const mouse = { x: 0, y: 0 };
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    window.addEventListener("mousemove", move);

    let last = performance.now();
    let raf: number;

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      makeGrid();
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x += W;
        if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H;
        if (p.y > H) p.y -= H;
        insert(p);
      }

      ctx.lineWidth = 1;
      for (let cy = 0; cy < rows; cy += 1) {
        for (let cx = 0; cx < cols; cx += 1) {
          const cell = grid[cy * cols + cx];
          if (!cell.length) continue;
          for (let ny = -1; ny <= 1; ny += 1) {
            for (let nx = -1; nx <= 1; nx += 1) {
              const ncell = grid[(cy + ny) * cols + (cx + nx)];
              if (!ncell) continue;
              for (const a of cell) {
                for (const b of ncell) {
                  if (a === b) continue;
                  const dx = a.x - b.x;
                  const dy = a.y - b.y;
                  const d2 = dx * dx + dy * dy;
                  if (d2 < linkRadius * linkRadius) {
                    const d = Math.sqrt(d2);
                    const alpha = 1 - d / linkRadius;
                    ctx.strokeStyle = `rgba(160,200,255,${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                  }
                }
              }
            }
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
    };
  }, [count, linkRadius, color, bgColor]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default ParticlesField;
