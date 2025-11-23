// Dart Checkout Trainer - Version 1.3 (Stable Sound & Traditional Colors)

const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
let targetScore = 0, darts = [], score = 0, dartMarkers = [], soundOn = true;

// --- Winmau Preferred Outs 170→40 ---
const preferredOuts = {
  170:["T20","T20","Bull"],167:["T20","T19","Bull"],164:["T20","T18","Bull"],
  // ... same as previous ...
  42:["S10","D16"],41:["S9","D16"],40:["D20"]
};

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

// --- Sound System (Stable) ---
let audioCtx, gainNode;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.1; // low volume
        gainNode.connect(audioCtx.destination);
    }
}

function beep() {
    if (!soundOn) return;
    if (!audioCtx) initAudio();

    try {
        const osc = audioCtx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 600;
        osc.connect(gainNode);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.08);
    } catch(e) {
        console.error("Beep error:", e);
    }
}

// --- Initialize audio on page load ---
window.addEventListener("load", () => initAudio());

// --- Dartboard ---
function createDartboard(){
  const container=document.getElementById("dartboard-container"); container.innerHTML="";
  const size=450; const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("width",size); svg.setAttribute("height",size); svg.setAttribute("viewBox","0 0 450 450");
  const cx=225,cy=225;
  const totalSegments = segmentOrder.length;
  const segmentAngle=2*Math.PI/totalSegments;
  const startOffset=-Math.PI/2 - segmentAngle/2;

  const singleOuter=170,singleInner=40;
  const tripleOuter=120,tripleInner=100;
  const doubleOuter=190,doubleInner=170;
  const bullOuter=40,bullInner=15;

  segmentOrder.forEach((num,i)=>{
    const startAngle=startOffset + i*segmentAngle;
    const endAngle=startAngle + segmentAngle;

    // Traditional dartboard colors
    const singleColor = i%2===0 ? "#ffffff" : "#000000";
    const tripleColor = i%2===0 ? "#ff0000" : "#008000";
    const doubleColor = i%2===0 ? "#ff0000" : "#008000";

    addSegment(svg,cx,cy,singleOuter,tripleOuter,startAngle,endAngle,singleColor,"S",num,1);
    addSegment(svg,cx,cy,tripleOuter,tripleInner,startAngle,endAngle,tripleColor,"T",num,3);
    addSegment(svg,cx,cy,tripleInner,singleInner,startAngle,endAngle,singleColor,"S",num,1);
    addSegment(svg,cx,cy,doubleOuter,doubleInner,startAngle,endAngle,doubleColor,"D",num,2);

    const numberRadius = doubleOuter + 15;
    const angle = (startAngle + endAngle)/2;
    const pos = polarToCartesian(cx, cy, numberRadius, angle);
    const txt = document.createElementNS("http://www.w3.org/2000/svg","text");
    txt.setAttribute("x", pos.x);
    txt.setAttribute("y", pos.y);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("dominant-baseline", "middle");
    txt.setAttribute("font-size", "18");
    txt.setAttribute("font-weight", "bold");
    txt.setAttribute("fill", "#FFD700");
    txt.setAttribute("stroke", "black");
    txt.setAttribute("stroke-width", "1.5");
    txt.textContent=num;
    svg.appendChild(txt);
  });

  addBull(svg,cx,cy,bullOuter,"green","SB");
  addBull(svg,cx,cy,bullInner,"red","DB");

  container.appendChild(svg);
}

// --- Add Segment ---
function addSegment(svg,cx,cy,rOuter,rInner,startAngle,endAngle,color,ringType,num,mult){
  const path=document.createElementNS("http://www.w3.org/2000/svg","path");
  path.setAttribute("d",describeArc(cx,cy,rOuter,rInner,startAngle,endAngle));
  path.setAttribute("fill",color);
  path.style.cursor="pointer";

  path.addEventListener("mouseenter",()=>path.setAttribute("fill",lightenColor(color,0.3)));
  path.addEventListener("mouseleave",()=>path.setAttribute("fill",color));
  path.addEventListener("click",()=>hitSegment(num,mult,{cx,cy,ring:ringType,angle:(startAngle+endAngle)/2,rOuter,rInner}));

  svg.appendChild(path);
}

// --- Add Bull ---
function addBull(svg, cx, cy, r, color, ringType){
  const bull = document.createElementNS("http://www.w3.org/2000/svg","circle");
  bull.setAttribute("cx", cx);
  bull.setAttribute("cy", cy);
  bull.setAttribute("r", r);
  bull.setAttribute("fill", color);
  bull.style.cursor = "pointer";

  bull.addEventListener("click", () => {
    const mult = (ringType === "DB" ? 2 : 1);
    hitSegment(25, mult, { cx, cy, ring: ringType, rOuter: r, rInner: ringType==="DB"?0:25 });
  });

  svg.appendChild(bull);
}

// --- Lighten color ---
function lightenColor(color, percent){
  const f = parseInt(color.slice(1),16), t = percent < 0 ? 0 : 255, p=Math.abs(percent);
  const R=f>>16, G=f>>8&0x00FF, B=f&0x0000FF;
  return "#" + (0x1000000 + (Math.round((t-R)*p)+R)*0x10000 + (Math.round((t-G)*p)+G)*0x100 + (Math.round((t-B)*p)+B)).toString(16).slice(1);
}

// --- Hit Segment ---
function hitSegment(num,mult,markerInfo){
  if(darts.length>=3) return;
  const val=num*mult;
  darts.push(val); beep(); updateDartsDisplay();

  if(markerInfo){
    const svg=document.querySelector("#dartboard-container svg");
    const marker=document.createElementNS("http://www.w3.org/2000/svg","circle");
    let radius;
    switch(markerInfo.ring){
      case 'T': case 'D': radius=(markerInfo.rOuter+markerInfo.rInner)/2; break;
      case 'SB': case 'DB': radius=markerInfo.rOuter/2; break;
      default: radius=(markerInfo.rOuter+markerInfo.rInner)/2;
    }
    const pos=polarToCartesian(markerInfo.cx,markerInfo.cy,radius,markerInfo.angle||0);
    marker.setAttribute("cx",pos.x); marker.setAttribute("cy",pos.y);
    marker.setAttribute("r",0); marker.setAttribute("fill","orange"); marker.setAttribute("stroke","black"); marker.setAttribute("stroke-width","1");
    svg.appendChild(marker); dartMarkers.push(marker);
    let r=0; const targetR=6; const anim=setInterval(()=>{r+=1;if(r>=targetR){r=targetR;clearInterval(anim);}marker.setAttribute("r",r);},15);
  }

  const total=darts.reduce((a,b)=>a+b,0);
  const standard=preferredOuts[targetScore]; const standardCode=standard?standard.join(','):'(none)';

  if(total===targetScore && (markerInfo?.ring==='DB'||markerInfo?.ring==='D'||markerInfo?.mult===2)){
    score++; addHistory(true,standardCode,total); resetRound();
  }else if(total>targetScore || darts.length===3){
    score--; addHistory(false,standardCode,total); resetRound();
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
