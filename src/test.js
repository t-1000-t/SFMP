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

// ---- state ----
const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

const N = 200;
const particles = [];
const radius = 100;
for (let i = 0; i < N; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 80,
    vy: (Math.random() - 0.5) * 80,
    r: 2,
    color: `hsl(${200 + Math.random() * 100},80%,60%)`,
  });
}

// ---- loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const W = canvas.clientWidth,
    H = canvas.clientHeight;

  // update positions
  for (let p of particles) {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 20000) {
      // gentle repel from mouse
      const inv = 1 / Math.sqrt(d2 || 1);
      p.vx -= dx * inv * 200 * dt;
      p.vy -= dy * inv * 200 * dt;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H;
    if (p.y > H) p.y -= H;
  }

  // draw connections
  ctx.lineWidth = 1;
  for (let i = 0; i < N; i++) {
    const a = particles[i];
    for (let j = i + 1; j < N; j++) {
      const b = particles[j];
      const dx = a.x - b.x,
        dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < radius * radius) {
        const d = Math.sqrt(d2);
        const alpha = 1 - d / radius;
        ctx.strokeStyle = `rgba(150,180,255,${alpha * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // draw particles
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  // cursor
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  hud.textContent = `Lesson 7 — Connections • ${N} particles • link radius ${radius}px`;
  requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
