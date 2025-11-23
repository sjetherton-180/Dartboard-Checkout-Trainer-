// ------------------------------
// Dart Checkout Trainer - Full Version
// Corrected: 20 at top, numbers aligned, enlarged bulls clickable
// ------------------------------

const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
let targetScore = 0;
let darts = [];
let score = 0;
let dartMarkers = [];
let soundOn = true;

// --- Winmau Preferred Outs 170 → 40 ---
const preferredOuts = {
  170:["T20","T20","Bull"],167:["T20","T19","Bull"],164:["T20","T18","Bull"],161:["T20","T17","Bull"],
  160:["T20","T20","D20"],158:["T20","T20","D19"],157:["T20","T19","D20"],156:["T20","T20","D18"],
  155:["T20","T19","D19"],154:["T20","T18","D20"],153:["T20","T19","D18"],152:["T20","T20","D16"],
  151:["T20","T17","D20"],150:["T20","T18","D18"],149:["T20","T19","D16"],148:["T20","T20","D14"],
  147:["T20","T17","D18"],146:["T20","T18","D16"],145:["T20","T15","D20"],144:["T20","T20","D12"],
  143:["T20","T17","D16"],142:["T20","T14","D20"],141:["T20","T19","D12"],140:["T20","T20","D10"],
  139:["T19","T14","D20"],138:["T20","T18","D12"],137:["T20","T19","D10"],136:["T20","T20","D8"],
  135:["Bull","T17","D12"],134:["T20","T14","D16"],133:["T20","T19","D8"],132:["Bull","T16","D12"],
  131:["T20","T13","D16"],130:["T20","T20","D5"],129:["T19","T20","D6"],128:["T18","T14","D16"],
  127:["T20","T17","D8"],126:["T19","T19","D6"],125:["Bull","T20","D20"],124:["T20","T14","D11"],
  123:["T19","T16","D9"],122:["T18","T18","D7"],121:["T20","T11","D14"],120:["T20","S20","D20"],
  119:["T19","T12","D13"],118:["T20","S18","D20"],117:["T20","S17","D20"],116:["T20","S16","D20"],
  115:["T20","S15","D20"],114:["T20","S14","D20"],113:["T20","S13","D20"],112:["T20","S12","D20"],
  111:["T20","S11","D20"],110:["T20","S10","D20"],109:["T20","S9","D20"],108:["T20","S8","D20"],
  107:["T19","S7","D20"],106:["T20","S6","D20"],105:["T20","S5","D20"],104:["T19","S4","D20"],
  103:["T20","S3","D20"],102:["T20","S2","D20"],101:["T20","S1","D20"],100:["T20","D20"],99:["T19","10","D16"],
  98:["T20","D19"],97:["T19","D20"],96:["T20","D18"],95:["T19","D19"],94:["T18","D20"],93:["T19","D18"],
  92:["T20","D16"],91:["T17","D20"],90:["T20","D15"],89:["T19","D16"],88:["T20","D14"],87:["T17","D18"],
  86:["T18","D16"],85:["T15","D20"],84:["T20","D12"],83:["T17","D16"],82:["T14","D20"],81:["T19","D12"],
  80:["T20","D10"],79:["T19","D11"],78:["T18","D12"],77:["T19","D10"],76:["T20","D8"],75:["T17","D12"],
  74:["T14","D16"],73:["T19","D8"],72:["T16","D12"],71:["T13","D16"],70:["T18","D8"],69:["T19","D6"],
  68:["T20","D4"],67:["T17","D8"],66:["T10","D18"],65:["Bull","T15","D10"],64:["T16","D8"],63:["T13","D12"],
  62:["T10","D16"],61:["Bull","T7","D20"],60:["S20","D20"],59:["S19","D20"],58:["S18","D20"],57:["S17","D20"],
  56:["S16","D20"],55:["S15","D20"],54:["S14","D20"],53:["S13","D20"],52:["S12","D20"],51:["S19","D16"],
  50:["S14","D18"],49:["S9","D20"],48:["S16","D16"],47:["S7","D20"],46:["S10","D18"],45:["S13","D16"],
  44:["S4","D20"],43:["S3","D20"],42:["S10","D16"],41:["S9","D16"],40:["S20","D10"]
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
  const startOffset=-Math.PI/2 - segmentAngle/2; // center 20 at top

  const singleOuter=160,singleInner=50,tripleInner=90,tripleOuter=110,doubleInner=140,doubleOuter=160;
  const bullOuter=22,bullInner=10;

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

  addBull(svg,cx,cy,bullOuter,"green","SB"); // outer bull
  addBull(svg,cx,cy,bullInner,"red","DB");   // inner bull

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
      case 'T': radius=(110+90)/2; break;
      case 'D': radius=(160+140)/2; break;
      case 'SB': radius=22/2; break;
      case 'DB': radius=10/2; break;
      default: radius=(160+110)/2;
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
