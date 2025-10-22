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

// Exercise 1
// let gravity = 300; // px/s^2 downwards
// let damping = 0.985; // velocity damping per frame

// Exercise 2 A
let damping = 0.99;
// let gravity = 0;
let gravity = 150;

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
  // Exercise 1
  // 1) forces -> acceleration
  // const springK = 12; // spring stiffness

  // Exercise2 A
  const springK = 30;

  const drag = 0.0; // optional air drag on velocity (kept 0; we use damping below)

  // Exercise 4 C
  const drone = { x: 80, y: 80, speed: 240, r: 8, color: "#5af" };
  {
    const dx = mouse.x - drone.x;
    const dy = mouse.y - drone.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const ux = dx / dist;
      const uy = dy / dist;
      drone.x += ux * drone.speed * dt;
      drone.y += uy * drone.speed * dt;
    }
    ctx.beginPath();
    ctx.arc(drone.x, drone.y, drone.r, 0, Math.PI * 2);
    ctx.fillStyle = drone.color;
    ctx.fill();
  }

  // Exercise 4 D
  const bob = {
    x: ball.x + 80,
    y: ball.y,
    vx: 0,
    vy: 0,
    r: 10,
    color: "#ff9b6a",
  };
  const rest = 80;
  const k = 20;
  // in physics, after moving 'ball':
  {
    const dx = bob.x - ball.x;
    const dy = bob.y - ball.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const stretch = d - rest;
    const fx = (dx / d) * (stretch * k);
    const fy = (dy / d) * (stretch * k);

    // apply equal/opposite forces
    bob.vx -= fx * dt;
    bob.vy -= fy * dt;
    ball.vx += fx * dt;
    ball.vy += fy * dt;

    // integrate bob
    bob.vx *= damping;
    bob.vy *= damping;
    bob.x += bob.vx * dt;
    bob.y += bob.vy * dt;

    // draw bar + bob
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, bob.r, 0, Math.PI * 2);
    ctx.fillStyle = bob.color;
    ctx.fill();
  }

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
    // Exercise 2 B
    ball.vx *= 0.9; // ground friction

    // Exercise 1
    // ball.vx *= -0.8;
  }
  if (ball.x > W - ball.r) {
    ball.x = W - ball.r;
    // Exercise 2 B
    ball.vx *= 0.9; // ground friction

    // Exercise 1
    // ball.vx *= -0.8;
  }
  if (ball.y < ball.r) {
    ball.y = ball.r;
    // Exercise 2 B
    ball.vx *= 0.9; // ground friction

    // Exercise 1
    // ball.vy *= -0.8;
  }
  if (ball.y > H - ball.r) {
    ball.y = H - ball.r;
    // Exercise 2 B
    ball.vx *= 0.9; // ground friction

    // Exercise 1
    // ball.vy *= -0.8;
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
