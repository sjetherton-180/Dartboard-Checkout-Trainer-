// ------------------------------
// Dartboard + Checkout Trainer — Dart Markers + Highlight
// ------------------------------

const segmentOrder = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
  3, 19, 7, 16, 8, 11, 14, 9, 12, 5
];

let targetScore = 0;
let darts = [];
let score = 0;
let soundOn = true; // Mute toggle
let dartMarkers = []; // Store SVG marker elements

// --- Precompute hits ---
const hits = [];
for (let n = 1; n <= 20; n++) {
  hits.push({ code: `S${n}`, value: n, isDouble: false, base: n });
  hits.push({ code: `D${n}`, value: n * 2, isDouble: true, base: n });
  hits.push({ code: `T${n}`, value: n * 3, isDouble: false, base: n });
}
hits.push({ code: 'SB', value: 25, isDouble: false, base: 25 });
hits.push({ code: 'DB', value: 50, isDouble: true, base: 25 });

// --- Generate all 3-dart checkouts ---
const MAX_TARGET = 170;
const checkouts = {};
for (let t = 2; t <= MAX_TARGET; t++) checkouts[t] = [];

for (const a of hits) {
  if (a.value <= MAX_TARGET && a.isDouble) checkouts[a.value].push([a]);
  for (const b of hits) {
    const sum2 = a.value + b.value;
    if (sum2 <= MAX_TARGET && b.isDouble) checkouts[sum2].push([a, b]);
    for (const c of hits) {
      const sum3 = a.value + b.value + c.value;
      if (sum3 <= MAX_TARGET && c.isDouble) checkouts[sum3].push([a, b, c]);
    }
  }
}

// Remove duplicate combos
for (let t = 2; t <= MAX_TARGET; t++) {
  const seen = new Set();
  const uniq = [];
  for (const combo of checkouts[t]) {
    const key = combo.map(h => h.code).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(combo);
    }
  }
  checkouts[t] = uniq;
}

// --- Utilities ---
function polarToCartesian(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function describeArc(cx, cy, rOuter, startAngle, endAngle, rInner) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = (endAngle - startAngle) <= Math.PI ? 0 : 1;
  return `
    M ${p1.x} ${p1.y}
    A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}
    L ${p3.x} ${p3.y}
    A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}
    Z
  `;
}

function beep() {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 600;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 80);
  } catch (e) {}
}

// --- Create Dartboard ---
function createDartboard() {
  const container = document.getElementById("dartboard-container");
  container.innerHTML = "";

  const size = 600;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "-60 -60 520 520");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  const cx = 200, cy = 200;
  const singleOuter = 162;
  const singleInner = 40;
  const tripleInner = 95;
  const tripleOuter = 115;
  const doubleInner = 150;
  const doubleOuter = 185;

  // Bulls increased proportionally
  const bullOuter = 20;
  const bullInner = 10;

  const segmentAngle = 2 * Math.PI / 20;

  segmentOrder.forEach((num, i) => {
    const centerAngle = i * segmentAngle - Math.PI / 2;
    const a1 = centerAngle - segmentAngle / 2;
    const a2 = centerAngle + segmentAngle / 2;

    // Helper function to highlight segment
    const highlightSegment = (el) => {
      const orig = el.getAttribute("fill");
      el.setAttribute("fill", "#ffff99");
      setTimeout(() => el.setAttribute("fill", orig), 200);
    };

    // Single Outer
    const pathS = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathS.setAttribute("d", describeArc(cx, cy, singleOuter, a1, a2, tripleOuter));
    pathS.setAttribute("fill", i % 2 === 0 ? "#eee" : "#ccc");
    pathS.style.cursor = "pointer";
    pathS.addEventListener("click", () => {
      highlightSegment(pathS);
      hitSegment(num, 1, {cx, cy, angle: centerAngle, ring: 'S'});
    });
    svg.appendChild(pathS);

    // Triple
    const pathT = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathT.setAttribute("d", describeArc(cx, cy, tripleOuter, a1, a2, tripleInner));
    pathT.setAttribute("fill", i % 2 === 0 ? "#ff6666" : "#66ff66");
    pathT.style.cursor = "pointer";
    pathT.addEventListener("click", () => {
      highlightSegment(pathT);
      hitSegment(num, 3, {cx, cy, angle: centerAngle, ring: 'T'});
    });
    svg.appendChild(pathT);

    // Single Inner
    const pathSi = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathSi.setAttribute("d", describeArc(cx, cy, tripleInner, a1, a2, singleInner));
    pathSi.setAttribute("fill", i % 2 === 0 ? "#eee" : "#ccc");
    pathSi.style.cursor = "pointer";
    pathSi.addEventListener("click", () => {
      highlightSegment(pathSi);
      hitSegment(num, 1, {cx, cy, angle: centerAngle, ring: 'S'});
    });
    svg.appendChild(pathSi);

    // Double
    const pathD = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathD.setAttribute("d", describeArc(cx, cy, doubleOuter, a1, a2, doubleInner));
    pathD.setAttribute("fill", i % 2 === 0 ? "#cc0000" : "#009900");
    pathD.style.cursor = "pointer";
    pathD.addEventListener("click", () => {
      highlightSegment(pathD);
      hitSegment(num, 2, {cx, cy, angle: centerAngle, ring: 'D'});
    });
    svg.appendChild(pathD);
  });

  // Bulls
  const bullOut = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bullOut.setAttribute("cx", cx);
  bullOut.setAttribute("cy", cy);
  bullOut.setAttribute("r", bullOuter);
  bullOut.setAttribute("fill", "green");
  bullOut.style.cursor = "pointer";
  bullOut.addEventListener("click", () => hitSegment(25, 1, {cx, cy, ring: 'SB'}));
  svg.appendChild(bullOut);

  const bullIn = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bullIn.setAttribute("cx", cx);
  bullIn.setAttribute("cy", cy);
  bullIn.setAttribute("r", bullInner);
  bullIn.setAttribute("fill", "red");
  bullIn.style.cursor = "pointer";
  bullIn.addEventListener("click", () => hitSegment(25, 2, {cx, cy, ring: 'DB'}));
  svg.appendChild(bullIn);

  // Outer number ring pushed further out
  const numberRadius = doubleOuter + 20;
  segmentOrder.forEach((num, i) => {
    const angle = i * segmentAngle - Math.PI / 2;
    const pos = polarToCartesian(cx, cy, numberRadius, angle);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", pos.x);
    txt.setAttribute("y", pos.y + 6);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("font-size", "18");
    txt.setAttribute("font-weight", "bold");
    txt.setAttribute("fill", "#FFD700");
    txt.setAttribute("stroke", "black");
    txt.setAttribute("stroke-width", "1");
    txt.style.userSelect = "none";
    txt.textContent = num;
    svg.appendChild(txt);
  });

  container.appendChild(svg);
}

// --- Game Logic with Dart Markers ---
function hitSegment(num, mult, markerInfo) {
  if (darts.length >= 3) return;

  const val = num * mult;
  darts.push(val);
  beep();
  updateDartsDisplay();

  // Add dart marker
  if (markerInfo) {
    const svg = document.querySelector("#dartboard-container svg");
    const r = 6;
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const radius = markerInfo.ring === 'D' ? (markerInfo.ring === 'D'? 0.5 : 0.5) : 0;
    const pos = polarToCartesian(markerInfo.cx, markerInfo.cy,
      markerInfo.ring==='T'? (tripleOuter + tripleInner)/2 :
      markerInfo.ring==='D'? (doubleOuter + doubleInner)/2 :
      markerInfo.ring==='SB'? bullOuter/2 :
      markerInfo.ring==='DB'? bullInner/2 : singleOuter/2,
      markerInfo.angle);
    marker.setAttribute("cx", pos.x);
    marker.setAttribute("cy", pos.y);
    marker.setAttribute("r", r);
    marker.setAttribute("fill", "orange");
    marker.setAttribute("stroke", "black");
    marker.setAttribute("stroke-width", "1");
    svg.appendChild(marker);
    dartMarkers.push(marker);
  }

  const total = darts.reduce((a, b) => a + b, 0);
  const combos = checkouts[targetScore] || [];
  const standardCombo = combos.length > 0 ? combos[0] : null;
  const standardCodes = standardCombo ? standardCombo.map(h => h.code).join(', ') : '(none)';

  if (total === targetScore && mult === 2) {
    score++;
    addHistory(true, standardCodes, total);
    resetRound();
  } else if (total > targetScore || darts.length === 3) {
    score--;
    addHistory(false, standardCodes, total);
    resetRound();
  }

  updateScore();
}

// --- Display / History ---
function updateDartsDisplay() {
  document.getElementById("darts-display").textContent = darts.join(", ");
}

function updateScore() {
  document.getElementById("score-display").textContent = String(score);
}

function newTarget() {
  targetScore = Math.floor(Math.random() * 169) + 2;
  darts = [];
  updateDartsDisplay();
  document.getElementById("target-display").textContent = String(targetScore);

  // Remove previous markers
  dartMarkers.forEach(m => m.remove());
  dartMarkers = [];
}

function resetRound() { newTarget(); }

function addHistory(correct, standard, total) {
  const tbody = document.querySelector("#history-table tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${targetScore}</td>
    <td>${darts.join(", ")}</td>
    <td>${total}</td>
    <td>${correct ? "✔" : "✖"}</td>
    <td>${standard}</td>
  `;
  tbody.prepend(tr);
}

// --- Mute toggle ---
function toggleSound() {
  soundOn = !soundOn;
  document.getElementById("mute-btn").textContent = soundOn ? "Mute" : "Unmute";
}

// --- Initialization ---
createDartboard();
newTarget();
document.getElementById("generate-target").addEventListener("click", newTarget);

// Add mute button dynamically
const leftPanel = document.querySelector(".left-panel");
const muteBtn = document.createElement("button");
muteBtn.id = "mute-btn";
muteBtn.className = "btn";
muteBtn.textContent = "Mute";
muteBtn.addEventListener("click", toggleSound);
leftPanel.appendChild(muteBtn);
