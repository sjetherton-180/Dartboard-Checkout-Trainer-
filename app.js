// Dartboard Checkout Trainer — Full Working App


// Dartboard segments and hit definitions
const segmentOrder = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const hits = [];
for (let n = 1; n <= 20; n++) {
hits.push({code:`S${n}`,label:`S ${n}`,value:n,isDouble:false});
hits.push({code:`D${n}`,label:`D ${n}`,value:n*2,isDouble:true});
hits.push({code:`T${n}`,label:`T ${n}`,value:n*3,isDouble:false});
}
hits.push({code:'SB',label:'S 25',value:25,isDouble:false});
hits.push({code:'DB',label:'D 25',value:50,isDouble:true});


// Generate all 3-dart checkouts from 170 to 2
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


// Remove duplicates
for(let t=2;t<=maxTarget;t++){
const seen = new Set();
const unique = [];
for(const seq of checkouts[t]){
const key = seq.map(s=>s.code).join(',');
if(!seen.has(key)){ seen.add(key); unique.push(seq); }
}
checkouts[t] = unique;
}


// State variables
let target = 170;
let picks = [];
let history = [];
let streak = 0;
let bestStreak = 0;


// Helper to render dartboard
function renderBoard(){
const container = document.getElementById('dartboard-container');
container.innerHTML='';
const svgNS='http://www.w3.org/2000/svg';
const svg=document.createElementNS(svgNS,'svg');
svg.setAttribute('viewBox','0 0 200 200');
const center=100;
const radius=90;
segmentOrder.forEach((num,i)=>{
const angle1=(i/20)*2*Math.PI-Math.PI/20;
const angle2=((i+1)/20)*2*Math.PI-Math.PI/20;
const x1=center+radius*Math.cos(angle1);
const y1=center+radius*Math.sin(angle1);
const x2=center+radius*Math.cos(angle2);
const y2=center+radius*Math.sin(angle2);
const path=document.createElementNS(svgNS,'path');
path.setAttribute('d',`M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`);
path.setAttribute('fill',i%2===0?'#b22222':'#000000');
path.setAttribute('class','clickable');
});
