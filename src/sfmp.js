//Lesson 4
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const resize = () => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};
new ResizeObserver(resize).observe(canvas);

// State
const ball = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  vx: 0,
  vy: 0,
  ax: 0,
  ay: 0,
  r: 14,
  color: "#79ffa3",
};

const mouse = { x: ball.x, y: ball.y, down: false };
let gravity = 300; // px/s^2 downwards
let damping = 0.985; // velocity damping per frame
let maxSpeed = 1200; // px/s cap

// input
window.addEventListener("mousemove", () => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
window.addEventListener("mousedown", () => {
  mouse.down = true;
});
window.addEventListener("mouseup", () => {
  mouse.down = false;
});
window.addEventListener("wheel", (e) => {
  gravity = Math.max(-800, Math.min(1200, gravity + (e.deltaY > 0 ? 60 : -60)));
});

// Helpers
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const drawBall = (b) => {
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fillStyle = b.color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = b.color;
  ctx.fill();
  ctx.shadowBlur = 0;
};

// ---loop with time step
let last = performance.now();
const frame = (now) => {
  const dt = Math.min(0.033, (now - last) / 1000); // clamp to 33ms (30fps) max step
  last = now;

  // clear with trails
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // PHYSICS
  // 1) forces -> acceleration
  const springK = 12; // spring stiffness
  const drag = 0.0; // optional air drag on velocity (kept 0; we use damping below)

  // spring toward mouse if mouse is down; otherwise just gravity
  if (mouse.down) {
    // Hooke-like spring to the mouse
    const dx = mouse.x - ball.x;
    const dy = (mouse.y = ball.y);
    ball.ax = dx * springK;
    ball.ay = dy * springK + gravity;
  } else {
    ball.ax = 0;
    ball.ay = gravity;
  }

  // 2) integration acceleration -> velocity
  ball.vx += (ball.ax - ball.vx * drag) * dt;
  ball.vy += (ball.ay - ball.vy * drag) * dt;

  // 3) global damping (friction-ish)
  ball.vx *= damping;
  ball.vy *= damping;

  // cap max speed
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > maxSpeed) {
    const s = maxSpeed / speed;
    ball.vx *= s;
    ball.vy *= s;
  }

  // 4) integrate velocity -> position
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // 5) collision with walls (bouncy)
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (ball.x < ball.r) {
    ball.x = ball.r;
    ball.vx *= -0.8;
  }
  if (ball.x > W - ball.r) {
    ball.x = W - ball.r;
    ball.vx *= -0.8;
  }
  if (ball.y < ball.r) {
    ball.y = ball.r;
    ball.vy *= -0.8;
  }
  if (ball.y > H - ball.r) {
    ball.y = H - ball.r;
    ball.vy *= -0.8;
  }

  // DRAW
  //cursor
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#8fb7ff";
  ctx.fill();

  drawBall(ball);

  requestAnimationFrame(frame);
};

resize();
requestAnimationFrame(frame);
