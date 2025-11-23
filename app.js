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
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 600;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 80);
  } catch (e) { /* ignore */ }
}

// ------------------------------
// Create Dartboard
// ------------------------------

function createDartboard() {
  const container = document.getElementById("dartboard-container");
  container.innerHTML = "";

  const size = 600; // 2× bigger
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // Expand viewBox to fit outer numbers
  svg.setAttribute("viewBox", "-40 -40 480 480");
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

  // --- Segments ---
  segmentOrder.forEach((num, i) => {
    const centerAngle = i * segmentAngle - Math.PI / 2;
    const a1 = centerAngle - segmentAngle / 2;
    const a2 = centerAngle + segmentAngle / 2;

    // Single
    const s = document.createElementNS("http://www.w3.org/2000/svg", "path");
    s.setAttribute("d", describeArc(cx, cy, singleOuter, a1, a2, singleInner));
    s.setAttribute("fill", i % 2 === 0 ? "#e7e7e7" : "#cfcfcf");
    s.style.cursor = "pointer";
    s.addEventListener("click", () => hitSegment(num, 1));
    svg.appendChild(s);

    // Triple
    const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
    t.setAttribute("d", describeArc(cx, cy, tripleOuter, a1, a2, tripleInner));
    t.setAttribute("fill", i % 2 === 0 ? "#ff4d4d" : "#4dff4d");
    t.style.cursor = "pointer";
    t.addEventListener("click", () => hitSegment(num, 3));
    svg.appendChild(t);

    // Double
    const d = document.createElementNS("http://www.w3.org/2000/svg", "path");
    d.setAttribute("d", describeArc(cx, cy, doubleOuter, a1, a2, doubleInner));
    d.setAttribute("fill", i % 2 === 0 ? "#ff0000" : "#00cc00");
    d.style.cursor = "pointer";
    d.addEventListener("click", () => hitSegment(num, 2));
    svg.appendChild(d);
  });

  // Bulls
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

  // --- Outer number ring (visible) ---
  const numberRadius = doubleOuter + 12;
  segmentOrder.forEach((num, i) => {
    const centerAngle = i * segmentAngle - Math.PI / 2;
    const pos = polarToCartesian(cx, cy, numberRadius, centerAngle);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", pos.x);
    txt.setAttribute("y", pos.y + 6);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("font-size", "18");
    txt.setAttribute("font-weight", "bold");
    txt.setAttribute("fill", "#FFD700");   // bright gold
    txt.setAttribute("stroke", "black");   // outline for contrast
    txt.setAttribute("stroke-width", "1");
    txt.style.userSelect = "none";
    txt.textContent = num;
    svg.appendChild(txt);
  });

  container.appendChild(svg);
}

// ------------------------------
// Game Logic
// ------------------------------

function hitSegment(num, mult) {
  if (darts.length >= 3) return; // limit to 3 darts per attempt

  const val = num * mult;
  darts.push(val);
  beep();
  updateDartsDisplay();

  const total = darts.reduce((a, b) => a + b, 0);

  if (total === targetScore && mult === 2) {
    score++;
    updateScore();
    addHistory(true);
    resetRound();
  } else if (total > targetScore || darts.length === 3) {
    score--;
    updateScore();
    addHistory(false);
    resetRound();
  }
}

function updateDartsDisplay() {
  document.getElementById("darts-display").textContent = darts.join(", ");
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

// Placeholder alternatives — replace with real checkout logic
function getAlternatives(score) {
  return ["T20 T20 D25", "T19 T14 D20"];
}

function addHistory(correct) {
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
// Initialize
// ------------------------------

createDartboard();
newTarget();
document.getElementById("generate-target").addEventListener("click", newTarget);
