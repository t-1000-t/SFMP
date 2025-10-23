const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const resize = () => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.wigth = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

new ResizeObserver(resize).observe(canvas);

const hud = document.getElementById("hud");

const mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
let applyMouseForce = false; // toggle with 'F'
let repel = true; // hold Shift to invert
let gravityY = 0; // px/s^2 (0 for neutral)
let damping = 0.985; // velocity damping
let MAX_SPEED = 600; // px/s cap
let TRAILS = 0.15; // 0..1 (1 = clear, lower = longer trails)

window.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
window.addEventListener("mousedown", () => (mouse.down = true));
window.addEventListener("mouseup", () => (mouse.down = false));
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") applyMouseForce = !applyMouseForce;
  if (e.key.toLowerCase() === "c") TRAILS = TRAILS >= 1 ? 0.15 : 1; // toggle trails
});
window.addEventListener("wheel", (e) => {
  gravityY = Math.max(
    -800,
    Math.min(800, gravityY + (e.deltaY > 0 ? 60 : -60))
  );
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") repel = false;
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") repel = true;
});

/* ---------- Particle system ---------- */
const N = 200; // try 100..400 to feel perf
const particles = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeParticle(w, h) {
  const hue = rand(180, 260); // blue/cyan range
  return {
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-120, 120),
    vy: rand(-120, 120),
    r: rand(2.5, 4.5),
    color: `hsl(${hue}, 85%, 65%)`,
  };
}

/* ---------- Physics helpers ---------- */
function integrate(p, dt, W, H) {
  // gravity
  p.vy += gravityY * dt;

  // mouse force (attract or repel)
  if (applyMouseForce || mouse.down) {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const d2 = dx * dx + dy * dy;
    // influence radius ~ 140px
    const R = 140;
    const R2 = R * R;
    if (d2 > 1 && d2 < R2) {
      const d = Math.sqrt(d2);
      const ux = dx / d;
      const uy = dy / d;
      // strength falls off with distance (quadratic)
      let strength = (1 - d2 / R2) * 900; // tune me
      if (repel) strength *= -1; // repel when true, attract when false
      p.vx += ux * strength * dt;
      p.vy += uy * strength * dt;
    }
  }

  // damping (global)
  p.vx *= damping;
  p.vy *= damping;

  // speed cap
  const speed = Math.hypot(p.vx, p.vy);
  if (speed > MAX_SPEED) {
    const s = MAX_SPEED / speed;
    p.vx *= s;
    p.vy *= s;
  }

  // integrate to position
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // wall bounce
  if (p.x < p.r) {
    p.x = p.r;
    p.vx *= -0.9;
  }
  if (p.x > W - p.r) {
    p.x = W - p.r;
    p.vx *= -0.9;
  }
  if (p.y < p.r) {
    p.y = p.r;
    p.vy *= -0.9;
  }
  if (p.y > H - p.r) {
    p.y = H - p.r;
    p.vy *= -0.9;
  }
}

function draw(p) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = p.color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ---------- FPS meter (tiny) ---------- */
let last = performance.now();
let fps = 60;
function tickFPS(now) {
  const dt = now - last;
  const inst = 1000 / (dt || 16.7);
  fps = fps * 0.9 + inst * 0.1;
}

/* ---------- Main loop ---------- */
function start() {
  // initial swarm
  particles.length = 0;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  for (let i = 0; i < N; i += 1) particles.push(makeParticle(W, H));

  let prev = performance.now();
  function frame(now) {
    // time step
    const dt = Math.min(0.033, (now - prev) / 1000); // clamp to 33ms
    prev = now;
    tickFPS(now);

    // clear (trails vs clean)
    if (TRAILS >= 1) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    } else {
      ctx.fillStyle = `rgba(0,0,0,${TRAILS})`;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    // update + draw all
    const W2 = canvas.clientWidth;
    const H2 = canvas.clientHeight;
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      integrate(p, dt, W2, H2);
      draw(p);
    }

    // cursor dot
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8";
    ctx.fill();

    // HUD
    hud.innerHTML =
      `Particles: <b>${particles.length}</b> ・ FPS: <b>${fps.toFixed(
        0
      )}</b><br>` +
      `Mouse force: <b>${
        applyMouseForce || mouse.down ? (repel ? "Repel" : "Attract") : "Off"
      }</b> ` +
      `(<kbd>F</kbd> toggle, hold <kbd>Shift</kbd> to invert)<br>` +
      `GravityY: <b>${gravityY}</b> (<kbd>wheel</kbd> to change) ・ Trails: <b>${
        TRAILS >= 1 ? "Off" : "On"
      }</b> (<kbd>C</kbd> toggle)`;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

resize();
start();
