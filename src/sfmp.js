//Lesson 2
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// resize like before
function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

// State
let x = 100;
let y = 200;
let vx = 4; // velocity x
let vy = -2; // velocity y
const r = 20; // radius
vy += 0.1;

const balls = Array.from({ length: 10 }, () => ({
  x: Math.random() * canvas.clientWidth,
  y: Math.random() * canvas.clientHeight,
  vx: (Math.random() - 0.5) * 6,
  vy: (Math.random() - 0.5) * 6,
  r: 10 + Math.random() * 10,
}));

// Draw & Update loop
function draw() {
  // clear canvas
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  balls.forEach((ball) => {
    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x + ball.r > canvas.width || ball.x - ball.r < 0) {
      ball.vx *= -1;
    }
    if (ball.y + ball.r > canvas.height || ball.y - ball.r < 0) {
      ball.vy *= -1;
    }

    // Draw circle
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "skyblue";
    ctx.fill();
    ctx.strokeStyle = "blue";
    ctx.stroke();
    ctx.closePath();
  });

  // move the circle
  x += vx;
  y += vy;

  // bounce off walls
  if (x < r || x > canvas.clientWidth - r) vx *= -1;
  if (y < r || y > canvas.clientHeight - r) vy *= -1;

  // draw the circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#6ad";
  ctx.fill();

  requestAnimationFrame(draw);
}

// start ones
resize();
draw();
