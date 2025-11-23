// ------------------------------
// Dart Checkout Trainer
// ------------------------------

const segmentOrder = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
  3, 19, 7, 16, 8, 11, 14, 9, 12, 5
];

let targetScore = 0;
let darts = [];
let score = 0;
let soundOn = true;
let dartMarkers = [];

// --- Precompute hits ---
const hits = [];
for (let n = 1; n <= 20; n++) {
  hits.push({ code: `S${n}`, value: n, isDouble: false, base: n });
  hits.push({ code: `D${n}`, value: n * 2, isDouble: true, base: n });
  hits.push({ code: `T${n}`, value: n * 3, isDouble: false, base: n });
}
hits.push({ code: 'SB', value: 25, isDouble: false, base: 25 });
hits.push({ code: 'DB', value: 50, isDouble: true, base: 25 });

// --- Generate checkouts ---
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

// Remove duplicates
for (let t = 2; t <= MAX_TARGET; t++) {
  const seen = new Set();
  const uniq = [];
  for (const combo of checkouts[t]) {
    const key = combo.map(h => h.code).join(',');
    if (!seen.has(key)) { seen.add(key); uniq.push(combo); }
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
  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
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

// --- Dartboard ---
function createDartboard() {
  const container = document.getElementById("dartboard-container");
  container.innerHTML = "";

  const size = 600;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "-60 -60 520 520");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  const cx = 200, cy = 200;
  const singleOuter = 162, singleInner = 40;
  const tripleInner = 95, tripleOuter = 115;
  const doubleInner = 150, doubleOuter = 185;
  const bullOuter = 20, bullInner = 10;
  const segmentAngle = 2 * Math.PI / 20;

  segmentOrder.forEach((num, i) => {
    const centerAngle = i * segmentAngle - Math.PI / 2;
    const a1 = centerAngle - segmentAngle/2;
    const a2 = centerAngle + segmentAngle/2;

    const highlight = (el) => {
      const orig = el.getAttribute("fill");
      el.setAttribute("fill", "#ffff99");
      setTimeout(() => el.setAttribute("fill", orig), 200);
    };

    const addSegment = (rOuter, rInner, fill, mult, ringType) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", describeArc(cx, cy, rOuter, a1, a2, rInner));
      path.setAttribute("fill", fill);
      path.style.cursor = "pointer";
      path.addEventListener("click", () => {
        highlight(path);
        hitSegment(num, mult, {cx, cy, angle:centerAngle, ring:ringType});
      });
      svg.appendChild(path);
    };

    addSegment(singleOuter, tripleOuter, i%2===0?"#eee":"#ccc", 1, 'S');
    addSegment(tripleOuter, tripleInner, i%2===0?"#ff6666":"#66ff66", 3, 'T');
    addSegment(tripleInner, singleInner, i%2===0?"#eee":"#ccc", 1, 'S');
    addSegment(doubleOuter, doubleInner, i%2===0?"#cc0000":"#009900", 2, 'D');
  });

  // Bulls
  const addBull = (r, color, mult, ring) => {
    const bull = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bull.setAttribute("cx", cx);
    bull.setAttribute("cy", cy);
    bull.setAttribute("r", r);
    bull.setAttribute("fill", color);
    bull.style.cursor = "pointer";
    bull.addEventListener("click", () => hitSegment(25, mult, {cx, cy, ring}));
    svg.appendChild(bull);
  };
  addBull(bullOuter, "green", 1, 'SB');
  addBull(bullInner, "red", 2, 'DB');

  // Number ring
  const numberRadius = doubleOuter + 20;
  segmentOrder.forEach((num, i) => {
    const angle = i*segmentAngle - Math.PI/2;
    const pos = polarToCartesian(cx, cy, numberRadius, angle);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", pos.x);
    txt.setAttribute("y", pos.y+6);
    txt.setAttribute("text-anchor","middle");
    txt.setAttribute("font-size","18");
    txt.setAttribute("font-weight","bold");
    txt.setAttribute("fill","#FFD700");
    txt.setAttribute("stroke","black");
    txt.setAttribute("stroke-width","1");
    txt.style.userSelect = "none";
    txt.textContent = num;
    svg.appendChild(txt);
  });

  container.appendChild(svg);
}

// --- Hit segment with marker animation ---
function hitSegment(num, mult, markerInfo) {
  if (darts.length >= 3) return;

  const val = num*mult;
  darts.push(val);
  beep();
  updateDartsDisplay();

  if (markerInfo) {
    const svg = document.querySelector("#dartboard-container svg");
    const marker = document.createElementNS("http://www.w3.org/2000/svg","circle");
    let radius;
    switch(markerInfo.ring){
      case 'T': radius=(115+95)/2; break;
      case 'D': radius=(185+150)/2; break;
      case 'SB': radius=20/2; break;
      case 'DB': radius=10/2; break;
      default: radius=(162+115)/2;
    }
    const pos = polarToCartesian(markerInfo.cx, markerInfo.cy, radius, markerInfo.angle);
    marker.setAttribute("cx", pos.x);
    marker.setAttribute("cy", pos.y);
    marker.setAttribute("r", 0);
    marker.setAttribute("fill","orange");
    marker.setAttribute("stroke","black");
    marker.setAttribute("stroke-width","1");
    svg.appendChild(marker);
    dartMarkers.push(marker);

    // Animate
    let r=0; const targetR=6;
    const anim = setInterval(()=>{
      r+=1; if(r>=targetR){r=targetR; clearInterval(anim);}
      marker.setAttribute("r",r);
    },15);
  }

  const total = darts.reduce((a,b)=>a+b,0);
  const combos = checkouts[targetScore] || [];
  const standardCombo = combos.length>0 ? combos[0] : null;
  const standardCodes = standardCombo ? standardCombo.map(h=>h.code).join(',') : '(none)';

  if(total===targetScore && mult===2){
    score++; addHistory(true, standardCodes, total); resetRound();
  } else if(total>targetScore || darts.length===3){
    score--; addHistory(false, standardCodes, total); resetRound();
  }
  updateScore();
}

// --- Display & History ---
function updateDartsDisplay(){ document.getElementById("darts-display").textContent=darts.join(", "); }
function updateScore(){ document.getElementById("score-display").textContent=String(score); }

function newTarget(){
  targetScore = Math.floor(Math.random()*169)+2;
  darts = []; updateDartsDisplay();
  document.getElementById("target-display").textContent = String(targetScore);
  dartMarkers.forEach(m=>m.remove());
  dartMarkers=[];
}

function resetRound(){ newTarget(); }

function addHistory(correct, standard, total){
  const tbody = document.querySelector("#history-table tbody");
  const tr = document.createElement("tr");
  tr.innerHTML=`
    <td>${targetScore}</td>
    <td>${darts.join(", ")}</td>
    <td>${total}</td>
    <td>${correct?"✔":"✖"}</td>
    <td>${standard}</td>
  `;
  tbody.prepend(tr);
}

// --- Mute ---
function toggleSound(){
  soundOn = !soundOn;
  document.getElementById("mute-btn").textContent = soundOn ? "Mute":"Unmute";
}

// --- Init ---
createDartboard();
newTarget();
document.getElementById("generate-target").addEventListener("click", newTarget);

const leftPanel = document.querySelector(".left-panel");
const muteBtn = document.createElement("button");
muteBtn.id="mute-btn"; muteBtn.className="btn"; muteBtn.textContent="Mute";
muteBtn.addEventListener("click", toggleSound);
leftPanel.appendChild(muteBtn);
