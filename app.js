// ------------------------------
// Dartboard + Checkout Trainer
// ------------------------------

const segmentOrder = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
  3, 19, 7, 16, 8, 11, 14, 9, 12, 5
];

let targetScore = 0;
let darts = [];
let score = 0;

// ------------------------------
// Utility Functions
// ------------------------------

function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle)
  };
}

function describeArc(cx, cy, rOuter, startAngle, endAngle, rInner) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;

  return `
    M ${p1.x} ${p1.y}
    A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}
    L ${p3.x} ${p3.y}
    A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}
    Z
  `;
}

function beep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 600;
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 80);
}

// ------------------------------
// Create Dartboard
// ------------------------------

function createDartboard() {
  const container = document.getElementById("dartboard-container");
  container.innerHTML = "";

  const size = 300;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 400 400");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  const cx = 200, cy = 200;

  const singleOuter = 162;
  const tripleOuter = 107;
  const tripleInner = 99;
  const singleInner = 40;
  const doubleOuter = 170;
  const doubleInner = 162;
  const bullOuter = 12;
  const bullInner = 6;

  const segmentAngle = 2 * Math.PI / 20;

  segmentOrder.forEach((num, i) => {
    const centerAngle = i * segmentAngle - Math.PI / 2;
    const a1 = centerAngle - segmentAngle / 2;
    const a2 = centerAngle + segmentAngle / 2;

    // --- Single Area ---
    const s = document.createElementNS("http://www.w3.org/2000/svg", "path");
    s.setAttribute("d", describeArc(cx, cy, singleOuter, a1, a2, singleInner));
    s.setAttribute("fill", i % 2 === 0 ? "#e7e7e7" : "#cfcfcf");
    s.style.cursor = "pointer";
    s.addEventListener("click", () => hitSegment(num, 1));
    svg.appendChild(s);

    // --- Triple ---
    const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
    t.setAttribute("d", describeArc(cx, cy, tripleOuter, a1, a2, tripleInner));
    t.setAttribute("fill", i % 2 === 0 ? "#ff4d4d" : "#4dff4d");
    t.style.cursor = "pointer";
    t.addEventListener("click", () => hitSegment(num, 3));
    svg.appendChild(t);

    // --- Double ---
    const d = document.createElementNS("http://www.w3.org/2000/svg", "path");
    d.setAttribute("d", describeArc(cx, cy, doubleOuter, a1, a2, doubleInner));
    d.setAttribute("fill", i % 2 === 0 ? "#ff0000" : "#00cc00");
    d.style.cursor = "pointer";
    d.addEventListener("click", () => hitSegment(num, 2));
    svg.appendChild(d);

    // --- Numbers (upright & centered) ---
    const nr = 185;
    const pos = polarToCartesian(cx, cy, nr, centerAngle);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", pos.x);
    txt.setAttribute("y", pos.y + 6);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("font-size", "20");
    txt.setAttribute("font-weight", "bold");
    txt.setAttribute("fill", "white");
    txt.style.userSelect = "none";
    txt.textContent = num;
    svg.appendChild(txt);
  });

  // --- Bulls ---
  const outerBull = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerBull.setAttribute("cx", cx);
  outerBull.setAttribute("cy", cy);
  outerBull.setAttribute("r", bullOuter);
  outerBull.setAttribute("fill", "green");
  outerBull.style.cursor = "pointer";
  outerBull.addEventListener("click", () => hitSegment(25, 1));
  svg.appendChild(outerBull);

  const innerBull = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  innerBull.setAttribute("cx", cx);
  innerBull.setAttribute("cy", cy);
  innerBull.setAttribute("r", bullInner);
  innerBull.setAttribute("fill", "red");
  innerBull.style.cursor = "pointer";
  innerBull.addEventListener("click", () => hitSegment(25, 2));
  svg.appendChild(innerBull);

  container.appendChild(svg);
}

// ------------------------------
// Game Logic
// ------------------------------

function hitSegment(num, mult) {
  const val = num * mult;
  darts.push(val);
  beep();
  updateDartsDisplay();

  const remaining = targetScore - darts.reduce((a, b) => a + b, 0);

  if (remaining === 0 && mult === 2) {
    score++;
    updateScore();
    addHistory(true, val);
    resetRound();
  } else if (remaining < 0) {
    score--;
    updateScore();
    addHistory(false, val);
    resetRound();
  }
}

function updateDartsDisplay() {
  document.getElementById("darts-display").textContent =
    darts.map(d => d).join(", ");
}

function updateScore() {
  document.getElementById("score-display").textContent = score;
}

function newTarget() {
  targetScore = Math.floor(Math.random() * 169) + 2;
  darts = [];
  document.getElementById("target-display").textContent = targetScore;
  updateDartsDisplay();
}

function resetRound() {
  newTarget();
}

// Only 2 alternatives
function getAlternatives(score) {
  return ["T20 T20 D25", "T19 T14 D20"];
}

function addHistory(correct, lastVal) {
  const tbody = document.querySelector("#history-table tbody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${targetScore}</td>
    <td>${darts.join(", ")}</td>
    <td>${correct ? "✔" : "✖"}</td>
    <td>Standard Out</td>
    <td>${getAlternatives(targetScore).join(" | ")}</td>
  `;

  tbody.prepend(row);
}

// ------------------------------
// Init
// ------------------------------

createDartboard();
newTarget();
document.getElementById("generate-target").addEventListener("click", newTarget);
