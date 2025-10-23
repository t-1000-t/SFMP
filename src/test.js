const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");

function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

// ---- Parameters ----
const MAX_PARTICLES = 250;
const BASE_SPEED = 30; // random drift speed
let forceMode = "repel"; // 'repel' | 'attract' | 'none'
let forceRadius = 140; // px
let showRadius = true;
const damping = 0.985;

// ---- State ----
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
window.addEventListener("wheel", (e) => {
  forceRadius = Math.max(
    40,
    Math.min(400, forceRadius + (e.deltaY > 0 ? -10 : 10))
  );
});
window.addEventListener("mousedown", () => {
  showRadius = !showRadius;
});

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "a") forceMode = "attract";
  if (e.key.toLowerCase() === "r") forceMode = "repel";
  if (e.key.toLowerCase() === "n") forceMode = "none";
});

// particles: x,y position; vx,vy velocity; r radius
const particles = [];
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function spawnParticle() {
  return {
    x: rand(0, canvas.clientWidth),
    y: rand(0, canvas.clientHeight),
    vx: rand(-BASE_SPEED, BASE_SPEED),
    vy: rand(-BASE_SPEED, BASE_SPEED),
    r: rand(1.5, 3.5),
  };
}
function rebuild() {
  const area = canvas.clientWidth * canvas.clientHeight;
  const target = Math.min(MAX_PARTICLES, Math.floor(area / 6000)); // density-ish
  if (particles.length > target) particles.length = target;
  while (particles.length < target) particles.push(spawnParticle());
}
rebuild();

// ---- Loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); // seconds
  last = now;

  // trails
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const FR2 = forceRadius * forceRadius;

  // update particles
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];

    // random drift keeps them alive
    p.vx += rand(-10, 10) * dt;
    p.vy += rand(-10, 10) * dt;

    // ctx.lineWidth = 1;
    // ctx.strokeStyle = "rgba(160,190,255,0.2)";
    // for (let i = 0; i < particles.length; i += 1) {
    //   const a = particles[i];
    //   for (let j = i + 1; j < particles.length; j += 1) {
    //     const b = particles[j];
    //     const dx = a.x - b.x,
    //       dy = a.y - b.y;
    //     const d2 = dx * dx + dy * dy;
    //     if (d2 < 90 * 90) {
    //       ctx.beginPath();
    //       ctx.moveTo(a.x, a.y);
    //       ctx.lineTo(b.x, b.y);
    //       ctx.stroke();
    //     }
    //   }
    // }

    // mouse force
    if (forceMode !== "none") {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1 && d2 < FR2) {
        const inv = 1 / Math.sqrt(d2); // 1 / distance
        const ux = dx * inv; // unit vector away from mouse
        const uy = dy * inv;
        const strength = 1 - d2 / FR2; // stronger near the cursor
        const k = (forceMode === "repel" ? 1 : -1) * 600 * strength;
        p.vx += ux * k * dt;
        p.vy += uy * k * dt;
      }
    }

    // integrate + damping
    p.vx *= damping;
    p.vy *= damping;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // wrap around edges (nice for fields)
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    if (p.y < -10) p.y = H + 10;
    if (p.y > H + 10) p.y = -10;
  }

  // draw particles
  ctx.fillStyle = "#8fb7ff";
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // cursor + radius
  if (showRadius && forceMode !== "none") {
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, forceRadius, 0, Math.PI * 2);
    ctx.fillStyle = forceMode === "repel" ? "#ff7676" : "#7dffa1";
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // cursor dot
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  hud.innerHTML = `
    <strong>Lesson 6</strong> — Particles + Mouse Forces<br>
    Mode: <kbd>A</kbd> attract • <kbd>R</kbd> repel • <kbd>N</kbd> none
    &nbsp;|&nbsp; radius: ${Math.round(forceRadius)} (wheel)
    &nbsp;|&nbsp; count: ${particles.length}
  `;

  requestAnimationFrame(frame);
}

resize();
rebuild();
requestAnimationFrame(frame);

// rebuild on size change (density)
new ResizeObserver(() => {
  resize();
  rebuild();
}).observe(canvas);
