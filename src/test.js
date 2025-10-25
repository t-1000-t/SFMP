// Lesson 8 — Spatial Partitioning with Dynamic Cell Size (Arrow Keys)

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");

// ---- resizing / HiDPI ----
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

// ---- mouse (for cursor dot only) ----
const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

// ---- spatial grid ----
let cellSize = radius; // <-- dynamic now
let cols, rows, grid;
function makeGrid() {
  cols = Math.max(1, Math.ceil(canvas.clientWidth / cellSize));
  rows = Math.max(1, Math.ceil(canvas.clientHeight / cellSize));
  grid = Array.from({ length: cols * rows }, () => []);
}
function insertParticle(p) {
  const cx = Math.floor(p.x / cellSize);
  const cy = Math.floor(p.y / cellSize);
  const idx = cy * cols + cx;
  if (grid[idx]) grid[idx].push(p);
}

// ---- keyboard: adjust grid density ----
window.addEventListener("keydown", (e) => {
  // prevent the page from scrolling on arrow keys
  if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  if (e.key === "ArrowUp") cellSize = Math.min(300, cellSize + 10);
  if (e.key === "ArrowDown") cellSize = Math.max(30, cellSize - 10);
});

// Choose only half the neighbors to avoid double work
const neighborOffsets = [
  [0, 0], // same cell (handle j>i inside)
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
];

// ---- main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  // fade trail
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, W, H);

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

      for (const [nx, ny] of neighborOffsets) {
        const ncy = cy + ny;
        const ncx = cx + nx;
        if (ncy < 0 || ncy >= rows || ncx < 0 || ncx >= cols) continue;
        const ncell = grid[ncy * cols + ncx];
        if (!ncell || !ncell.length) continue;

        if (nx === 0 && ny === 0) {
          // same cell — only pair j>i to avoid duplicates
          for (let i = 0; i < cell.length; i++) {
            const a = cell[i];
            for (let j = i + 1; j < cell.length; j++) {
              const b = cell[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
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
        } else {
          // different cells — pair all
          for (let i = 0; i < cell.length; i++) {
            const a = cell[i];
            for (let j = 0; j < ncell.length; j++) {
              const b = ncell[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
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

  // optional grid overlay (draw once, not per-cell)
  ctx.strokeStyle = "rgba(100,100,150,0.2)";
  for (let x = 0; x < W; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // draw particles
  ctx.fillStyle = "#9fd";
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // cursor dot
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  hud.textContent = `Lesson 8 — Spatial Partitioning • ${N} particles • grid ${cols}x${rows} • cell ${cellSize}px`;
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
