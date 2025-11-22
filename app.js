// Dartboard Checkout Trainer — Fully working with outer numbers and sum display

const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const hits = [];
for (let n = 1; n <= 20; n++) {
    hits.push({code:`S${n}`,label:`S ${n}`,value:n,isDouble:false,base:n});
    hits.push({code:`D${n}`,label:`D ${n}`,value:n*2,isDouble:true,base:n});
    hits.push({code:`T${n}`,label:`T ${n}`,value:n*3,isDouble:false,base:n});
}
hits.push({code:'SB',label:'S 25',value:25,isDouble:false,base:25});
hits.push({code:'DB',label:'D 25',value:50,isDouble:true,base:25});

// Generate 3-dart checkouts
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
let target = 170;
let picks = [];
let history = [];
let streak = 0;
let bestStreak = 0;

// Render dartboard with numbers
function renderBoard() {
    const container = document.getElementById('dartboard-container');
    container.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');

    const center = 100;
    const tripleInner = 60, tripleOuter = 70;
    const doubleInner = 80, doubleOuter = 90;
    const singleInner = 30, singleOuter = 80;

    // Segments
    segmentOrder.forEach((num, i) => {
        const angle1 = (i/20)*2*Math.PI - Math.PI/20;
        const angle2 = ((i+1)/20)*2*Math.PI - Math.PI/20;

        // Single
        const sPath = document.createElementNS(svgNS,'path');
        sPath.setAttribute('d', describeArc(center,center,singleOuter,angle1,angle2,singleInner));
        sPath.setAttribute('fill', i%2===0?'#ffffff20':'#00000020');
        sPath.setAttribute('class','clickable');
        sPath.addEventListener('click',()=>onHitClick(num,1));
        svg.appendChild(sPath);

        // Triple
        const tPath = document.createElementNS(svgNS,'path');
        tPath.setAttribute('d', describeArc(center,center,tripleOuter,angle1,angle2,tripleInner));
        tPath.setAttribute('fill', i%2===0?'#00ff0040':'#ff000040');
        tPath.setAttribute('class','clickable');
        tPath.addEventListener('click',()=>onHitClick(num,3));
        svg.appendChild(tPath);

        // Double
        const dPath = document.createElementNS(svgNS,'path');
        dPath.setAttribute('d', describeArc(center,center,doubleOuter,angle1,angle2,doubleInner));
        dPath.setAttribute('fill', i%2===0?'#00ff0080':'#ff000080');
        dPath.setAttribute('class','clickable');
        dPath.addEventListener('click',()=>onHitClick(num,2));
        svg.appendChild(dPath);
    });

    // Outer Bull
    const sb = document.createElementNS(svgNS,'circle');
    sb.setAttribute('cx',center);
    sb.setAttribute('cy',center);
    sb.setAttribute('r',12);
    sb.setAttribute('fill','#ffff00');
    sb.setAttribute('class','clickable');
    sb.addEventListener('click',()=>onHitClick(25,1));
    svg.appendChild(sb);

    // Bull
    const db = document.createElementNS(svgNS,'circle');
    db.setAttribute('cx',center);
    db.setAttribute('cy',center);
    db.setAttribute('r',6);
    db.setAttribute('fill','#ff0000');
    db.setAttribute('class','clickable');
    db.addEventListener('click',()=>onHitClick(25,2));
    svg.appendChild(db);

    // Outer numbers
    segmentOrder.forEach((num, i) => {
        const angle = ((i+0.5)/20)*2*Math.PI - Math.PI/2;
        const radius = 95;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        const text = document.createElementNS(svgNS,'text');
        text.setAttribute('x',x);
        text.setAttribute('y',y);
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

// Arc helper
function describeArc(cx, cy, rOuter, startAngle, endAngle, rInner) {
    const x1 = cx + rOuter * Math.cos(startAngle);
    const y1 = cy + rOuter * Math.sin(startAngle);
    const x2 = cx + rOuter * Math.cos(endAngle);
    const y2 = cy + rOuter * Math.sin(endAngle);
    const x3 = cx + rInner * Math.cos(endAngle);
    const y3 = cy + rInner * Math.sin(endAngle);
    const x4 = cx + rInner * Math.cos(startAngle);
    const y4 = cy + rInner * Math.sin(startAngle);
    return `M${x1},${y1} A${rOuter},${rOuter} 0 0,1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 0,0 ${x4},${y4} Z`;
}

// Handle hit click
function onHitClick(number,multiplier){
    const hit = hits.find(h=>h.base===number && ((multiplier===1 && !h.isDouble && h.value===number) || (multiplier===2 && h.isDouble && h.value===number*2) || (multiplier===3 && !h.isDouble && h.value===number*3)));
    if(!hit) return;
    picks.push(hit);
    checkPick();
}

// Check picks
function checkPick(){
    const sum = picks.reduce((a,b)=>a+b.value,0);
    const info = document.getElementById('info-container');
    const sumDisplay = document.getElementById('current-sum');
    sumDisplay.textContent = `${sum} / ${target}`;

    if(sum === target){
        if(picks[picks.length-1].isDouble){
            streak++; bestStreak=Math.max(streak,bestStreak);
            history.push({target,picks:[...picks],correct:true});
            info.innerHTML=`✅ Correct! Streak: ${streak}, Best: ${bestStreak}`;
        } else {
            streak=0;
            history.push({target,picks:[...picks],correct:false});
            info.innerHTML=`❌ Incorrect: last dart not double.`;
        }
        picks=[];
        sumDisplay.textContent = `0 / ${target}`;
    } else if(sum > target){
        streak=0;
        history.push({target,picks:[...picks],correct:false});
        info.innerHTML=`❌ Busted!`;
        picks=[];
        sumDisplay.textContent = `0 / ${target}`;
    } else {
        info.innerHTML=`Current sum: ${sum} / Target: ${target}`;
    }
}

// Reset
function resetStorage(){
    history=[]; streak=0; bestStreak=0;
    document.getElementById('info-container').innerHTML='Data reset';
    document.getElementById('current-sum').textContent = `0 / ${target}`;
}

// Init
document.addEventListener('DOMContentLoaded',()=>{
    renderBoard();
    document.getElementById('resetStorage').addEventListener('click',resetStorage);
});
