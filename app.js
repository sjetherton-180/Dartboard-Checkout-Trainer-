// app.js
// Dart Checkout Trainer — Option 2 (numbers upright, 20 centered at top)

// --- Setup: segments and hit definitions ---
const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

const hits = [];
for (let n = 1; n <= 20; n++) {
  hits.push({ code: `S${n}`, label: `S ${n}`, value: n, isDouble: false, base: n });
  hits.push({ code: `D${n}`, label: `D ${n}`, value: n*2, isDouble: true, base: n });
  hits.push({ code: `T${n}`, label: `T ${n}`, value: n*3, isDouble: false, base: n });
}
hits.push({ code: 'SB', label: 'S25', value: 25, isDouble: false, base: 25 });
hits.push({ code: 'DB', label: 'D25', value: 50, isDouble: true, base: 25 });

// --- Precompute checkouts (2..170) ---
const MAX_TARGET = 170;
const checkouts = {};
for (let t = 2; t <= MAX_TARGET; t++) checkouts[t] = [];

for (const a of hits) {
  if (a.value <= MAX_TARGET && a.isDouble) checkouts[a.value].push([a]);
  for (const b of hits) {
    const sum2 = a.value + b.value;
    if (sum2 <= MAX_TARGET && b.isDouble) checkouts[sum2].push([a,b]);
    for (const c of hits) {
      const sum3 = a.value + b.value + c.value;
      if (sum3 <= MAX_TARGET && c.isDouble) checkouts[sum3].push([a,b,c]);
    }
  }
}
// dedupe
for (let t = 2; t <= MAX_TARGET; t++) {
  const seen = new Set();
  const uniq = [];
  for (const seq of checkouts[t]) {
    const key = seq.map(s=>s.code).join(',');
    if (!seen.has(key)) { seen.add(key); uniq.push(seq); }
  }
  checkouts[t] = uniq;
}

// --- App state ---
let target = 0;
let picks = [];           // array of hit objects (up to 3)
let score = 0;
let history = [];         // recent attempts

// --- DOM references (assumes index.html elements exist) ---
const targetDisplay = document.getElementById('target-display');
const dartsDisplay  = document.getElementById('darts-display');
const scoreDisplay  = document.getElementById('score-display');
const historyBody   = document.querySelector('#history-table tbody');
const boardContainer = document.getElementById('dartboard-container');

// --- Audio beep (short) ---
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch(e) {
    // AudioContext not available — ignore
  }
}

// --- Utility: create SVG element ---
function svgEl(name, attrs={}) {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, name);
  for (const k in attrs) el.setAttribute(k, String(attrs[k]));
  return el;
}

// --- Render board (correctly rotated: 20 centered at top) ---
// Also attaches click listeners that pass the SVG click event so we can place dots at the exact click coordinate.
function renderBoard() {
  boardContainer.innerHTML = '';
  const svg = svgEl('svg', { viewBox: '0 0 200 200', preserveAspectRatio: 'xMidYMid meet' });
  svg.style.width = '200px';  // final display size; controlled by CSS too
  svg.style.height = '200px';

  const cx = 100, cy = 100;
  // Standard-ish radii (scaled to viewBox 200)
  const bullInner = 6;
  const bullOuter = 12;
  const tripleInner = 60;
  const tripleOuter = 70;
  const doubleInner = 80;
  const doubleOuter = 90;
  const singleInner = 30;
  const singleOuter = 80;

  const segmentCount = 20;
  const segmentAngle = 2 * Math.PI / segmentCount;

  // Draw rings in order so overlay looks right: single outer, triple ring, single inner, double ring drawn last over them
  segmentOrder.forEach((num, i) => {
    const centerAngle = i * segmentAngle - Math.PI/2; // center of this segment (20 at top)
    const angle1 = centerAngle - segmentAngle/2;
    const angle2 = centerAngle + segmentAngle/2;

    // single outer (outside triple, between double and triple)
    const pSingleOuter = svgEl('path', {
      d: describeArc(cx,cy, singleOuter, angle1, angle2, tripleOuter),
      fill: (i % 2 === 0) ? '#111827' : '#0b1220',
      class: 'clickable'
    });
    pSingleOuter.addEventListener('click', (ev)=> { onSegmentClick(ev, svg, num, 1, pSingleOuter); });
    svg.appendChild(pSingleOuter);

    // triple ring
    const pTriple = svgEl('path', {
      d: describeArc(cx,cy, tripleOuter, angle1, angle2, tripleInner),
      fill: (i % 2 === 0) ? '#00640066' : '#8b000066', // subtle green / red
      class: 'clickable'
    });
    pTriple.addEventListener('click', (ev)=> { onSegmentClick(ev, svg, num, 3, pTriple); });
    svg.appendChild(pTriple);

    // single inner (between triple and bull)
    const pSingleInner = svgEl('path', {
      d: describeArc(cx,cy, tripleInner, angle1, angle2, singleInner),
      fill: (i % 2 === 0) ? '#111827' : '#0b1220',
      class: 'clickable'
    });
    pSingleInner.addEventListener('click', (ev)=> { onSegmentClick(ev, svg, num, 1, pSingleInner); });
    svg.appendChild(pSingleInner);

    // double ring (outermost ring)
    const pDouble = svgEl('path', {
      d: describeArc(cx,cy, doubleOuter, angle1, angle2, doubleInner),
      fill: (i % 2 === 0) ? '#006400cc' : '#8b0000cc',
      class: 'clickable'
    });
    pDouble.addEventListener('click', (ev)=> { onSegmentClick(ev, svg, num, 2, pDouble); });
    svg.appendChild(pDouble);
  });

  // Bulls (outer then inner)
  const outerBull = svgEl('circle', { cx, cy, r: bullOuter, fill: '#ffff66', class: 'clickable' });
  outerBull.addEventListener('click', (ev)=> { onSegmentClick(ev, svg, 25, 1, outerBull); });
  svg.appendChild(outerBull);
  const innerBull = svgEl('circle', { cx, cy, r: bullInner, fill: '#ff3333', class: 'clickable' });
  innerBull.addEventListener('click', (ev)=> { onSegmentClick(ev, svg, 25, 2, innerBull); });
  svg.appendChild(innerBull);

  // Outer number ring (numbers upright)
  const numberRadius = doubleOuter + 10;
  segmentOrder.forEach((num,i) => {
    const centerAngle = i * segmentAngle - Math.PI/2;
    const x = cx + numberRadius * Math.cos(centerAngle);
    const y = cy + numberRadius * Math.sin(centerAngle);
    const txt = svgEl('text', {
      x, y,
      'text-anchor':'middle',
      'dominant-baseline':'middle',
      fill: '#ffffff',
      'font-size': 11,
      'font-weight': '700'
    });
    // Option 2: numbers remain upright — do not rotate text element
    txt.textContent = String(num);
    svg.appendChild(txt);
  });

  boardContainer.appendChild(svg);
}

// --- event when clicking a path/circle on the board ---
// ev = MouseEvent, svg = the SVG element, number = base number or 25, mult = 1/2/3, pathEl = clicked element
function onSegmentClick(ev, svg, number, mult, pathEl) {
  // Add highlight, beep, dot at the exact click coordinates in SVG space
  highlightSegment(pathEl);
  beep();
  addDotAtSvg(ev, svg);

  // Register the hit
  onHit(number, mult);
}

// --- place a small dot exactly where user clicked (SVG coordinate transform) ---
function addDotAtSvg(mouseEvent, svg) {
  const pt = svg.createSVGPoint();
  pt.x = mouseEvent.clientX;
  pt.y = mouseEvent.clientY;
  const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
  const dot = svgEl('circle', { cx: loc.x, cy: loc.y, r: 2, fill: '#ffff00' });
  svg.appendChild(dot);
  setTimeout(()=>{ if (dot.parentNode) dot.parentNode.removeChild(dot); }, 1800);
}

// --- highlight element briefly ---
function highlightSegment(el) {
  if (!el) return;
  const orig = el.getAttribute('fill') || '';
  el.setAttribute('fill', '#ffff66');
  setTimeout(()=>{ if (el) el.setAttribute('fill', orig); }, 150);
}

// --- click handling logic (register hit, update UI) ---
function onHit(number, multiplier) {
  // find hit object
  const hit = hits.find(h => h.base === number && (
    (multiplier === 1 && !h.isDouble && h.value === number) ||
    (multiplier === 2 && h.isDouble && h.value === number*2) ||
    (multiplier === 3 && !h.isDouble && h.value === number*3)
  ));
  if (!hit) return;
  picks.push(hit);
  updateDartsPanel();

  // If we have 3 darts, or the running sum >= target, validate
  const sum = picks.reduce((s,p)=>s+p.value,0);
  if (picks.length >= 3 || (target > 0 && sum >= target)) {
    validateCheckout();
  }
}

// --- UI helpers ---
function updateDartsPanel() {
  dartsDisplay.textContent = picks.map(p=>p.code).join(', ');
}

function totalPicks() { return picks.reduce((s,p)=>s+p.value,0); }

// --- validation and scoring; show standard + up to 2 alternatives ---
function validateCheckout() {
  if (target <= 0) {
    // nothing to validate
    picks = [];
    updateDartsPanel();
    return;
  }

  const sum = totalPicks();
  const possible = checkouts[target] || [];
  const standard = possible.length > 0 ? possible[0].map(h=>h.code).join(', ') : '(none)';
  const alternatives = possible.slice(1,3).map(s => s.map(h=>h.code).join(', ')); // only 2 alternatives

  let correct = false;
  if (sum === target && picks[picks.length-1] && picks[picks.length-1].isDouble) {
    correct = true;
    score += 1;
  } else {
    score -= 1;
  }
  scoreDisplay.textContent = String(score);

  // push history
  history.unshift({
    target: target,
    userHits: picks.map(h=>h.code).join(', '),
    correct: correct ? 'Yes' : 'No',
    standardOut: standard,
    alternatives: alternatives.join(' | ')
  });

  // immediate feedback: show standard/out and alternatives when incorrect
  if (!correct) {
    const altText = alternatives.length ? `Alternatives: ${alternatives.join(' | ')}` : '';
    // show a friendly popup (alert) with standard and alternatives
    alert(`Not correct.\nStandard out: ${standard}\n${altText}`);
  } else {
    // small confirmation for correct
    // use a brief toast instead of alert for nicer UX
    showTempMessage('Correct — nice finish!', 1200);
  }

  updateHistoryTable();
  picks = [];
  updateDartsPanel();
}

// --- update history table display ---
function updateHistoryTable() {
  historyBody.innerHTML = '';
  history.forEach(item => {
    const tr = document.createElement('tr');
    ['target','userHits','correct','standardOut','alternatives'].forEach(k => {
      const td = document.createElement('td');
      td.textContent = item[k] ?? '';
      tr.appendChild(td);
    });
    historyBody.appendChild(tr);
  });
}

// --- small temporary message (non-blocking) ---
function showTempMessage(msg, ms=1000) {
  let box = document.getElementById('temp-msg-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'temp-msg-box';
    box.style.position = 'fixed';
    box.style.right = '16px';
    box.style.top = '16px';
    box.style.background = 'rgba(0,0,0,0.7)';
    box.style.color = '#fff';
    box.style.padding = '8px 12px';
    box.style.borderRadius = '8px';
    box.style.zIndex = 9999;
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.style.display = 'block';
  clearTimeout(box._timeoutId);
  box._timeoutId = setTimeout(()=>{ box.style.display = 'none'; }, ms);
}

// --- wire generate button & initial render ---
document.addEventListener('DOMContentLoaded', () => {
  // ensure DOM elements exist
  if (!targetDisplay || !dartsDisplay || !scoreDisplay || !historyBody || !boardContainer) {
    console.error('Missing required DOM elements. Make sure index.html includes target-display, darts-display, score-display, dartboard-container and history table.');
    return;
  }

  renderBoard();
  // auto-generate an initial target
  document.getElementById('generate-target').click();
});
