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

// point B
// start position center
// let x = window.innerWidth / 2;
// let y = window.innerHeight / 2;
// const trail = Array.from({ length: 10 }, () => ({ x: 0, y: 0 }));

// point C
let angle = 0;

const draw = () => {
  // fade trail
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // point C
  angle += 0.05;
  const orbitRadius = 80;
  const x = mouse.x + Math.cos(angle) * orbitRadius;
  const y = mouse.y + Math.sin(angle) * orbitRadius;

  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#6f9";
  ctx.fill();

  // point B
  // move smoothly toward mouse
  // x += (mouse.x - x) * 0.03; // slower
  // x += (mouse.x - x) * 0.2; // faster
  // y += (mouse.y - y) * 0.08;

  //point B
  // draw follower
  // ctx.beginPath();
  // ctx.arc(x, y, 10, 0, Math.PI * 2);
  // ctx.fillStyle = "#5af";
  // ctx.shadowBlur = 20;
  // ctx.shadowColor = "#5af";
  // ctx.fill();

  // point B
  // a smooth comet tail
  // trail.forEach((p, i) => {
  //   ctx.beginPath();
  //   ctx.arc(p.x, p.y, 8 - i * 0.5, 0, Math.PI * 2);
  //   ctx.fillStyle = `hsl(${200 + i * 10}, 80%, 60%)`;
  //   ctx.fill();
  // });

  requestAnimationFrame(draw);
};

resize();
draw();
