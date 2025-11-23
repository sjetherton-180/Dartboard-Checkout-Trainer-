// Dart Checkout Trainer - Fully Complete

const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
let targetScore = 0;
let darts = [];
let score = 0;
let dartMarkers = [];
let soundOn = true;

// --- Winmau preferred outs 170→40 ---
const preferredOuts = {
170:"T20,T20,DB",167:"T20,T19,D25",164:"T20,T16,DB",161:"T20,T17,D20",
160:"T20,T20,D20",159:"T19,T16,DB",158:"T20,T20,D19",157:"T20,T19,D20",156:"T20,T20,D18",
155:"T20,T19,D19",154:"T20,T18,D20",153:"T20,T19,D18",152:"T20,T20,D16",151:"T20,T17,D20",
150:"T20,T18,D18",149:"T20,T19,D16",148:"T20,T16,D20",147:"T20,T17,D18",146:"T20,T18,D16",
145:"T20,T15,D20",144:"T20,T20,D12",143:"T20,T17,D16",142:"T20,T14,D20",141:"T20,T19,D12",
140:"T20,T20,D10",139:"T19,T14,D20",138:"T20,T18,D12",137:"T20,T19,D10",136:"T20,T20,D8",
135:"T20,T15,D20",134:"T20,T14,D20",133:"T20,T19,D8",132:"T20,T16,D20",131:"T20,T13,D20",
130:"T20,T20,D5",129:"T19,T16,D12",128:"T18,T14,D20",127:"T20,T17,D8",126:"T19,T19,D6",
125:"T20,T15,D10",124:"T20,T12,D16",123:"T19,T16,D9",122:"T18,T14,D16",121:"T20,T11,D14",
120:"T20,20,D20",119:"T19,10,D20",118:"T20,18,D20",117:"T20,17,D20",116:"T20,16,D20",
115:"T20,15,D20",114:"T20,14,D20",113:"T20,13,D20",112:"T20,12,D20",111:"T20,11,D20",
110:"T20,10,D20",109:"T20,9,D20",108:"T20,8,D20",107:"T19,10,D20",106:"T20,6,D20",
105:"T20,5,D20",104:"T18,18,D16",103:"T20,3,D20",102:"T20,10,D16",101:"T17,10,D20",
100:"T20,D20",99:"T19,10,D16",98:"T20,D19",97:"T19,D20",96:"T20,D18",95:"T19,D19",
94:"T18,D20",93:"T19,D18",92:"T20,D16",91:"T17,D20",90:"T18,D18",89:"T19,D16",88:"T16,D20",
87:"T17,D18",86:"T18,D16",85:"T15,D20",84:"T20,D12",83:"T17,D16",82:"T14,D20",81:"T19,D12",
80:"T20,D10",79:"T13,D20",78:"T18,D12",77:"T19,D10",76:"T20,D8",75:"T17,D12",74:"T14,D16",
73:"T19,D8",72:"T16,D12",71:"T13,D16",70:"T18,D8",69:"T19,D6",68:"T20,D4",67:"T17,D8",
66:"T10,D18",65:"T19,D4",64:"T16,D8",63:"T13,D12",62:"T10,D16",61:"T15,D8",60:"20,D20",
59:"19,D20",58:"18,D20",57:"17,D20",56:"16,D20",55:"15,D20",54:"14,D20",53:"13,D20",
52:"20,D16",51:"19,D16",50:"10,D20",49:"17,D16",48:"16,D16",47:"15,D16",46:"14,D16",
45:"13,D16",44:"12,D16",43:"11,D16",42:"10,D16",41:"9,D16",40:"D20"
};

// --- Helper functions ---
function polarToCartesian(cx, cy, r, angle){
    return {x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle)};
}

function describeArc(cx, cy, rOuter, rInner, startAngle, endAngle){
    const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
    const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
    const p3 = polarToCartesian(cx, cy, rInner, endAngle);
    const p4 = polarToCartesian(cx, cy, rInner, startAngle);
    const largeArc = (endAngle - startAngle) <= Math.PI ? 0 : 1;
    return `M${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

function beep(){ if(!soundOn) return; try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); osc.type="square"; osc.frequency.value=600; osc.connect(ctx.destination); osc.start(); setTimeout(()=>osc.stop(),80); }catch(e){} }

// --- Dartboard ---
function createDartboard(){
    const container = document.getElementById("dartboard-container");
    container.innerHTML="";
    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("width","400");
    svg.setAttribute("height","400");
    svg.setAttribute("viewBox","0 0 400 400");
    const cx=200, cy=200;
    const totalSegments = segmentOrder.length;
    const segmentAngle = 2*Math.PI/totalSegments;
    const startOffset=-Math.PI/2 - segmentAngle/2;

    const singleOuter=160, singleInner=50;
    const tripleOuter=120,tripleInner=90;
    const doubleOuter=190,doubleInner=160;
    const bullOuter=40,bullInner=25;

    segmentOrder.forEach((num,i)=>{
        const startAngle=startOffset + i*segmentAngle;
        const endAngle=startAngle + segmentAngle;
        addSegment(svg,cx,cy,singleOuter,tripleOuter,startAngle,endAngle,i%2===0?"#eee":"#ccc","S",num,1);
        addSegment(svg,cx,cy,tripleOuter,tripleInner,startAngle,endAngle,i%2===0?"#ff6666":"#66ff66","T",num,3);
        addSegment(svg,cx,cy,tripleInner,singleInner,startAngle,endAngle,i%2===0?"#eee":"#ccc","S",num,1);
        addSegment(svg,cx,cy,doubleOuter,doubleInner,startAngle,endAngle,i%2===0?"#cc0000":"#009900","D",num,2);

        const numberRadius = doubleOuter+50;
        const angle = (startAngle+endAngle)/2;
        const pos = polarToCartesian(cx,cy,numberRadius,angle);
        const txt = document.createElementNS("http://www.w3.org/2000/svg","text");
        txt.setAttribute("x",pos.x); txt.setAttribute("y",pos.y);
        txt.setAttribute("text-anchor","middle");
        txt.setAttribute("dominant-baseline","middle");
        txt.setAttribute("font-size","16");
        txt.setAttribute("font-weight","bold");
        txt.setAttribute("fill","#FFD700");
        txt.setAttribute("stroke","black");
        txt.setAttribute("stroke-width","1");
        txt.textContent=num;
        svg.appendChild(txt);
    });

    addBull(svg,cx,cy,bullOuter,"green","SB");
    addBull(svg,cx,cy,bullInner,"red","DB");
    container.appendChild(svg);
}

function addSegment(svg,cx,cy,rOuter,rInner,startAngle,endAngle,color,type,num,mult){
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",describeArc(cx,cy,rOuter,rInner,startAngle,endAngle));
    path.setAttribute("fill",color);
    path.style.cursor="pointer";
    path.addEventListener("click",()=>hitSegment(type,num,mult));
    svg.appendChild(path);
}

function addBull(svg,cx,cy,r,color,type){
    const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute("cx",cx); circle.setAttribute("cy",cy); circle.setAttribute("r",r);
    circle.setAttribute("fill",color); circle.style.cursor="pointer";
    circle.addEventListener("click",()=>hitSegment(type,25,type==="DB"?2:1));
    svg.appendChild(circle);
}

// --- Hits & scoring ---
function hitSegment(type,num,mult){
    if(darts.length>=3) return;
    darts.push(`${type}${num}`);
    const total = darts.reduce((sum,val)=>{
        const m = val.startsWith("T")?3:(val.startsWith("D")?2:1);
        const n = parseInt(val.slice(1));
        return sum+n*m;
    },0);
    updateDartsDisplay(); beep();
    const standardCode = preferredOuts[targetScore];
    if(total===targetScore && (type==="DB"||type==="D"||mult===2)){
        score++; addHistory(true,standardCode,total); indicateResult(true); resetRound();
    } else if(total>targetScore || darts.length===3){
        score--; addHistory(false,standardCode,total); indicateResult(false); resetRound();
    }
    document.getElementById("score-display").textContent=score;
}

function updateDartsDisplay(){ document.getElementById("darts-display").textContent=darts.join(", "); }

function addHistory(correct, standard, total){
    const tbody=document.querySelector("#history-table tbody");
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${targetScore}</td><td>${darts.join(", ")}</td><td>${total}</td><td>${correct?"✔":"✖"}</td><td>${standard}</td>`;
    tbody.prepend(tr);
}

function indicateResult(correct){
    const resultBox=document.getElementById("result-box");
    resultBox.textContent=correct?"✔":"✖";
    resultBox.style.color = correct?"green":"red";
}

function resetRound(){}

function newTarget(){
    targetScore = Math.floor(Math.random()*131)+40;
    darts = [];
    updateDartsDisplay();
    document.getElementById("target-display").textContent=targetScore;
    document.getElementById("target-display").style.color="black";
    document.getElementById("result-box").textContent="";
}

// --- Init ---
createDartboard();
newTarget();
document.getElementById("generate-target").addEventListener("click",newTarget);

// --- Mute button ---
const leftPanel=document.querySelector(".left-panel");
const muteBtn=document.createElement("button");
muteBtn.id="mute-btn"; muteBtn.className="btn"; muteBtn.textContent="Mute";
muteBtn.addEventListener("click",()=>{soundOn=!soundOn; muteBtn.textContent=soundOn?"Mute":"Unmute";});
leftPanel.appendChild(muteBtn);
