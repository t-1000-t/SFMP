"use strict";

// ------- Canvas setup with HiDPI scaling -------
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const mouseEl = document.getElementById("mouse");

function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const { clientWidth: w, clientHeight: h } = canvas;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  drawOnce();
}

// keep canvas sized to viewport
const ro = new ResizeObserver(resize);
ro.observe(canvas);

// ------- Utilities -------
function clear() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}
function dot(x, y, r = 4, color = "#9dd") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function line(x1, y1, x2, y2, color = "#7aa") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function text(str, x, y, color = "#bcd") {
  ctx.fillStyle = color;
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(str, x, y);
}
function rectangle(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function diagonal() {
  ctx.fillRect(50, 200, 300, 350);
}

// ------- Mouse tracking (CSS pixel coords) -------
const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouseEl.textContent = `mouse: (${Math.round(mouse.x)}, ${Math.round(
    mouse.y
  )})`;
  drawOnce();
});

// ------- Baseline drawing -------
function drawAxes() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  // grid
  ctx.globalAlpha = 0.25;
  for (let x = 0; x <= w; x += 50) line(x, 0, x, h, "#335");
  for (let y = 0; y <= h; y += 50) line(0, y, w, y, "#335");
  ctx.globalAlpha = 1;

  // axes
  line(0, 0, w, 0, "#4c7"); // x axis (top)
  line(0, 0, 0, h, "#c74"); // y axis (left)
  text("(0,0)", 6, 12, "#fff");
}

function drawOnce() {
  clear();
  drawAxes();

  // A fixed reference dot at (100, 100):
  dot(100, 100, 5, "#ffd371");
  text("(100,100)", 108, 104, "#ffd371");

  // A dot at the mouse position:
  dot(mouse.x, mouse.y, 5, "#9dd");
  // crosshair lines
  line(mouse.x - 10, mouse.y, mouse.x + 10, mouse.y, "#88a");
  line(mouse.x, mouse.y - 10, mouse.x, mouse.y + 10, "#88a");
  text(
    `(${Math.round(mouse.x)}, ${Math.round(mouse.y)})`,
    mouse.x + 8,
    mouse.y - 8
  );

  rectangle(200, 60, 120, 60, "#6ad");

  line(20, 200, 300, 350);

  dot(250, 250, 20);
  text("+X ->", canvas.clientWidth - 800, 12, "#4c7");
  ctx.save();
  ctx.translate(12, canvas.clientHeight - 180);
  ctx.rotate(-Math.PI / 128);
  text("+Y ↓", 0, 0, "#c74");
  ctx.restore();
}

// Initial paint
resize();
drawOnce();

console.log("canvas CSS size:", canvas.clientWidth, canvas.clientHeight);
console.log("canvas backing size", canvas.width, canvas.height);
