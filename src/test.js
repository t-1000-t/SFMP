// Lesson 8

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");

const resize = () => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

new ResizeObserver(resize).observe(canvas);

// ---- particles ----
const N = 800;
const radius = 80;
const damping = 0.985;
const particles = [];
for (let i = 0; i < N; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 60,
    vy: (Math.random() - 0.5) * 60,
    r: 2,
  });
}

// ---- mouse interaction ----
const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

// ---- spatial grid ----
const cellSize = radius;
let cols, rows, grid;
function makeGrid() {
  cols = Math.ceil(canvas.clientWidth / cellSize);
  rows = Math.ceil(canvas.clientHeight / cellSize);
  grid = Array.from({ length: cols * rows }, () => []);
}
function insertParticle(p) {
  const cx = Math.floor(p.x / cellSize);
  const cy = Math.floor(p.y / cellSize);
  const idx = cy * cols + cx;
  if (grid[idx]) grid[idx].push(p);
}

// ---- main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const W = canvas.clientWidth,
    H = canvas.clientHeight;

  // rebuild grid
  makeGrid();
  for (let p of particles) {
    p.vx *= damping;
    p.vy *= damping;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H;
    if (p.y > H) p.y -= H;
    insertParticle(p);
  }

  // draw connections using grid neighbors only
  ctx.lineWidth = 1;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const cell = grid[cy * cols + cx];
      if (!cell.length) continue;

      // neighbor offsets (-1 to +1)
      for (let ny = -1; ny <= 1; ny++) {
        for (let nx = -1; nx <= 1; nx++) {
          const ncell = grid[(cy + ny) * cols + (cx + nx)];
          if (!ncell) continue;

          // check distances only between these 2 groups
          for (let a of cell) {
            for (let b of ncell) {
              if (a === b) continue;
              const dx = a.x - b.x,
                dy = a.y - b.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < radius * radius) {
                const d = Math.sqrt(d2);
                const alpha = 1 - d / radius;
                ctx.strokeStyle = `rgba(180,200,255,${alpha * 0.3})`;
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

  // draw particles
  ctx.fillStyle = "#9fd";
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  hud.textContent = `Lesson 8 — Spatial Partitioning • ${N} particles • grid ${cols}x${rows}`;
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
