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
let vx = 2; // velocity x
let vy = 1.5; // velocity y
const r = 20; // radius

// Draw & Update loop
function draw() {
  // clear canvas
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

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
