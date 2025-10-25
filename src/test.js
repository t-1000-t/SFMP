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
// ---- physics modes ----
// Press D to toggle Drift, G for Gravity, O to switch Off.
let physicsMode = "Drift"; // "Drift" | "Gravity" | "Off"
const DRIFT_FORCE = 22; // px/s^2 magnitude of the flow field
const DRIFT_SCALE = 180; // spatial scale of flow ripples
const GRAVITY_K = 0.25; // spring-like pull towards screen center
const MAX_V = 140; // clamp speeds for stability
let t = 0; // time accumulator for drift animation

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
  if (e.key === "d" || e.key === "D") physicsMode = "Drift";
  // if (e.key === "g" || e.key === "G") physicsMode = "Gravity";
  if (e.key === "o" || e.key === "O") physicsMode = "Off";
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
    // ---- PHYSICS INTEGRATION ----
    // compute forces
    let ax = 0,
      ay = 0;

    if (physicsMode === "Drift") {
      // jelly-like wavy flow field
      const u = (p.y + t * 120) / DRIFT_SCALE;
      const v = (p.x - t * 90) / DRIFT_SCALE;
      ax += Math.sin(u) * DRIFT_FORCE;
      ay += Math.cos(v) * DRIFT_FORCE;
    } else if (physicsMode === "Gravity") {
      // soft spring toward center
      // const dx = cx - p.x;
      // const dy = cy - p.y;
      // ax += (dx * GRAVITY_K) / 100;
      // ay += (dy * GRAVITY_K) / 100;
      return;
    }

    // apply acceleration, damping, and integrate motion
    p.vx = (p.vx + ax * dt) * damping;
    p.vy = (p.vy + ay * dt) * damping;

    // limit max velocity for stability
    const speed2 = p.vx * p.vx + p.vy * p.vy;
    if (speed2 > MAX_V * MAX_V) {
      const s = Math.sqrt(speed2);
      const k = MAX_V / s;
      p.vx *= k;
      p.vy *= k;
    }

    // update position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // screen wrapping
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H;
    if (p.y > H) p.y -= H;

    insertParticle(p);
  }

  // ---- measure connection loop time ----
  const t0 = performance.now();

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

  const t1 = performance.now();
  const computeMs = (t1 - t0).toFixed(2);

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

  hud.textContent =
    `Lesson 8 — Spatial Partitioning • ${N} particles • grid ${cols}x${rows} • ` +
    `cell ${cellSize}px • physics ${physicsMode} | compute ${computeMs} ms - type O or D batton`;

  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
