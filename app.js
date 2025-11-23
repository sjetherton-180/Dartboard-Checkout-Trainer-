// ----------------------------
// Dartboard Checkout Trainer
// VERSION 1.0 — Stable Baseline
// ----------------------------

const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
let targetScore = 0;
let darts = [];
let score = 0;
let soundOn = true;

// Winmau preferred outs map
const preferredOuts = {
  170:"T20,T20,DB", 169:"T20,T19,DB", 168:"T20,T20,D24", 167:"T20,T19,D25", 166:"T20,T18,DB",
  165:"T20,T19,D24", 164:"T20,T16,DB", 163:"T20,T17,DB", 162:"T20,T14,DB", 161:"T20,T17,D20",
  160:"T20,T20,D20", 159:"T19,T16,DB", 158:"T20,T20,D19", 157:"T20,T19,D20", 156:"T20,T20,D18",
  155:"T20,T19,D19", 154:"T20,T18,D20", 153:"T20,T19,D18", 152:"T20,T20,D16", 151:"T20,T17,D20",
  150:"T20,T18,D18", 149:"T20,T19,D16", 148:"T20,T16,D20", 147:"T20,T17,D18", 146:"T20,T18,D16",
  145:"T20,T15,D20", 144:"T20,T20,D12", 143:"T20,T17,D16", 142:"T20,T14,D20", 141:"T20,T19,D12",
  140:"T20,T20,D10", 139:"T19,T14,D20", 138:"T20,T18,D12", 137:"T20,T19,D10", 136:"T20,T20,D8",
  135:"T20,T15,D20", 134:"T20,T14,D20", 133:"T20,T19,D8", 132:"T20,T16,D20", 131:"T20,T13,D20",
  130:"T20,T20,D5", 129:"T19,T16,D12", 128:"T18,T14,D20", 127:"T20,T17,D8", 126:"T19,T19,D6",
  125:"T20,T15,D10", 124:"T20,T12,D16", 123:"T19,T16,D9", 122:"T18,T14,D16", 121:"T20,T11,D14",
  120:"T20,20,D20", 119:"T19,10,D20", 118:"T20,18,D20", 117:"T20,17,D20", 116:"T20,16,D20",
  115:"T20,15,D20", 114:"T20,14,D20", 113:"T20,13,D20", 112:"T20,12,D20", 111:"T20,11,D20",
  110:"T20,10,D20", 109:"T20,9,D20", 108:"T20,8,D20", 107:"T19,10,D20", 106:"T20,6,D20",
  105:"T20,5,D20", 104:"T18,18,D16", 103:"T20,3,D20", 102:"T20,10,D16", 101:"T17,10,D20",
  100:"T20,D20", 99:"T19,10,D16", 98:"T20,D19", 97:"T19,D20", 96:"T20,D18", 95:"T19,D19",
  94:"T18,D20", 93:"T19,D18", 92:"T20,D16", 91:"T17,D20", 90:"T18,D18", 89:"T19,D16", 88:"T16,D20",
  87:"T17,D18", 86:"T18,D16", 85:"T15,D20", 84:"T20,D12", 83:"T17,D16", 82:"T14,D20", 81:"T19,D12",
  80:"T20,D10", 79:"T13,D20", 78:"T18,D12", 77:"T19,D10", 76:"T20,D8", 75:"T17,D12", 74:"T14,D16",
  73:"T19,D8", 72:"T16,D12", 71:"T13,D16", 70:"T18,D8", 69:"T19,D6", 68:"T20,D4", 67:"T17,D8",
  66:"T10,D18", 65:"T19,D4", 64:"T16,D8", 63:"T13,D12", 62:"T10,D16", 61:"T15,D8", 60:"20,D20",
  59:"19,D20", 58:"18,D20", 57:"17,D20", 56:"16,D20", 55:"15,D20", 54:"14,D20", 53:"13,D20",
  52:"20,D16", 51:"19,D16", 50:"10,D20", 49:"17,D16", 48:"16,D16", 47:"15,D16", 46:"14,D16",
  45:"13,D16", 44:"12,D16", 43:"11,D16", 42:"10,D16", 41:"9,D16", 40:"D20"
};

// --- Helpers for SVG Drawing ---

function polarToCartesian(cx, cy, radius, angle) {
  const rad = (angle-90) * Math.PI/180.0;
  return {x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad)};
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// --- Draw Dartboard ---
const dartboardContainer = document.getElementById('dartboard-container');

function createDartboard() {
  dartboardContainer.innerHTML = '';
  const size = 400;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('width',size);
  svg.setAttribute('height',size);
  svg.setAttribute('viewBox','0 0 400 400');

  const cx = 200;
  const cy = 200;
  const outerRadius = 200;
  const doubleRadius = 180;
  const trebleRadius = 120;
  const bullRadius = 12;
  const outerBullRadius = 24;

  // Segments
  segmentOrder.forEach((num,i)=>{
    const startAngle = i*18;
    const endAngle = startAngle+18;
    const color = (i%2===0)?'#000':'#fff';
    const path = document.createElementNS(svgNS,'path');
    path.setAttribute('d',describeArc(cx,cy,doubleRadius,startAngle,endAngle));
    path.setAttribute('fill',color);
    path.setAttribute('stroke','#000');
    path.setAttribute('stroke-width','1');
    path.dataset.value = num;
    path.dataset.type = 'single';
    path.addEventListener('click',()=>hitSegment(num,'S'));
    svg.appendChild(path);
  });

  // Bull
  const outerBull = document.createElementNS(svgNS,'circle');
  outerBull.setAttribute('cx',cx);
  outerBull.setAttribute('cy',cy);
  outerBull.setAttribute('r',outerBullRadius);
  outerBull.setAttribute('fill','#00FF00');
  outerBull.dataset.value = 25;
  outerBull.dataset.type = 'S';
  outerBull.addEventListener('click',()=>hitSegment(25,'S'));
  svg.appendChild(outerBull);

  const bull = document.createElementNS(svgNS,'circle');
  bull.setAttribute('cx',cx);
  bull.setAttribute('cy',cy);
  bull.setAttribute('r',bullRadius);
  bull.setAttribute('fill','#FF0000');
  bull.dataset.value = 50;
  bull.dataset.type = 'D';
  bull.addEventListener('click',()=>hitSegment(50,'D'));
  svg.appendChild(bull);

  dartboardContainer.appendChild(svg);
}

// --- Handle Dart Hit ---
function hitSegment(value,type){
  if(darts.length>=3) return;
  darts.push({value,type});
  updateDartsDisplay();

  // Check if target reached
  let total = darts.reduce((a,b)=>a+b.value,0);
  if(total===targetScore && type==='D'){
    indicateResult(true);
    score++;
  } else if(darts.length===3){
    indicateResult(false);
  }
}

// --- Update Darts Display ---
function updateDartsDisplay(){
  const dartsDisplay = document.getElementById('darts-display');
  dartsDisplay.innerHTML = darts.map(d=>`${d.type}${d.value}`).join(', ');
  const totalDisplay = document.getElementById('score-display');
  totalDisplay.textContent = darts.reduce((a,b)=>a+b.value,0);
}

// --- Indicate Result ---
function indicateResult(correct){
  const resultBox = document.getElementById('result-box');
  resultBox.textContent = correct ? '✔' : '✖';
}

// --- New Target ---
function newTarget(){
  targetScore = Math.floor(Math.random()*169)+2;
  document.getElementById('target-display').textContent = targetScore;
  darts = [];
  updateDartsDisplay();
  document.getElementById('result-box').textContent = '';
}

// --- Mute Toggle ---
document.getElementById('mute-btn').addEventListener('click',()=>{
  soundOn=!soundOn;
  document.getElementById('mute-btn').textContent = soundOn?'Mute':'Unmute';
});

// --- Generate New Target ---
document.getElementById('generate-target').addEventListener('click',newTarget);

// --- Init ---
createDartboard();
newTarget();
