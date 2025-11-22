// Dart Checkout Trainer — Standard Dartboard

// Segment numbers clockwise (20 at top)
const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

// Hits
const hits = [];
for (let n = 1; n <= 20; n++) {
    hits.push({code:`S${n}`,label:`S ${n}`,value:n,isDouble:false,base:n});
    hits.push({code:`D${n}`,label:`D ${n}`,value:n*2,isDouble:true,base:n});
    hits.push({code:`T${n}`,label:`T ${n}`,value:n*3,isDouble:false,base:n});
}
hits.push({code:'SB',label:'S25',value:25,isDouble:false,base:25});
hits.push({code:'DB',label:'D25',value:50,isDouble:true,base:25});

// Generate checkout table
const maxTarget = 170;
const checkouts = {};
for(let t=2;t<=maxTarget;t++) checkouts[t]=[];
for(const a of hits){
  if(a.value<=maxTarget && a.isDouble) checkouts[a.value].push([a]);
  for(const b of hits){
    const sum2 = a.value+b.value;
    if(sum2<=maxTarget && b.isDouble) checkouts[sum2].push([a,b]);
    for(const c of hits){
      const sum3 = a.value+b.value+c.value;
      if(sum3<=maxTarget && c.isDouble) checkouts[sum3].push([a,b,c]);
    }
  }
}
for(let t=2;t<=maxTarget;t++){
  const seen = new Set();
  const unique = [];
  for(const seq of checkouts[t]){
    const key = seq.map(s=>s.code).join(',');
    if(!seen.has(key)){ seen.add(key); unique.push(seq); }
  }
  checkouts[t] = unique;
}

// App state
let target = 0;
let picks = [];
let score = 0;
let history = [];

// UI elements
const targetDisplay = document.getElementById('target-display');
const dartsDisplay = document.getElementById('darts-display');
const scoreDisplay = document.getElementById('score-display');
const historyTable = document.querySelector('#history-table tbody');

// Beep sound
function beep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    osc.start(); gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
}

// Generate new target
document.getElementById('generate-target').addEventListener('click', () => {
    target = Math.floor(Math.random()*169)+2;
    targetDisplay.textContent = target;
    picks = [];
    updateDartsDisplay();
});

// Render dartboard
function renderBoard() {
    const container = document.getElementById('dartboard-container');
    container.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.style.width = '200px';
    svg.style.height = '200px';

    const center = 100;
    // Radii based on standard proportions
    const bullInner = 6;
    const bullOuter = 12;
    const tripleInner = 60;
    const tripleOuter = 70;
    const doubleInner = 80;
    const doubleOuter = 90;
    const singleInner = 30;
    const singleOuter = 80;

    const segmentCount = 20;
    const segmentAngle = 2*Math.PI/segmentCount;

    segmentOrder.forEach((num,i)=>{
        const angle1 = i*segmentAngle - Math.PI/2;
        const angle2 = (i+1)*segmentAngle - Math.PI/2;

        // Single
        const s = document.createElementNS(svgNS,'path');
        s.setAttribute('d',describeArc(center,center,singleOuter,angle1,angle2,singleInner));
        s.setAttribute('fill',i%2===0?'#ffffff20':'#00000020');
        s.setAttribute('class','clickable');
        s.addEventListener('click',()=>{ onHit(num,1); highlightSegment(s); beep(); addDot(s); });
        svg.appendChild(s);

        // Triple
        const t = document.createElementNS(svgNS,'path');
        t.setAttribute('d',describeArc(center,center,tripleOuter,angle1,angle2,tripleInner));
        t.setAttribute('fill',i%2===0?'#00ff0040':'#ff000040');
        t.setAttribute('class','clickable');
        t.addEventListener('click',()=>{ onHit(num,3); highlightSegment(t); beep(); addDot(t); });
        svg.appendChild(t);

        // Double
        const d = document.createElementNS(svgNS,'path');
        d.setAttribute('d',describeArc(center,center,doubleOuter,angle1,angle2,doubleInner));
        d.setAttribute('fill',i%2===0?'#00ff0080':'#ff000080');
        d.setAttribute('class','clickable');
        d.addEventListener('click',()=>{ onHit(num,2); highlightSegment(d); beep(); addDot(d); });
        svg.appendChild(d);
    });

    // Bulls
    const sb = document.createElementNS(svgNS,'circle');
    sb.setAttribute('cx',center); sb.setAttribute('cy',center); sb.setAttribute('r',bullOuter);
    sb.setAttribute('fill','#ffff00'); sb.setAttribute('class','clickable');
    sb.addEventListener('click',()=>{ onHit(25,1); highlightSegment(sb); beep(); addDot(sb); });
    svg.appendChild(sb);

    const db = document.createElementNS(svgNS,'circle');
    db.setAttribute('cx',center); db.setAttribute('cy',center); db.setAttribute('r',bullInner);
    db.setAttribute('fill','#ff0000'); db.setAttribute('class','clickable');
    db.addEventListener('click',()=>{ onHit(25,2); highlightSegment(db); beep(); addDot(db); });
    svg.appendChild(db);

    // Numbers
    segmentOrder.forEach((num,i)=>{
        const angle = (i+0.5)*segmentAngle - Math.PI/2;
        const radius = doubleOuter+10;
        const x = center + radius*Math.cos(angle);
        const y = center + radius*Math.sin(angle);

        const text = document.createElementNS(svgNS,'text');
        text.setAttribute('x',x); text.setAttribute('y',y);
        text.setAttribute('text-anchor','middle'); text.setAttribute('dominant-baseline','middle');
        text.setAttribute('fill','#ffffff'); text.setAttribute('font-size','12'); text.setAttribute('font-weight','bold');

        let deg = angle*180/Math.PI;
        if(deg>90 && deg<270) deg += 180;
        text.setAttribute('transform',`rotate(${deg},${x},${y})`);

        text.textContent = num;
        svg.appendChild(text);
    });

    container.appendChild(svg);
}

// Arc helper
function describeArc(cx,cy,rOuter,startAngle,endAngle,rInner){
    const x1=cx+rOuter*Math.cos(startAngle);
    const y1=cy+rOuter*Math.sin(startAngle);
    const x2=cx+rOuter*Math.cos(endAngle);
    const y2=cy+rOuter*Math.sin(endAngle);
    const x3=cx+rInner*Math.cos(endAngle);
    const y3=cy+rInner*Math.sin(endAngle);
    const x4=cx+rInner*Math.cos(startAngle);
    const y4=cy+rInner*Math.sin(startAngle);
    return `M${x1},${y1} A${rOuter},${rOuter} 0 0,1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 0,0 ${x4},${y4} Z`;
}

// Highlight
function highlightSegment(path){
    const original = path.getAttribute('fill');
    path.setAttribute('fill','#ffff00');
    setTimeout(()=>path.setAttribute('fill',original),150);
}

// Dot
function addDot(path){
    const svg = path.ownerSVGElement;
    const bbox = path.getBBox();
    const cx = bbox.x+bbox.width/2;
    const cy = bbox.y+bbox.height/2;
    const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',cx); dot.setAttribute('cy',cy);
    dot.setAttribute('r',2); dot.setAttribute('fill','#ff0');
    svg.appendChild(dot);
    setTimeout(()=>svg.removeChild(dot),2000);
}

// Handle hit
function onHit(number,multiplier){
    const hit = hits.find(h=>h.base===number && ((multiplier===1 && !h.isDouble && h.value===number) || (multiplier===2 && h.isDouble && h.value===number*2) || (multiplier===3 && !h.isDouble && h.value===number*3)));
    if(!hit) return;
    picks.push(hit);
    updateDartsDisplay();

    if(picks.length>=3 || totalPicks()>=target){
        validateCheckout();
    }
}

function updateDartsDisplay(){ dartsDisplay.innerHTML = picks.map(h=>h.code).join(', '); }
function totalPicks(){ return picks.reduce((a,b)=>a+b.value,0); }

function validateCheckout(){
    const sum = totalPicks();
    let correct=false;
    const standardOuts = checkouts[target] || [];
    const standard = standardOuts.length>0 ? standardOuts[0].map(h=>h.code).join(', ') : '';
    const alternatives = standardOuts.slice(1,3).map(s=>s.map(h=>h.code).join(', ')).join(' | ');

    if(sum===target && picks[picks.length-1]?.isDouble){ score++; correct=true; }
    else score--;

    scoreDisplay.textContent = score;

    history.unshift({
        target: target,
        userHits: picks.map(h=>h.code).join(', '),
        correct: correct?'Yes':'No',
        standardOut: standard,
        alternatives: alternatives
    });

    updateHistoryTable();
    picks = [];
    updateDartsDisplay();
}

function updateHistoryTable(){
    historyTable.innerHTML = '';
    history.forEach(item=>{
        const row=document.createElement('tr');
        ['target','userHits','correct','standardOut','alternatives'].forEach(key=>{
            const td=document.createElement('td'); td.textContent=item[key]; row.appendChild(td);
        });
        historyTable.appendChild(row);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded',()=>{
    renderBoard();
    document.getElementById('generate-target').click();
});
