// Lesson 6

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

const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

// ---- forces ----
let windAngle = 0;
let gravity = { x: 0, y: 120 };
let wind = { x: 60, y: 0 };
let mouseForce = 1;
let mode = "attract"; // attract | repel | none

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w") mode = "attract";
  if (k === "e") mode = "repel";
  if (k === "q") mode = "none";
});

// ---- particles ----
const N = 300;
const damping = 0.985;
const particles = [];
for (let i = 0; i < N; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: 0,
    vy: 0,
    r: 2 + Math.random() * 2,
  });
}

// ---- loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  windAngle += 0.2 * dt;
  wind.x = Math.cos(windAngle) * 80;
  wind.y = Math.sin(windAngle) * 30;

  const W = canvas.clientWidth,
    H = canvas.clientHeight;
  for (let p of particles) {
    // forces reset
    let ax = gravity.x,
      ay = gravity.y;
    ax += wind.x;
    ay += wind.y;

    if (mode !== "none") {
      const dx = mouse.x - p.x,
        dy = mouse.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 25 && d2 < 40000) {
        const inv = 1 / Math.sqrt(d2);
        const k = ((mode === "repel" ? 1 : -1) * mouseForce * 15000) / d2;
        ax += dx * inv * k;
        ay += dy * inv * k;
      }
    }

    // integrate
    p.vx += ax * dt;
    p.vy += ay * dt;
    p.vx *= damping;
    p.vy *= damping;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // wrap edges
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H;
    if (p.y > H) p.y -= H;

    // draw
    const sp = Math.hypot(p.vx, p.vy);
    ctx.fillStyle = `hsl(${180 + sp * 4},80%,60%)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // cursor visual
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  hud.innerHTML = `<strong>Lesson 6</strong> — Force Fields<br>
  Mode: <kbd>Q</kbd> none • <kbd>W</kbd> attract • <kbd>E</kbd> repel<br>
  Gravity ${gravity.y.toFixed(0)} | Wind ${wind.x.toFixed(0)} | ${
    particles.length
  } particles`;

  requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
