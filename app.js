// Dart Checkout Trainer

// Segment numbers
const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

// Hits (S, D, T + Bull)
const hits = [];
for (let n = 1; n <= 20; n++) {
    hits.push({code:`S${n}`,label:`S ${n}`,value:n,isDouble:false,base:n});
    hits.push({code:`D${n}`,label:`D ${n}`,value:n*2,isDouble:true,base:n});
    hits.push({code:`T${n}`,label:`T ${n}`,value:n*3,isDouble:false,base:n});
}
hits.push({code:'SB',label:'S25',value:25,isDouble:false,base:25});
hits.push({code:'DB',label:'D25',value:50,isDouble:true,base:25});

// Standard 3-dart checkout table
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
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox','0 0 200 200');

    const center = 100;
    const tripleInner = 60, tripleOuter = 70;
    const doubleInner = 80, doubleOuter = 90;
    const singleInner = 30, singleOuter = 80;

    segmentOrder.forEach((num,i)=>{
        const angle1 = (i/20)*2*Math.PI - Math.PI/20;
        const angle2 = ((i+1)/20)*2*Math.PI - Math.PI/20;

        // Single
        const s = document.createElementNS(svgNS,'path');
        s.setAttribute('d',describeArc(center,center,singleOuter,angle1,angle2,singleInner));
        s.setAttribute('fill',i%2===0?'#ffffff20':'#00000020');
        s.setAttribute('class','clickable');
        s.addEventListener('click',()=>onHit(num,1));
        svg.appendChild(s);

        // Triple
        const t = document.createElementNS(svgNS,'path');
        t.setAttribute('d',describeArc(center,center,tripleOuter,angle1,angle2,tripleInner));
        t.setAttribute('fill',i%2===0?'#00ff0040':'#ff000040');
        t.setAttribute('class','clickable');
        t.addEventListener('click',()=>onHit(num,3));
        svg.appendChild(t);

        // Double
        const d = document.createElementNS(svgNS,'path');
        d.setAttribute('d',describeArc(center,center,doubleOuter,angle1,angle2,doubleInner));
        d.setAttribute('fill',i%2===0?'#00ff0080':'#ff000080');
        d.setAttribute('class','clickable');
        d.addEventListener('click',()=>onHit(num,2));
        svg.appendChild(d);
    });

    // Outer Bull
    const sb = document.createElementNS(svgNS,'circle');
    sb.setAttribute('cx',center); sb.setAttribute('cy',center); sb.setAttribute('r',12);
    sb.setAttribute('fill','#ffff00'); sb.setAttribute('class','clickable');
    sb.addEventListener('click',()=>onHit(25,1));
    svg.appendChild(sb);

    // Bull
    const db = document.createElementNS(svgNS,'circle');
    db.setAttribute('cx',center); db.setAttribute('cy',center); db.setAttribute('r',6);
    db.setAttribute('fill','#ff0000'); db.setAttribute('class','clickable');
    db.addEventListener('click',()=>onHit(25,2));
    svg.appendChild(db);

    // Numbers
    segmentOrder.forEach((num,i)=>{
        const angle = ((i+0.5)/20)*2*Math.PI - Math.PI/2;
        const radius = 95;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        const text = document.createElementNS(svgNS,'text');
        text.setAttribute('x',x); text.setAttribute('y',y);
        text.setAttribute('text-anchor','middle');
        text.setAttribute('dominant-baseline','middle');
        text.setAttribute('fill','#ffffff');
        text.setAttribute('font-size','12');
        text.setAttribute('font-weight','bold');
        text.setAttribute('transform',`rotate(${angle*180/Math.PI},${x},${y})`);
        text.textContent = num;
        svg.appendChild(text);
    });

    container.appendChild(svg);
}

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

function totalPicks(){ return picks.reduce((a,b)=>a+b.value,0); }

function updateDartsDisplay(){
    dartsDisplay.innerHTML = picks.map(p=>p.code).join(', ');
}

function validateCheckout(){
    const sum = totalPicks();
    let correct = false;
    let standardOuts = checkouts[target] || [];
    let standard = standardOuts.length>0 ? standardOuts[0].map(h=>h.code).join(', ') : '';
    let alternatives = standardOuts.slice(1).map(s=>s.map(h=>h.code).join(', ')).join(' | ');

    if(sum===target && picks[picks.length-1].isDouble){
        score++; correct=true;
    } else {
        score--; correct=false;
    }

    scoreDisplay.textContent = score;

    history.unshift({
        target: target,
        userHits: picks.map(h=>h.code).join(', '),
        correct: correct ? 'Yes':'No',
        standardOut: standard,
        alternatives: alternatives
    });

    updateHistoryTable();
    picks = [];
    updateDartsDisplay();
}

// Update history table
function updateHistoryTable(){
    historyTable.innerHTML = '';
    history.forEach(item=>{
        const row = document.createElement('tr');
        ['target','userHits','correct','standardOut','alternatives'].forEach(key=>{
            const td = document.createElement('td'); td.textContent = item[key]; row.appendChild(td);
        });
        historyTable.appendChild(row);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded',()=>{
    renderBoard();
    document.getElementById('generate-target').click();
});
