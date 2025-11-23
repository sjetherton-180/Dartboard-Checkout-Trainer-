// Dart Checkout Trainer - Bulls enlarged, double/treble bands wider, 20 top-centered

const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
let targetScore = 0, darts = [], score = 0, dartMarkers = [], soundOn = true;

// --- Winmau Preferred Outs ---
const preferredOuts = { /* same as previous version */ };

// --- Polar Helpers ---
function polarToCartesian(cx,cy,r,angle){return {x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle)};}
function describeArc(cx,cy,rOuter,rInner,startAngle,endAngle){
  const p1=polarToCartesian(cx,cy,rOuter,startAngle);
  const p2=polarToCartesian(cx,cy,rOuter,endAngle);
  const p3=polarToCartesian(cx,cy,rInner,endAngle);
  const p4=polarToCartesian(cx,cy,rInner,startAngle);
  const largeArc=(endAngle-startAngle)<=Math.PI?0:1;
  return `M${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

// --- Sound ---
function beep(){if(!soundOn)return;try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();osc.type="square";osc.frequency.value=600;osc.connect(ctx.destination);osc.start();setTimeout(()=>osc.stop(),80);}catch(e){}}

// --- Dartboard Creation ---
function createDartboard(){
  const container=document.getElementById("dartboard-container"); container.innerHTML="";
  const size=400; const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("width",size); svg.setAttribute("height",size); svg.setAttribute("viewBox","0 0 400 400");
  const cx=200,cy=200;
  const totalSegments = segmentOrder.length;
  const segmentAngle=2*Math.PI/totalSegments;
  const startOffset=-Math.PI/2 - segmentAngle/2;

  const singleOuter=160,singleInner=50;
  const tripleOuter=115,tripleInner=85; // widened treble
  const doubleOuter=190,doubleInner=160; // widened double
  const bullOuter=28,bullInner=16; // enlarged bulls

  segmentOrder.forEach((num,i)=>{
    const startAngle=startOffset + i*segmentAngle;
    const endAngle=startAngle + segmentAngle;

    addSegment(svg,cx,cy,singleOuter,tripleOuter,startAngle,endAngle,i%2===0?"#eee":"#ccc","S",num,1);
    addSegment(svg,cx,cy,tripleOuter,tripleInner,startAngle,endAngle,i%2===0?"#ff6666":"#66ff66","T",num,3);
    addSegment(svg,cx,cy,tripleInner,singleInner,startAngle,endAngle,i%2===0?"#eee":"#ccc","S",num,1);
    addSegment(svg,cx,cy,doubleOuter,doubleInner,startAngle,endAngle,i%2===0?"#cc0000":"#009900","D",num,2);

    // Outer numbers
    const numberRadius = doubleOuter + 25;
    const angle = (startAngle + endAngle)/2;
    const pos = polarToCartesian(cx, cy, numberRadius, angle);
    const txt = document.createElementNS("http://www.w3.org/2000/svg","text");
    txt.setAttribute("x", pos.x);
    txt.setAttribute("y", pos.y);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("dominant-baseline", "middle");
    txt.setAttribute("font-size", "16");
    txt.setAttribute("font-weight", "bold");
    txt.setAttribute("fill", "#FFD700");
    txt.textContent=num;
    svg.appendChild(txt);
  });

  addBull(svg,cx,cy,bullOuter,"green","SB");
  addBull(svg,cx,cy,bullInner,"red","DB");
  container.appendChild(svg);
}

function addSegment(svg,cx,cy,rOuter,rInner,startAngle,endAngle,color,ringType,num,mult){
  const path=document.createElementNS("http://www.w3.org/2000/svg","path");
  path.setAttribute("d",describeArc(cx,cy,rOuter,rInner,startAngle,endAngle));
  path.setAttribute("fill",color); path.style.cursor="pointer";
  path.addEventListener("click",()=>hitSegment(num,mult,{cx,cy,ring:ringType,angle:(startAngle+endAngle)/2}));
  svg.appendChild(path);
}

function addBull(svg,cx,cy,r,color,ringType){
  const bull=document.createElementNS("http://www.w3.org/2000/svg","circle");
  bull.setAttribute("cx",cx); bull.setAttribute("cy",cy); bull.setAttribute("r",r);
  bull.setAttribute("fill",color); bull.style.cursor="pointer";
  bull.addEventListener("click",()=>{
    const mult = (ringType==="DB"?2:1);
    hitSegment(25, mult, {cx,cy,ring:ringType});
  });
  svg.appendChild(bull);
}

// --- Hit Segment ---
function hitSegment(num,mult,markerInfo){
  if(darts.length>=3) return;
  const val=num*mult; darts.push(val); beep(); updateDartsDisplay();

  if(markerInfo){
    const svg=document.querySelector("#dartboard-container svg");
    const marker=document.createElementNS("http://www.w3.org/2000/svg","circle");
    let radius;
    switch(markerInfo.ring){
      case 'T': radius=(tripleOuter+tripleInner)/2; break;
      case 'D': radius=(doubleOuter+doubleInner)/2; break;
      case 'SB': radius=bullOuter/2; break;
      case 'DB': radius=bullInner/2; break;
      default: radius=(singleOuter+singleInner)/2;
    }
    const pos=polarToCartesian(markerInfo.cx,markerInfo.cy,radius,markerInfo.angle||0);
    marker.setAttribute("cx",pos.x); marker.setAttribute("cy",pos.y);
    marker.setAttribute("r",0); marker.setAttribute("fill","orange"); marker.setAttribute("stroke","black"); marker.setAttribute("stroke-width","1");
    svg.appendChild(marker); dartMarkers.push(marker);
    let r=0; const targetR=6; const anim=setInterval(()=>{r+=1;if(r>=targetR){r=targetR;clearInterval(anim);}marker.setAttribute("r",r);},15);
  }

  const total=darts.reduce((a,b)=>a+b,0);
  const standard=preferredOuts[targetScore]; const standardCodes=standard?standard.join(','):'(none)';

  if(total===targetScore && (markerInfo?.ring==='DB'||markerInfo?.ring==='D'||markerInfo?.mult===2)){
    score++; addHistory(true,standardCodes,total); resetRound();
  }else if(total>targetScore || darts.length===3){
    score--; addHistory(false,standardCodes,total); resetRound();
  }
  updateScore();
}

// --- Display / History ---
function updateDartsDisplay(){document.getElementById("darts-display").textContent=darts.join(", ");}
function updateScore(){document.getElementById("score-display").textContent=score;}
function addHistory(correct,standard,total){
  const tbody=document.querySelector("#history-table tbody");
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${targetScore}</td><td>${darts.join(", ")}</td><td>${total}</td><td>${correct?"✔":"✖"}</td><td>${standard}</td>`;
  tbody.prepend(tr);
}

// --- New Target ---
function newTarget(){targetScore=Math.floor(Math.random()*131)+40; darts=[]; updateDartsDisplay(); document.getElementById("target-display").textContent=targetScore; dartMarkers.forEach(m=>m.remove()); dartMarkers=[];}
function resetRound(){newTarget();}

// --- Mute ---
function toggleSound(){soundOn=!soundOn; document.getElementById("mute-btn").textContent=soundOn?"Mute":"Unmute";}

// --- Init ---
createDartboard(); newTarget();
document.getElementById("generate-target").addEventListener("click",newTarget);
const leftPanel=document.querySelector(".left-panel");
const muteBtn=document.createElement("button"); muteBtn.id="mute-btn"; muteBtn.className="btn"; muteBtn.textContent="Mute"; muteBtn.addEventListener("click",toggleSound);
leftPanel.appendChild(muteBtn);
