//Lesson 3
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const resize = () => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

new ResizeObserver(resize).observe(canvas);

const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// start position center
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;

const draw = () => {
  // fade trail
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // move smoothly toward mouse
  x += (mouse.x - x) * 0.08;
  y += (mouse.y - y) * 0.08;

  // draw follower
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#5af";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#5af";
  ctx.fill();

  requestAnimationFrame(draw);
};

resize();
draw();
