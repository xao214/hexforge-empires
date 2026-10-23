'use strict';
// Hexforge Empires - original turn-based 4X. (c) 2026, plain JS/Canvas.
const W=44,H=28,SQ3=Math.sqrt(3);
const $=id=>document.getElementById(id);
let G=null; // game state
let rng;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=()=>rng(), RI=n=>Math.floor(R()*n);

// ---------- data ----------
const TER={
 ocean:{n:'Ocean',f:1,p:0,t:2,mv:99,c:'#1f4f86',d:1},
 coast:{n:'Coast',f:1,p:0,t:2,mv:99,c:'#2f6fa8',d:1},
 grass:{n:'Grassland',f:2,p:0,t:0,mv:1,c:'#5d9b3c',d:1},
 plains:{n:'Plains',f:1,p:1,t:0,mv:1,c:'#a3a548',d:1},
 desert:{n:'Desert',f:0,p:1,t:0,mv:1,c:'#d8c27a',d:1},
 tundra:{n:'Tundra',f:1,p:0,t:0,mv:1,c:'#9aa79a',d:1},
 forest:{n:'Forest',f:1,p:2,t:0,mv:2,c:'#2f6b2f',d:1.25},
 hills:{n:'Hills',f:1,p:1,t:0,mv:2,c:'#8b7d4a',d:1.5},
 mount:{n:'Mountains',f:0,p:1,t:0,mv:3,c:'#7d7470',d:2},
};
const RES={wheat:{n:'Wheat',f:2,p:0,t:0,on:['plains','grass']},horses:{n:'Horses',f:0,p:1,t:1,on:['plains','grass']},
 gold:{n:'Gold',f:0,p:0,t:5,on:['hills','mount','desert']},fish:{n:'Fish',f:2,p:0,t:0,on:['coast']},
 iron:{n:'Iron',f:0,p:3,t:0,on:['hills','mount']},gems:{n:'Gems',f:0,p:0,t:4,on:['forest']},oasis:{n:'Oasis',f:3,p:0,t:1,on:['desert']}};
const UNITS={
 settler:{n:'Settler',a:0,d:1,m:1,c:30,sym:'S'},
 worker:{n:'Worker',a:0,d:1,m:1,c:20,sym:'W'},
 warrior:{n:'Warrior',a:1,d:1,m:1,c:10,sym:'Wa'},
 archer:{n:'Archer',a:3,d:2,m:1,c:20,sym:'Ar',tech:'archery'},
 spear:{n:'Spearman',a:1,d:2,m:1,c:20,sym:'Sp',tech:'bronze',bonusVsMounted:1},
 horse:{n:'Horseman',a:2,d:1,m:2,c:20,sym:'Ho',tech:'riding',mounted:1},
 chariot:{n:'Chariot',a:3,d:1,m:2,c:30,sym:'Ch',tech:'wheel',mounted:1},
 sword:{n:'Swordsman',a:4,d:2,m:1,c:30,sym:'Sw',tech:'iron'},
 catapult:{n:'Catapult',a:6,d:1,m:1,c:40,sym:'Ca',tech:'math',siege:1},
 pike:{n:'Pikeman',a:1,d:3,m:1,c:30,sym:'Pk',tech:'feudal',bonusVsMounted:1},
 knight:{n:'Knight',a:5,d:2,m:2,c:40,sym:'Kn',tech:'chivalry',mounted:1},
 musket:{n:'Musketeer',a:3,d:5,m:1,c:40,sym:'Mu',tech:'gunpowder'},
 cannon:{n:'Cannon',a:8,d:1,m:1,c:50,sym:'Cn',tech:'metallurgy',siege:1},
};
const BLD={
 granary:{n:'Granary',c:40,tech:'pottery',desc:'Keeps half food on growth'},
 barracks:{n:'Barracks',c:30,desc:'New units are veterans (+50%)'},
 walls:{n:'City Walls',c:50,tech:'masonry',desc:'+100% defence vs non-siege'},
 library:{n:'Library',c:60,tech:'writing',desc:'+50% science'},
 market:{n:'Market',c:60,tech:'currency',desc:'+50% gold'},
 temple:{n:'Shrine',c:40,tech:'ceremony',desc:'+1 food, +1 production'},
 aqueduct:{n:'Aqueduct',c:70,tech:'construction',desc:'Pop can exceed 8'},
 harbour:{n:'Harbour',c:50,tech:'seafaring',desc:'+1 food on water tiles'},
 university:{n:'Academy',c:100,tech:'philosophy',desc:'+50% science'},
 colossus:{n:'Sun Colossus (wonder)',c:120,tech:'bronze',wonder:1,desc:'+1 trade on water tiles in city'},
 observ:{n:'Star Vault (wonder)',c:300,tech:'astronomy',wonder:1,desc:'Science victory when built!'},
};
const TECHS={
 pottery:{n:'Pottery',req:[]},bronze:{n:'Bronze Working',req:[]},alphabet:{n:'Alphabet',req:[]},riding:{n:'Horseback Riding',req:[]},
 ceremony:{n:'Ceremonial Burial',req:[]},masonry:{n:'Masonry',req:[]},
 archery:{n:'Archery',req:['bronze']},wheel:{n:'The Wheel',req:['riding']},writing:{n:'Writing',req:['alphabet']},
 currency:{n:'Currency',req:['bronze']},iron:{n:'Iron Working',req:['bronze','masonry']},seafaring:{n:'Seafaring',req:['pottery','alphabet']},
 math:{n:'Mathematics',req:['alphabet','masonry']},construction:{n:'Construction',req:['pottery','currency']},
 philosophy:{n:'Philosophy',req:['writing','ceremony']},feudal:{n:'Feudalism',req:['iron','ceremony']},
 chivalry:{n:'Chivalry',req:['feudal','riding']},astronomy:{n:'Astronomy',req:['math','philosophy']},
 gunpowder:{n:'Gunpowder',req:['iron','astronomy']},metallurgy:{n:'Metallurgy',req:['gunpowder','construction']},
};
const CIVS=[
 {name:'Valdren',leader:'You',col:'#3fa7ff',cities:['Ashford','Brightmere','Coldwater','Dunmoor','Elmsgate','Fernhollow','Greywick','Hollowmere','Ironvale','Juniper','Kestrel','Larkspur']},
 {name:'Ozari',leader:'Queen Teshra',col:'#ff5a4a',cities:['Zahrim','Qetesh','Amun-Ka','Sefira','Nubara','Tauset','Khemra','Ilun']},
 {name:'Hrothi',leader:'Jarl Brannoc',col:'#f2c230',cities:['Skarholt','Ulfheim','Varrow','Dunskar','Hagby','Freyn','Torvik','Kaldr']},
 {name:'Lumen',leader:'Sage Ileth',col:'#c46cff',cities:['Aurelis','Vesperine','Solace','Mirethal','Cyrene','Lucen','Avalor','Elyth']},
];
// ---------- hex helpers ----------
const idx=(c,r)=>r*W+c;
const inb=(c,r)=>c>=0&&r>=0&&c<W&&r<H;
function nbrs(c,r){const o=r&1?[[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]]:[[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];
 const a=[];for(const[dc,dr]of o){const nc=c+dc,nr=r+dr;if(inb(nc,nr))a.push([nc,nr])}return a}
function cube(c,r){const x=c-(r-(r&1))/2;return[x,-x-r,r]}
function dist(a,b,c,d){const p=cube(a,b),q=cube(c,d);return Math.max(Math.abs(p[0]-q[0]),Math.abs(p[1]-q[1]),Math.abs(p[2]-q[2]))}
function ring(c,r,rad){const out=[];for(let y=Math.max(0,r-rad);y<=Math.min(H-1,r+rad);y++)for(let x=Math.max(0,c-rad-1);x<=Math.min(W-1,c+rad+1);x++)if(dist(c,r,x,y)<=rad)out.push([x,y]);return out}
const T=(c,r)=>G.map[idx(c,r)];
const isLand=t=>t.t!=='ocean'&&t.t!=='coast';

// ---------- map gen ----------
function noise(seed,scale){const gw=Math.ceil(W/scale)+2,gh=Math.ceil(H/scale)+2,g=[];const r2=mulberry(seed);for(let i=0;i<gw*gh;i++)g.push(r2());
 return(x,y)=>{const fx=x/scale,fy=y/scale,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;const s=t=>t*t*(3-2*t);const v=(a,b)=>g[b*gw+a];
  const a=v(ix,iy)+(v(ix+1,iy)-v(ix,iy))*s(tx),b=v(ix,iy+1)+(v(ix+1,iy+1)-v(ix,iy+1))*s(tx);return a+(b-a)*s(ty)}}
function genMap(seed){
 const n1=noise(seed,7),n2=noise(seed+7,3),m1=noise(seed+13,5);const map=[];
 for(let r=0;r<H;r++)for(let c=0;c<W;c++){
  const ex=Math.min(c,W-1-c)/5,ey=Math.min(r,H-1-r)/4;const edge=Math.min(1,ex,ey);
  let e=(n1(c,r)*0.7+n2(c,r)*0.3)*(0.45+0.55*edge);const m=m1(c,r);const lat=Math.abs(r-H/2)/(H/2);
  let t;if(e<0.36)t='ocean';else if(e<0.42)t='coast';else if(e>0.72)t='mount';else if(e>0.63)t='hills';
  else if(lat>0.85)t='tundra';else if(m>0.62)t='forest';else if(m<0.3&&lat<0.5)t='desert';else if(m<0.45)t='plains';else t='grass';
  map.push({t,res:null,road:0,farm:0,mine:0,owner:-1,hut:0});}
 // coast = water adjacent to land
 for(let r=0;r<H;r++)for(let c=0;c<W;c++){const t=map[idx(c,r)];if(t.t==='ocean'||t.t==='coast'){t.t=nbrs(c,r).some(([a,b])=>{const u=map[idx(a,b)].t;return u!=='ocean'&&u!=='coast'})?'coast':'ocean'}}
 for(const t of map){if(R()<0.09){const ks=Object.keys(RES).filter(k=>RES[k].on.includes(t.t));if(ks.length)t.res=ks[RI(ks.length)]}
  if(isLand(t)&&t.t!=='mount'&&!t.res&&R()<0.025)t.hut=1}
 return map}

// ---------- game setup ----------
function newGame(nAI,seed){
 seed=seed||((Date.now()%1e9)|0);rng=mulberry(seed);
 let starts=null;for(let tries=0;tries<30&&!starts;tries++){
  const map=genMap(seed+tries*101);G={seed,turn:1,map,units:[],cities:[],civs:[],uid:1,cid:1,over:null,sel:null,log:[]};
  starts=findStarts(nAI+1);}
 for(let i=0;i<=nAI;i++){const C=CIVS[i];
  G.civs.push({id:i,name:C.name,leader:C.leader,col:C.col,ai:i>0,gold:10,sci:0,research:null,techs:[],cityNames:C.cities.slice(),nameIdx:0,alive:true,
   seen:new Uint8Array(W*H),vis:new Uint8Array(W*H),rate:0.6});
  const[c,r]=starts[i];addUnit(i,'settler',c,r);addUnit(i,'warrior',c,r);
  const n=nbrs(c,r).filter(([a,b])=>isLand(T(a,b))&&T(a,b).t!=='mount');const w=n[0]||[c,r];addUnit(i,'worker',w[0],w[1]);
  if(i>0)addUnit(i,'warrior',c,r);
  for(const[a,b]of ring(c,r,4))T(a,b).hut=0;}
 G.civs.forEach(cv=>{if(cv.ai)cv.research=pickResearchAI(cv)});
 updateVis();centreOn(G.units[0].c,G.units[0].r);selectNext();
 msg('Welcome, ruler of the Valdren! Found your capital with the Settler (press B or tap "Found City").');
 redraw();saveGame('auto');}
function findStarts(n){const cand=[];for(let r=2;r<H-2;r++)for(let c=2;c<W-2;c++){const t=T(c,r);if(!(t.t==='grass'||t.t==='plains'))continue;
  let s=0,land=0;for(const[a,b]of ring(c,r,2)){const u=T(a,b);const y=tileYield(u,null);s+=y.f*2+y.p+y.t*0.5;if(isLand(u))land++}if(land<12)continue;cand.push([c,r,s+R()*3])}
 cand.sort((a,b)=>b[2]-a[2]);const out=[];
 for(let md=14;md>=6&&out.length<n;md--){out.length=0;for(const p of cand){if(out.every(q=>dist(p[0],p[1],q[0],q[1])>=md))out.push(p);if(out.length===n)break}}
 return out.length===n?out:null}
function addUnit(civ,type,c,r,vet){const u={id:G.uid++,civ,type,c,r,mp:UNITS[type].m,hp:10,vet:!!vet,fort:0,task:null,goto:null,ai:null,sleep:0};G.units.push(u);return u}

// ---------- yields ----------
function tileYield(t,city){const b=TER[t.t];let f=b.f,p=b.p,tr=b.t;
 if(t.res){const s=RES[t.res];f+=s.f;p+=s.p;tr+=s.t}
 if(t.farm)f+=1;if(t.mine)p+=t.t==='hills'?2:1;if(t.road&&(t.t==='grass'||t.t==='plains'||t.t==='desert'))tr+=1;
 if(city&&(t.t==='coast'||t.t==='ocean')){if(city.b.harbour)f+=1;if(city.b.colossus)tr+=1}
 return{f,p,t:tr}}
function cityTiles(city){return ring(city.c,city.r,2).filter(([a,b])=>{const t=T(a,b);return(t.owner===-1||t.owner===city.civ)&&!(a===city.c&&b===city.r)&&!enemyUnitAt(a,b,city.civ)})}
function cityWork(city){
 const ts=cityTiles(city).filter(([a,b])=>{const k=idx(a,b);return!G.cities.some(o=>o!==city&&o.worked&&o.worked.includes(k))});
 const sc=ts.map(([a,b])=>{const y=tileYield(T(a,b),city);return{k:idx(a,b),y,s:y.f*3+y.p*2+y.t*1.2}}).sort((x,y)=>y.s-x.s);
 city.worked=sc.slice(0,city.pop).map(x=>x.k);
 const ct=tileYield(T(city.c,city.r),city);let f=ct.f+1,p=Math.max(1,ct.p),tr=ct.t+1;
 for(const x of sc.slice(0,city.pop)){f+=x.y.f;p+=x.y.p;tr+=x.y.t}
 if(city.b.temple){f+=1;p+=1}
 const cv=G.civs[city.civ];let sci=Math.round(tr*cv.rate),gold=tr-sci;
 if(city.b.library)sci=Math.round(sci*1.5);if(city.b.university)sci=Math.round(sci*1.5);if(city.b.market)gold=Math.round(gold*1.5);
 const settlers=G.units.filter(u=>u.home===city.id&&u.type==='settler').length;
 const fu=city.pop*2+settlers;
 city.y={f,p,t:tr,sci,gold,surplus:f-fu};return city.y}
const foodBox=c=>10+c.pop*6;
function cost(item){return item.k==='u'?UNITS[item.id].c:BLD[item.id].c}
function canBuild(city,item){const cv=G.civs[city.civ];
 if(item.k==='u'){const u=UNITS[item.id];if(u.tech&&!cv.techs.includes(u.tech))return false;if(item.id==='settler'&&city.pop<2&&city.prod<cost(item)-city.y?.p)return true;return true}
 const b=BLD[item.id];if(city.b[item.id])return false;if(b.tech&&!cv.techs.includes(b.tech))return false;
 if(item.id==='harbour'&&!nbrs(city.c,city.r).some(([a,b2])=>!isLand(T(a,b2))))return false;
 if(b.wonder&&G.cities.some(c=>c.b[item.id]||(c!==city&&c.civ===city.civ&&c.build&&c.build.id===item.id)))return false;
 return true}
function buildList(city){const L=[];for(const k in UNITS)if(canBuild(city,{k:'u',id:k}))L.push({k:'u',id:k});for(const k in BLD)if(canBuild(city,{k:'b',id:k}))L.push({k:'b',id:k});return L}
const itemName=it=>it.k==='u'?UNITS[it.id].n:BLD[it.id].n;

// ---------- cities ----------
function foundCity(u){const t=T(u.c,u.r);if(!isLand(t))return false;
 if(G.cities.some(c=>dist(c.c,c.r,u.c,u.r)<3)){if(!G.civs[u.civ].ai)msg('Too close to another city.');return false}
 const cv=G.civs[u.civ];const name=cv.cityNames[cv.nameIdx++%cv.cityNames.length]+(cv.nameIdx>cv.cityNames.length?' II':'');
 const city={id:G.cid++,civ:u.civ,c:u.c,r:u.r,name,pop:1,food:0,prod:0,build:{k:'u',id:'warrior'},b:{},capital:!G.cities.some(c=>c.civ===u.civ),founded:G.turn};
 if(city.capital)city.b.palace=1;
 G.cities.push(city);t.road=1;claim(city);killUnit(u);cityWork(city);
 if(!cv.ai){msg(`${name} founded!`);}
 return city}
function claim(city){for(const[a,b]of ring(city.c,city.r,2)){const t=T(a,b);if(t.owner===-1||dist(a,b,city.c,city.r)<=1)t.owner=city.civ}}
function cityAt(c,r){return G.cities.find(x=>x.c===c&&x.r===r)}
function processCity(city){
 const cv=G.civs[city.civ];const y=cityWork(city);cv.gold+=y.gold;cv.sci+=y.sci;
 city.food+=y.surplus;
 const cap=city.b.aqueduct?20:8;
 if(city.food>=foodBox(city)){if(city.pop<cap){city.food=city.b.granary?Math.floor(foodBox(city)/2):0;city.pop++;if(!cv.ai)msg(`${city.name} grows to size ${city.pop}.`)}else city.food=foodBox(city)}
 else if(city.food<0){if(city.pop>1){city.pop--;city.food=0;if(!cv.ai)msg(`${city.name} is starving!`)}else city.food=0}
 city.prod+=y.p;
 if(!city.build)city.build={k:'u',id:'warrior'};
 if(!canBuild(city,city.build)){city.build=cv.ai?aiChooseBuild(city):{k:'u',id:'warrior'}}
 const it=city.build;const c=cost(it);
 if(city.prod>=c){
  if(it.k==='u'){if(it.id==='settler'&&city.pop<2){/*wait*/}else{
    city.prod-=c;if(it.id==='settler')city.pop--;const u=addUnit(city.civ,it.id,city.c,city.r,city.b.barracks);u.home=city.id;
    if(!cv.ai)msg(`${city.name} completed ${UNITS[it.id].n}.`);
    if(cv.ai)city.build=aiChooseBuild(city);}}
  else{city.prod-=c;city.b[it.id]=1;if(!cv.ai)msg(`${city.name} completed ${BLD[it.id].n}.`);
   else if(BLD[it.id].wonder)msg(`The ${cv.name} have completed the ${BLD[it.id].n}!`);
   if(it.id==='observ'){endGame(city.civ,'science');}
   city.build=cv.ai?aiChooseBuild(city):{k:'u',id:'warrior'};if(!cv.ai&&!G.over)openCity(city,true)}}
}
function buyCost(city){const rem=Math.max(0,cost(city.build)-city.prod);return Math.ceil(rem*2+rem*rem/20)*(city.build.k==='b'&&BLD[city.build.id].wonder?2:1)}

// ---------- research ----------
const techCost=cv=>Math.round(18+cv.techs.length*cv.techs.length*1.6+cv.techs.length*10);
function availTechs(cv){return Object.keys(TECHS).filter(k=>!cv.techs.includes(k)&&TECHS[k].req.every(q=>cv.techs.includes(q)))}
function processResearch(cv){if(!cv.research){const a=availTechs(cv);if(!a.length)return;cv.research=cv.ai?pickResearchAI(cv):null;if(!cv.research){if(!cv.ai&&!G.techPromptShown){G.techPromptShown=1}return}}
 if(cv.sci>=techCost(cv)){cv.sci-=techCost(cv);learn(cv,cv.research);cv.research=cv.ai?pickResearchAI(cv):null;if(!cv.ai){G.wantTech=1}}}
function learn(cv,k){if(cv.techs.includes(k))return;cv.techs.push(k);if(!cv.ai)msg(`Discovered ${TECHS[k].n}! ${unlocksText(k)}`)}
function unlocksText(k){const a=[];for(const u in UNITS)if(UNITS[u].tech===k)a.push(UNITS[u].n);for(const b in BLD)if(BLD[b].tech===k)a.push(BLD[b].n);return a.length?'Unlocks: '+a.join(', '):''}
function pickResearchAI(cv){const a=availTechs(cv);if(!a.length)return null;const pref=['bronze','archery','pottery','alphabet','masonry','writing','currency','iron','riding','wheel','math','ceremony','feudal','construction','philosophy','chivalry','astronomy','gunpowder','metallurgy','seafaring'];
 a.sort((x,y)=>pref.indexOf(x)-pref.indexOf(y)+(R()-0.5)*4);return a[0]}

// ---------- units / movement ----------
const unitsAt=(c,r)=>G.units.filter(u=>u.c===c&&u.r===r);
function enemyUnitAt(c,r,civ){return G.units.find(u=>u.c===c&&u.r===r&&u.civ!==civ)}
function moveCost(u,c,r){const t=T(c,r);if(!isLand(t))return 99;const from=T(u.c,u.r);if(t.road&&from.road)return 1/3;return TER[t.t].mv}
function killUnit(u){const i=G.units.indexOf(u);if(i>=0)G.units.splice(i,1);if(G.sel===u)G.sel=null}
function findPath(u,tc,tr,maxN){// A*
 if(!isLand(T(tc,tr)))return null;const start=idx(u.c,u.r),goal=idx(tc,tr);const g=new Map([[start,0]]),came=new Map(),open=[[dist(u.c,u.r,tc,tr),start]];const cv=G.civs[u.civ];let n=0;
 while(open.length&&n++<(maxN||3000)){open.sort((a,b)=>a[0]-b[0]);const[,k]=open.shift();if(k===goal)break;const c=k%W,r=(k/W)|0;
  for(const[a,b]of nbrs(c,r)){const nk=idx(a,b);const t=T(a,b);if(!isLand(t))continue;if(!cv.ai&&!cv.seen[nk])continue;
   const e=enemyUnitAt(a,b,u.civ)||(cityAt(a,b)&&cityAt(a,b).civ!==u.civ);if(e&&nk!==goal)continue;
   const cst=(t.road&&T(c,r).road)?1/3:TER[t.t].mv;const ng=g.get(k)+cst;if(!g.has(nk)||ng<g.get(nk)){g.set(nk,ng);came.set(nk,k);open.push([ng+dist(a,b,tc,tr),nk])}}}
 if(!came.has(goal))return null;const p=[];let k=goal;while(k!==start){p.unshift([k%W,(k/W)|0]);k=came.get(k)}return p}
// returns 'moved','attack','blocked'
function stepTo(u,c,r){
 if(u.mp<=0)return'blocked';if(dist(u.c,u.r,c,r)!==1)return'blocked';
 const t=T(c,r);if(!isLand(t))return'blocked';
 const ec=cityAt(c,r);const eu=enemyUnitAt(c,r,u.civ);
 if(eu||(ec&&ec.civ!==u.civ)){
  if(UNITS[u.type].a===0)return'blocked';
  if(eu){attack(u,c,r);return'attack'}
  // empty enemy city: capture
 }
 const mc=moveCost(u,c,r);
 u.mp=mc>u.mp&&u.mp<UNITS[u.type].m?(R()<u.mp/mc?0:-1):Math.max(0,u.mp-mc);
 if(u.mp<0){u.mp=0;return'blocked'}
 u.c=c;u.r=r;u.fort=0;
 if(ec&&ec.civ!==u.civ)captureCity(ec,u.civ);
 if(t.hut)popHut(u,t);
 revealAround(u.civ,c,r,sight(u));
 return'moved'}
function sight(u){const t=T(u.c,u.r);return(t.t==='hills'||t.t==='mount')?2:1}
function popHut(u,t){t.hut=0;const cv=G.civs[u.civ];const roll=R();let m;
 if(roll<0.35){const g=25+RI(40);cv.gold+=g;m=`Ancient ruins: found ${g} gold!`}
 else if(roll<0.6){const a=availTechs(cv);if(a.length){const k=a[RI(a.length)];learn(cv,k);if(cv.research===k)cv.research=null;m=cv.ai?null:'Ancient scrolls reveal a technology!'}else{cv.gold+=30;m='Found 30 gold.'}}
 else if(roll<0.85){const typ=cv.techs.includes('riding')?'horse':'archer';addUnit(u.civ,R()<.5?typ:'warrior',u.c,u.r);m='Friendly tribesmen join your cause!'}
 else{const g=15;cv.gold+=g;m='Abandoned village: 15 gold.'}
 if(!cv.ai&&m)msg(m)}
function unitStr(u,att,tc,tr){const s=UNITS[u.type];let v=att?s.a:s.d;if(u.vet)v*=1.5;
 if(!att){const t=T(u.c,u.r);v*=TER[t.t].d;if(u.fort)v*=1.5;const city=cityAt(u.c,u.r);if(city){v*=1.25;}}
 return v*(0.4+0.6*u.hp/10)}
function combatOdds(a,c,r){const d=bestDefender(c,r,a.civ);if(!d)return 1;let A=unitStr(a,true),D=unitStr(d,false);
 const city=cityAt(c,r);if(city&&city.b.walls&&!UNITS[a.type].siege)D*=2;if(UNITS[d.type].bonusVsMounted&&UNITS[a.type].mounted)D*=2;
 // simulate win prob roughly
 const p=A/(A+D);let win=0;for(let s=0;s<200;s++){let ha=a.hp,hd=d.hp;while(ha>0&&hd>0){if(R()<p)hd-=3;else ha-=3}if(hd<=0)win++}return win/200}
function bestDefender(c,r,attCiv){const L=G.units.filter(u=>u.c===c&&u.r===r&&u.civ!==attCiv);if(!L.length)return null;return L.sort((x,y)=>unitStr(y,false)-unitStr(x,false))[0]}
function attack(a,c,r){const d=bestDefender(c,r,a.civ);if(!d)return;
 const city=cityAt(c,r);let A=unitStr(a,true),D=unitStr(d,false);if(city&&city.b.walls&&!UNITS[a.type].siege)D*=2;if(UNITS[d.type].bonusVsMounted&&UNITS[a.type].mounted)D*=2;
 const p=A/(A+D);while(a.hp>0&&d.hp>0){if(R()<p)d.hp-=3;else a.hp-=3}
 a.mp=0;a.fort=0;const pl=a.civ===0||d.civ===0;
 G.fx={c,r,t:performance.now()};
 if(d.hp<=0){
  if(!city){for(const x of unitsAt(c,r).filter(x=>x.civ===d.civ))killUnit(x)}else killUnit(d);
  if(R()<0.25)a.vet=true;a.hp=Math.max(1,a.hp);
  if(pl)msg(a.civ===0?`Your ${UNITS[a.type].n} defeated the ${G.civs[d.civ].name} ${UNITS[d.type].n}.`:`Your ${UNITS[d.type].n} was destroyed by the ${G.civs[a.civ].name} ${UNITS[a.type].n}!`);
  if(city&&!enemyUnitAt(c,r,a.civ)&&city.civ!==a.civ&&UNITS[a.type].a>0&&!UNITS[a.type].siege){a.c=c;a.r=r;captureCity(city,a.civ)}
 }else{killUnit(a);d.hp=Math.max(1,d.hp);if(R()<0.25)d.vet=true;
  if(pl)msg(a.civ===0?`Your ${UNITS[a.type].n} was defeated attacking the ${G.civs[d.civ].name}.`:`Your ${UNITS[d.type].n} repelled a ${G.civs[a.civ].name} ${UNITS[a.type].n}!`)}
}
function captureCity(city,civ){const old=city.civ;const oc=G.civs[old],nc=G.civs[civ];
 for(const u of G.units.filter(u=>u.c===city.c&&u.r===city.r&&u.civ===old))killUnit(u);
 const loot=Math.floor(oc.gold*0.3);oc.gold-=loot;nc.gold+=loot;
 if(city.pop>1)city.pop--;else if(G.cities.filter(c=>c.civ===old).length>0&&city.pop<=1&&!city.capital&&false){}
 city.civ=civ;city.build={k:'u',id:'warrior'};city.prod=0;delete city.b.palace;city.capital=false;
 for(const k of Object.keys(city.b))if(R()<0.3&&!BLD[k]?.wonder)delete city.b[k];
 for(const[a,b]of ring(city.c,city.r,2)){const t=T(a,b);if(t.owner===old)t.owner=civ}
 if(old===0)msg(`${city.name} has been captured by the ${nc.name}!`);else if(civ===0)msg(`You captured ${city.name}! (+${loot} gold)`);
 if(!G.cities.some(c=>c.civ===old)){oc.alive=false;for(const u of G.units.filter(u=>u.civ===old))killUnit(u);msg(`The ${oc.name} civilisation has been destroyed!`)}
 if(civ===0&&!G.over)openCity(city,true);
 checkEnd()}
function checkEnd(){if(G.over)return;const pc=G.cities.some(c=>c.civ===0);
 if(!pc&&(G.turn>1&&!G.units.some(u=>u.civ===0&&u.type==='settler'))){endGame(-1,'defeat');return}
 if(G.civs.slice(1).every(c=>!c.alive||!G.cities.some(x=>x.civ===c.id)&&G.turn>5&&!G.units.some(u=>u.civ===c.id&&u.type==='settler'))){endGame(0,'conquest')}}
function score(civ){return G.cities.filter(c=>c.civ===civ).reduce((s,c)=>s+c.pop*2+Object.keys(c.b).filter(k=>BLD[k]?.wonder).length*10,0)+G.civs[civ].techs.length*3}
function endGame(winner,how){G.over={winner,how};let t,b;
 if(how==='science'){t=winner===0?'Victory of Knowledge!':'Defeat';b=winner===0?'Your Star Vault ushers in an age of enlightenment. The world follows your lead.':`The ${G.civs[winner].name} completed the Star Vault and lead the world into a new age.`}
 else if(how==='conquest'){t='Total Conquest!';b='Every rival empire has fallen to the Valdren.'}
 else if(how==='defeat'){t='Your Empire Has Fallen';b='The Valdren are no more.'}
 else{const s=G.civs.map(c=>score(c.id));const best=s.indexOf(Math.max(...s));t=best===0?'Victory by Score!':'Time is up';b=`Turn limit reached. Scores: `+G.civs.map((c,i)=>`${c.name} ${s[i]}`).join(', ')}
 modal(`<h2>${t}</h2><p>${b}</p><p>Turn ${G.turn}. Your score: ${score(0)}</p><div class="row"><button onclick="closeModal()">Keep looking</button><button onclick="menu()">New game / menu</button></div>`)}

// ---------- worker tasks ----------
function workerOptions(u){const t=T(u.c,u.r);const cv=G.civs[u.civ];const o=[];if(cityAt(u.c,u.r))return o;
 if(!t.road)o.push(['road','Build Road',2]);
 if(!t.farm&&!t.mine&&(t.t==='grass'||t.t==='plains'||t.t==='desert'||t.t==='tundra'))o.push(['farm','Irrigate (farm)',3]);
 if(!t.mine&&!t.farm&&(t.t==='hills'||t.t==='mount'))o.push(['mine','Build Mine',4]);
 if(t.t==='forest')o.push(['clear','Clear Forest',4]);
 return o}
function doWork(u){if(!u.task)return;u.task.left--;u.mp=0;if(u.task.left<=0){const t=T(u.c,u.r);const k=u.task.k;
  if(k==='road')t.road=1;else if(k==='farm')t.farm=1;else if(k==='mine')t.mine=1;else if(k==='clear')t.t='plains';u.task=null;
  if(u.civ===0)msg(`Worker finished: ${k==='farm'?'irrigation':k}.`)}}

// ---------- visibility ----------
function revealAround(civ,c,r,rad){const cv=G.civs[civ];for(const[a,b]of ring(c,r,rad)){const k=idx(a,b);cv.seen[k]=1;cv.vis[k]=1}}
function updateVis(){for(const cv of G.civs){cv.vis.fill(0)}
 for(const u of G.units)revealAround(u.civ,u.c,u.r,sight(u));for(const c of G.cities)revealAround(c.civ,c.c,c.r,2)}

// ---------- AI ----------
function aiChooseBuild(city){const cv=G.civs[city.civ];const mine=G.cities.filter(c=>c.civ===city.civ);
 const def=G.units.filter(u=>u.civ===city.civ&&u.c===city.c&&u.r===city.r&&UNITS[u.type].a>0).length;
 const settlers=G.units.filter(u=>u.civ===city.civ&&u.type==='settler').length;
 const workers=G.units.filter(u=>u.civ===city.civ&&u.type==='worker').length;
 const best=(list)=>{for(const k of list)if(canBuild(city,{k:'u',id:k}))return{k:'u',id:k}};
 const defU=best(['musket','pike','spear','archer','warrior']);const offU=best(['cannon','knight','catapult','sword','chariot','horse','archer','warrior']);
 if(def<1)return defU;
 if(mine.length<6&&settlers<2&&city.pop>=2&&G.turn<160)return{k:'u',id:'settler'};
 if(workers<mine.length*0.6)return{k:'u',id:'worker'};
 if(def<2&&mine.length>1)return defU;
 const bl=['walls','granary','library','temple','market','barracks','harbour','aqueduct','university','colossus','observ'].filter(k=>canBuild(city,{k:'b',id:k}));
 if(bl.includes('observ')&&city.capital)return{k:'b',id:'observ'};
 if(R()<0.45&&bl.length)return{k:'b',id:bl[RI(Math.min(3,bl.length))]};
 return R()<0.75?offU:defU}
function aiCityScore(c,r,civ){const t=T(c,r);if(!isLand(t)||t.t==='mount')return-1;if(G.cities.some(x=>dist(x.c,x.r,c,r)<4))return-1;if(t.owner!==-1&&t.owner!==civ)return-1;
 let s=0;for(const[a,b]of ring(c,r,2)){const y=tileYield(T(a,b),null);s+=y.f*2+y.p+y.t*0.7}if(nbrs(c,r).some(([a,b])=>!isLand(T(a,b))))s+=3;return s}
function aiTurn(cv){
 const myCities=G.cities.filter(c=>c.civ===cv.id);
 // tax: if low gold, more gold
 for(const u of G.units.filter(u=>u.civ===cv.id)){if(!G.units.includes(u))continue;let guard=0;
  while(u.mp>0&&G.units.includes(u)&&guard++<6){if(!aiUnit(u,cv,myCities))break}}
 // AI buys defenders when threatened
 for(const c of myCities){const threat=G.units.some(u=>u.civ!==cv.id&&dist(u.c,u.r,c.c,c.r)<=2&&UNITS[u.type].a>0);
  if(threat&&c.build.k==='u'&&buyCost(c)<=cv.gold){cv.gold-=buyCost(c);c.prod=cost(c.build)}}}
function aiUnit(u,cv,myCities){const s=UNITS[u.type];
 if(u.type==='settler'){
  if(!myCities.length||(u.ai&&u.ai.c===u.c&&u.ai.r===u.r)){if(aiCityScore(u.c,u.r,u.civ)>0||!myCities.length){if(foundCity(u))return false}}
  if(!u.ai||aiCityScore(u.ai.c,u.ai.r,u.civ)<0){let best=null,bs=0;for(const[a,b]of ring(u.c,u.r,7)){const sc=aiCityScore(a,b,u.civ)-dist(u.c,u.r,a,b)*1.5;if(sc>bs){bs=sc;best=[a,b]}}
   if(!best){u.mp=0;return false}u.ai={c:best[0],r:best[1]}}
  return aiGo(u,u.ai.c,u.ai.r)}
 if(u.type==='worker'){if(u.task){u.mp=0;return false}
  const city=myCities.find(c=>dist(c.c,c.r,u.c,u.r)<=2);const opts=workerOptions(u);
  if(city&&opts.length&&T(u.c,u.r).owner===u.civ){const pick=opts.find(o=>o[0]==='mine')||opts.find(o=>o[0]==='farm')||opts[0];u.task={k:pick[0],left:pick[2]};doWork(u);return false}
  // move to a random tile near a city
  const tc=myCities.length?myCities[RI(myCities.length)]:null;if(!tc){u.mp=0;return false}
  const cand=ring(tc.c,tc.r,2).filter(([a,b])=>isLand(T(a,b))&&!cityAt(a,b)&&!unitsAt(a,b).length&&(()=>{const t=T(a,b);return!t.road||(!t.farm&&!t.mine&&t.t!=='forest')})());
  if(!cand.length){u.mp=0;return false}const p=cand[RI(cand.length)];return aiGo(u,p[0],p[1])}
 // military
 // attack adjacent weak enemy
 for(const[a,b]of nbrs(u.c,u.r)){if(enemyUnitAt(a,b,u.civ)&&s.a>0){if(combatOdds(u,a,b)>0.6){stepTo(u,a,b);return true}}
  const ec=cityAt(a,b);if(ec&&ec.civ!==u.civ&&!enemyUnitAt(a,b,u.civ)&&s.a>0&&!s.siege){stepTo(u,a,b);return true}}
 const home=myCities.slice().sort((x,y)=>dist(x.c,x.r,u.c,u.r)-dist(y.c,y.r,u.c,u.r))[0];
 // garrison
 if(home){const g=G.units.filter(x=>x.civ===u.civ&&x.c===home.c&&x.r===home.r&&UNITS[x.type].a>0);
  const need=G.turn<25?1:2;
  if(u.c===home.c&&u.r===home.r&&g.length<=need&&(s.d>=s.a||g.length<1)){u.fort=1;u.mp=0;return false}
  if(!u.ai&&g.length<need&&dist(u.c,u.r,home.c,home.r)>0&&s.d>=s.a){u.ai={def:home.id}}}
 if(u.ai&&u.ai.def){const c=G.cities.find(x=>x.id===u.ai.def&&x.civ===u.civ);if(c){if(u.c===c.c&&u.r===c.r){u.fort=1;u.mp=0;return false}return aiGo(u,c.c,c.r)}u.ai=null}
 if(u.hp<5&&home){if(u.c===home.c&&u.r===home.r){u.mp=0;return false}return aiGo(u,home.c,home.r)}
 // offensive after turn 30: target nearest enemy city
 const army=G.units.filter(x=>x.civ===u.civ&&UNITS[x.type].a>=2).length;
 if(G.turn>=30&&army>=3&&s.a>0){let tgt=null,bd=99;for(const c of G.cities)if(c.civ!==u.civ&&G.civs[cv.id].seen[idx(c.c,c.r)]||c.civ!==u.civ&&G.turn>60){const d=dist(c.c,c.r,u.c,u.r);if(d<bd){bd=d;tgt=c}}
  if(tgt&&bd<=18){if(bd===1){if(combatOdds(u,tgt.c,tgt.r)>0.3||u.hp>=9&&R()<0.4){stepTo(u,tgt.c,tgt.r);return true}u.fort=1;u.mp=0;return false}return aiGo(u,tgt.c,tgt.r)}}
 // explore
 if(!u.ex||(u.ex.c===u.c&&u.ex.r===u.r)||R()<0.1){let b=null;for(let i=0;i<20;i++){const a=RI(W),rr=RI(H);if(isLand(T(a,rr))&&!cv.seen[idx(a,rr)]&&dist(a,rr,u.c,u.r)<12){b=[a,rr];break}}
  if(!b){if(home&&G.turn<30){if(u.c===home.c&&u.r===home.r){u.fort=1;u.mp=0;return false}return aiGo(u,home.c,home.r)}u.mp=0;return false}u.ex={c:b[0],r:b[1]}}
 return aiGo(u,u.ex.c,u.ex.r)}
function aiGo(u,c,r){const p=findPath(u,c,r,1500);if(!p||!p.length){u.mp=0;u.ex=null;return false}const[a,b]=p[0];
 const e=enemyUnitAt(a,b,u.civ);if(e&&(UNITS[u.type].a===0||combatOdds(u,a,b)<0.45)){u.mp=0;return false}
 const res=stepTo(u,a,b);return res!=='blocked'}

// ---------- turn flow ----------
function endTurn(){if(G.over&&G.over.how!=='keep'){}
 if(G.busy)return;G.busy=1;
 const p=G.civs[0];
 // finish player auto moves (goto)
 for(const u of G.units.filter(u=>u.civ===0)){if(u.task)doWork(u)}
 for(const c of G.cities.filter(c=>c.civ===0))processCity(c);processResearch(p);
 for(const cv of G.civs.slice(1)){if(!cv.alive)continue;
  for(const u of G.units.filter(u=>u.civ===cv.id))if(u.task)doWork(u);
  aiTurn(cv);for(const c of G.cities.filter(c=>c.civ===cv.id))processCity(c);processResearch(cv);if(cv.gold>150&&R()<.3){const c=G.cities.find(c=>c.civ===cv.id);if(c&&buyCost(c)<cv.gold){cv.gold-=buyCost(c);c.prod=cost(c.build)}}}
 G.turn++;
 for(const u of G.units){u.mp=UNITS[u.type].m;const inCity=cityAt(u.c,u.r)&&cityAt(u.c,u.r).civ===u.civ;if(u.hp<10&&(u.fort||inCity||u.restedLast))u.hp=Math.min(10,u.hp+(inCity?3:1));}
 updateVis();checkEnd();
 if(!G.over&&G.turn>300)endGame(null,'score');
 // player gotos
 for(const u of G.units.filter(u=>u.civ===0&&u.goto)){runGoto(u)}
 updateVis();
 G.busy=0;G.sel=null;selectNext();
 if(G.wantTech||(!p.research&&availTechs(p).length&&G.cities.some(c=>c.civ===0))){G.wantTech=0;if(!G.over)openTech()}
 saveGame('auto');redraw();}
function runGoto(u){let g=0;while(u.goto&&u.mp>0&&g++<10){if(u.c===u.goto.c&&u.r===u.goto.r){u.goto=null;break}
  const p=findPath(u,u.goto.c,u.goto.r);if(!p){u.goto=null;break}const[a,b]=p[0];if(enemyUnitAt(a,b,0)||(cityAt(a,b)&&cityAt(a,b).civ!==0)){u.goto=null;break}
  if(stepTo(u,a,b)!=='moved'){break}}
 if(u.goto&&u.c===u.goto.c&&u.r===u.goto.r)u.goto=null}
function needsOrders(u){return u.civ===0&&u.mp>0&&!u.fort&&!u.task&&!u.goto&&!u.sleep}
function selectNext(){const L=G.units.filter(needsOrders);const cur=G.sel?L.indexOf(G.sel):-1;const u=L[(cur+1)%L.length]||null;
 if(L.length){select(L[cur+1<L.length?cur+1:0]);}else{G.sel=null;updatePanel()}
 $('bEnd').classList.toggle('ready',!L.length);}
function select(u){G.sel=u;G.selCity=null;if(u&&!onScreen(u.c,u.r))centreOn(u.c,u.r);updatePanel();redraw()}

// ---------- rendering ----------
const cv=$('map'),ctx=cv.getContext('2d');const mini=$('mini'),mctx=mini.getContext('2d');
let cam={x:0,y:0,s:30};let DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);cv.width=innerWidth*DPR;cv.height=innerHeight*DPR;redraw()}
function hexCenter(c,r){return[cam.s*SQ3*(c+0.5*(r&1))-cam.x,cam.s*1.5*r-cam.y]}
function pixToHex(px,py){px+=cam.x;py+=cam.y;const q=(SQ3/3*px-py/3)/cam.s,rr=(2/3*py)/cam.s;let x=q,z=rr,y=-x-z;let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);
 const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;const r=rz,c=rx+(r-(r&1))/2;return[c,r]}
function centreOn(c,r){cam.x=cam.s*SQ3*(c+0.5*(r&1))-innerWidth/2;cam.y=cam.s*1.5*r-innerHeight/2;clampCam()}
function clampCam(){const mw=cam.s*SQ3*(W+.5),mh=cam.s*1.5*H;cam.x=Math.max(-innerWidth/2,Math.min(mw-innerWidth/2,cam.x));cam.y=Math.max(-innerHeight/2,Math.min(mh-innerHeight/2,cam.y))}
function onScreen(c,r){const[x,y]=hexCenter(c,r);return x>60&&y>80&&x<innerWidth-230&&y<innerHeight-160}
function hexPath(x,y,s){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);ctx.lineTo(x+s*Math.cos(a),y+s*Math.sin(a))}ctx.closePath()}
let rq=0;function redraw(){if(!rq){rq=requestAnimationFrame(()=>{rq=0;draw()})}}
function draw(){if(!G)return;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#05070b';ctx.fillRect(0,0,innerWidth,innerHeight);
 const me=G.civs[0];const s=cam.s;
 const r0=Math.max(0,Math.floor((cam.y-s)/(1.5*s))),r1=Math.min(H-1,Math.ceil((cam.y+innerHeight+s)/(1.5*s)));
 const c0=Math.max(0,Math.floor((cam.x-s*2)/(SQ3*s))),c1=Math.min(W-1,Math.ceil((cam.x+innerWidth+s)/(SQ3*s)));
 for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const k=idx(c,r);if(!me.seen[k])continue;const t=G.map[k];const[x,y]=hexCenter(c,r);
  hexPath(x,y,s+0.6);ctx.fillStyle=TER[t.t].c;ctx.fill();drawFeature(t,x,y,s);
  if(t.owner>=0){hexPath(x,y,s-2);ctx.strokeStyle=G.civs[t.owner].col+'88';ctx.lineWidth=2;ctx.stroke()}
  if(!me.vis[k]){hexPath(x,y,s+0.6);ctx.fillStyle='rgba(0,0,0,.42)';ctx.fill()}}
 // roads
 ctx.strokeStyle='#6b4a2a';ctx.lineWidth=Math.max(1.5,s/10);
 for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const t=T(c,r);if(!t.road||!me.seen[idx(c,r)])continue;const[x,y]=hexCenter(c,r);
  for(const[a,b]of nbrs(c,r)){if(T(a,b).road&&(a>c||b>r)){const[x2,y2]=hexCenter(a,b);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}}}
 // worked tiles of selected city
 if(G.selCity){for(const k of G.selCity.worked||[]){const[x,y]=hexCenter(k%W,(k/W)|0);hexPath(x,y,s-4);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([])}}
 // cities
 for(const city of G.cities){if(!me.seen[idx(city.c,city.r)])continue;const[x,y]=hexCenter(city.c,city.r);const col=G.civs[city.civ].col;
  ctx.fillStyle='#222';ctx.fillRect(x-s*.55,y-s*.45,s*1.1,s*.9);ctx.fillStyle=col;ctx.fillRect(x-s*.5,y-s*.4,s,s*.8);
  ctx.fillStyle='#fff8';for(let i=0;i<3;i++)ctx.fillRect(x-s*.4+i*s*.28,y-s*.25-(i===1?s*.12:0),s*.2,s*.45+(i===1?s*.12:0));
  if(city.b.walls){ctx.strokeStyle='#ddd';ctx.lineWidth=2;ctx.strokeRect(x-s*.62,y-s*.52,s*1.24,s*1.04)}
  ctx.font=`bold ${Math.max(10,s*.42)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
  const lbl=`${city.pop} ${city.name}`;const w=ctx.measureText(lbl).width+10;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x-w/2,y+s*.55,w,s*.55);ctx.fillStyle=col;ctx.fillText(lbl,x,y+s*.83);
  if(city.capital){ctx.fillStyle='#fd5';ctx.fillText('★',x+s*.5,y-s*.5)}}
 // units (one per tile, top = selected or best)
 const drawn=new Set();const order=G.units.slice().sort((a,b)=>(a===G.sel)-(b===G.sel));
 for(let i=order.length-1;i>=0;i--){const u=order[i];const k=idx(u.c,u.r);if(drawn.has(k))continue;if(u.civ!==0&&!me.vis[k])continue;drawn.add(k);
  const n=unitsAt(u.c,u.r).length;const[x,y]=hexCenter(u.c,u.r);drawUnit(u,x,y-(cityAt(u.c,u.r)?s*.35:0),s,n)}
 if(G.sel&&G.units.includes(G.sel)){const[x,y]=hexCenter(G.sel.c,G.sel.r);hexPath(x,y,s-1);ctx.strokeStyle='#ffef5a';ctx.lineWidth=3;ctx.stroke();
  if(G.sel.goto){const p=findPath(G.sel,G.sel.goto.c,G.sel.goto.r);if(p)drawPath(G.sel,p)}}
 if(G.hoverPath&&G.sel)drawPath(G.sel,G.hoverPath);
 if(G.fx&&performance.now()-G.fx.t<400){const[x,y]=hexCenter(G.fx.c,G.fx.r);ctx.fillStyle='rgba(255,120,40,.6)';hexPath(x,y,s*.7);ctx.fill();redraw()}
 drawMini();updateTop()}
function drawPath(u,p){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();let[x,y]=hexCenter(u.c,u.r);ctx.moveTo(x,y);for(const[a,b]of p){[x,y]=hexCenter(a,b);ctx.lineTo(x,y)}ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fillStyle='#fff';ctx.fill()}
function drawFeature(t,x,y,s){ctx.lineWidth=1;
 if(t.t==='forest'){ctx.fillStyle='#1d4a1d';for(const[dx,dy]of[[-.35,.1],[.3,.15],[0,-.3]]){ctx.beginPath();ctx.moveTo(x+dx*s,y+(dy-.28)*s);ctx.lineTo(x+(dx-.2)*s,y+(dy+.15)*s);ctx.lineTo(x+(dx+.2)*s,y+(dy+.15)*s);ctx.fill()}}
 else if(t.t==='hills'){ctx.strokeStyle='#5d5230';ctx.lineWidth=2;for(const[dx,dy]of[[-.3,.15],[.25,-.1]]){ctx.beginPath();ctx.arc(x+dx*s,y+dy*s+.2*s,s*.28,Math.PI*1.1,Math.PI*1.9);ctx.stroke()}}
 else if(t.t==='mount'){ctx.fillStyle='#544c48';ctx.beginPath();ctx.moveTo(x-s*.6,y+s*.35);ctx.lineTo(x-s*.1,y-s*.5);ctx.lineTo(x+s*.4,y+s*.35);ctx.fill();ctx.fillStyle='#eee';ctx.beginPath();ctx.moveTo(x-s*.1,y-s*.5);ctx.lineTo(x-s*.25,y-s*.25);ctx.lineTo(x+s*.05,y-s*.25);ctx.fill()}
 else if(t.t==='desert'){ctx.fillStyle='#c4ad65';ctx.fillRect(x-s*.3,y+s*.1,s*.6,s*.06)}
 if(t.farm){ctx.strokeStyle='#e8e070';ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*s*.15,y+s*.25);ctx.lineTo(x+i*s*.15,y+s*.55);ctx.stroke()}}
 if(t.mine){ctx.fillStyle='#222';ctx.fillRect(x+s*.2,y+s*.2,s*.22,s*.18)}
 if(t.res&&s>16){const col={wheat:'#f5d76e',horses:'#8b5a2b',gold:'#ffd700',fish:'#bfe6ff',iron:'#9aa',gems:'#e055ff',oasis:'#4fd1c5'}[t.res];
  ctx.beginPath();ctx.arc(x-s*.42,y-s*.35,s*.15,0,7);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke()}
 if(t.hut){ctx.fillStyle='#d9b38c';ctx.beginPath();ctx.moveTo(x-s*.25,y+s*.1);ctx.lineTo(x,y-s*.2);ctx.lineTo(x+s*.25,y+s*.1);ctx.fill();ctx.fillStyle='#6b4a2a';ctx.fillRect(x-s*.18,y+s*.1,s*.36,s*.2)}}
function drawUnit(u,x,y,s,n){const col=G.civs[u.civ].col;const R2=s*.52;
 ctx.beginPath();ctx.arc(x,y,R2,0,7);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.arc(x,y,R2-2,0,7);ctx.fillStyle=col;ctx.fill();
 if(u.fort){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x-R2,y-R2,R2*2,R2*2)}
 ctx.fillStyle='#000';ctx.font=`bold ${Math.max(9,s*.42)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(UNITS[u.type].sym,x,y+1);
 // hp bar
 ctx.fillStyle='#300';ctx.fillRect(x-R2,y+R2+1,R2*2,3);ctx.fillStyle=u.hp>6?'#3e3':u.hp>3?'#ec3':'#e33';ctx.fillRect(x-R2,y+R2+1,R2*2*u.hp/10,3);
 if(n>1){ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(9,s*.32)}px system-ui`;ctx.fillText(n,x+R2,y-R2)}
 if(u.vet){ctx.fillStyle='#fd5';ctx.fillText('★',x-R2,y-R2)}
 if(u.civ===0&&u.mp<=0){ctx.beginPath();ctx.arc(x,y,R2,0,7);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fill()}}
function drawMini(){const w=mini.width,h=mini.height,sx=w/(W+.5),sy=h/H;const me=G.civs[0];mctx.fillStyle='#000';mctx.fillRect(0,0,w,h);
 for(let r=0;r<H;r++)for(let c=0;c<W;c++){const k=idx(c,r);if(!me.seen[k])continue;const t=G.map[k];mctx.fillStyle=t.owner>=0?G.civs[t.owner].col:TER[t.t].c;mctx.fillRect((c+.5*(r&1))*sx,r*sy,sx+.5,sy+.5)}
 for(const c of G.cities)if(me.seen[idx(c.c,c.r)]){mctx.fillStyle='#fff';mctx.fillRect((c.c+.5*(c.r&1))*sx-1,c.r*sy-1,sx+2,sy+2)}
 const vx=cam.x/(cam.s*SQ3)*sx,vy=cam.y/(cam.s*1.5)*sy,vw=innerWidth/(cam.s*SQ3)*sx,vh=innerHeight/(cam.s*1.5)*sy;mctx.strokeStyle='#fff';mctx.strokeRect(vx,vy,vw,vh)}
function updateTop(){const p=G.civs[0];let inc=0,sci=0;for(const c of G.cities)if(c.civ===0&&c.y){inc+=c.y.gold;sci+=c.y.sci}
 $('tTurn').textContent=`Turn ${G.turn}`;$('tGold').textContent=`💰 ${p.gold} (+${inc})`;$('tSci').textContent=`🔬 +${sci}`;
 $('tRes').textContent=p.research?`Researching ${TECHS[p.research].n} ${p.sci}/${techCost(p)}`:'Choose research…'}

// ---------- panel ----------
function btn(label,fn,dis){return`<button ${dis?'disabled':''} onclick="${fn.replace(/"/g,"&quot;")}">${label}</button>`}
function updatePanel(){const P=$('panel');const u=G.sel;
 if(u&&G.units.includes(u)){const s=UNITS[u.type];const t=T(u.c,u.r);let h=`<h3>${G.civs[u.civ].name} ${s.n}${u.vet?' ★':''}</h3><div>A${s.a} D${s.d} · Moves ${+u.mp.toFixed(1)}/${s.m} · HP ${u.hp}/10${u.fort?' · Fortified':''}${u.task?` · Working (${u.task.k}, ${u.task.left})`:''}</div><div style="opacity:.75">${TER[t.t].n}${t.res?' · '+RES[t.res].n:''}${t.road?' · road':''}${t.farm?' · farm':''}${t.mine?' · mine':''}</div><div class="btns">`;
  if(u.civ===0){
   if(u.type==='settler')h+=btn('Found City (B)','act("found")');
   if(u.type==='worker')for(const o of workerOptions(u))h+=btn(`${o[1]} (${o[2]})`,`act("${o[0]}")`);
   if(s.a>0||s.d>0)h+=btn('Fortify (F)','act("fort")');
   h+=btn('Skip (Space)','act("skip")');h+=btn('Sleep (S)','act("sleep")');
   if(u.goto)h+=btn('Cancel move','act("cancel")');
   const st=unitsAt(u.c,u.r).filter(x=>x.civ===0);if(st.length>1)h+=btn(`Cycle stack (${st.length})`,'act("cycle")');
   if(cityAt(u.c,u.r))h+=btn('Open city','openCity(cityAt(G.sel.c,G.sel.r))');
   h+=btn('Disband','act("disband")');}
  P.innerHTML=h+'</div>';P.style.display='block';return}
 P.style.display='none'}
function act(a){const u=G.sel;if(!u)return;
 if(a==='found'){if(foundCity(u)){G.sel=null;const c=G.cities[G.cities.length-1];updateVis();openCity(c,true);G.pendingTech=!G.civs[0].research}}
 else if(a==='fort'){u.fort=1;u.goto=null;}
 else if(a==='skip'){u.sk=G.turn;}
 else if(a==='sleep'){u.sleep=1;u.goto=null}
 else if(a==='cancel'){u.goto=null}
 else if(a==='cycle'){const st=unitsAt(u.c,u.r).filter(x=>x.civ===0);select(st[(st.indexOf(u)+1)%st.length]);return}
 else if(a==='disband'){killUnit(u)}
 else{const o=workerOptions(u).find(x=>x[0]===a);if(o){u.task={k:o[0],left:o[2]};u.mp=0}}
 if(a==='skip'){const L=G.units.filter(needsOrders).filter(x=>x.sk!==G.turn);if(L.length)select(L[0]);else{G.sel=null;updatePanel();$('bEnd').classList.add('ready')}}
 else afterAction();redraw()}
function afterAction(){checkEnd();if(G.sel&&G.units.includes(G.sel)&&needsOrders(G.sel)){updatePanel();redraw();return}
 const L=G.units.filter(needsOrders);if(L.length)select(L[0]);else{G.sel=null;updatePanel();$('bEnd').classList.add('ready')}redraw()}

// ---------- modals ----------
function modal(h){$('mbox').innerHTML=h;$('modal').classList.remove('hide')}
function closeModal(){$('modal').classList.add('hide');if(G){G.selCity=null;if(G.pendingTech&&!G.civs[0].research){G.pendingTech=0;openTech();return}}redraw()}
$('modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal')closeModal()});
function openCity(city,auto){G.selCity=city;cityWork(city);const y=city.y;const cvv=G.civs[city.civ];const mine=city.civ===0;
 let h=`<h2 style="color:${cvv.col}">${city.name}${city.capital?' ★':''} <small>(size ${city.pop})</small></h2>`;
 h+=`<div>🌾 Food ${y.f} (surplus ${y.surplus>=0?'+':''}${y.surplus}) · growth ${city.food}/${foodBox(city)}${y.surplus>0?` in ${Math.ceil((foodBox(city)-city.food)/y.surplus)} turns`:''}</div>`;
 h+=`<div>⚒ Production ${y.p} · 💱 Trade ${y.t} → 🔬 ${y.sci} science, 💰 ${y.gold} gold</div>`;
 h+=`<div>Buildings: ${Object.keys(city.b).filter(k=>BLD[k]).map(k=>BLD[k].n).join(', ')||'none'}</div>`;
 if(mine){const it=city.build;const c=cost(it);const left=Math.max(0,c-city.prod);
  h+=`<h3 style="margin-top:10px">Building: ${itemName(it)} ${city.prod}/${c}${y.p>0?` (${Math.ceil(left/y.p)} turns)`:''}</h3>`;
  const bc=buyCost(city);h+=`<div class="row">${btn(`Buy now for ${bc} gold`,`buy(${city.id})`,bc>cvv.gold||left===0)}${btn('Close','closeModal()')}</div>`;
  h+=`<h3>Change production</h3><div class="blist">`;
  for(const it2 of buildList(city)){const isU=it2.k==='u';const d=isU?`A${UNITS[it2.id].a} D${UNITS[it2.id].d} M${UNITS[it2.id].m}`:BLD[it2.id].desc;const turns=y.p>0?Math.ceil(Math.max(0,cost(it2)-city.prod)/y.p):'∞';
   h+=`<button onclick="setBuild(${city.id},'${it2.k}','${it2.id}')" style="${it2.k===it.k&&it2.id===it.id?'outline:2px solid #fd5':''}">${isU?'🛡':'🏛'} <b>${itemName(it2)}</b> · ${cost(it2)}⚒ · ${turns} turns <span style="opacity:.7">— ${d}</span></button>`}
  h+='</div>'}else h+=`<div class="row">${btn('Close','closeModal()')}</div>`;
 modal(h);redraw()}
function setBuild(id,k,b){const c=G.cities.find(x=>x.id===id);c.build={k,id:b};openCity(c)}
function buy(id){const c=G.cities.find(x=>x.id===id);const bc=buyCost(c);const p=G.civs[0];if(bc>p.gold)return;p.gold-=bc;c.prod=cost(c.build);msg(`Bought ${itemName(c.build)} in ${c.name}; completes next turn.`);openCity(c)}
function openTech(){const p=G.civs[0];let h=`<h2>Technology</h2><p>${p.techs.length}/${Object.keys(TECHS).length} known. Next tech costs ${techCost(p)} 🔬. Pick one to research. Final goal: Astronomy → build the Star Vault for a science victory.</p>`;
 const av=availTechs(p);
 for(const k in TECHS){const t=TECHS[k];const cls=p.techs.includes(k)?'known':av.includes(k)?'avail':'locked';
  h+=`<div class="tech ${cls} ${p.research===k?'cur':''}" ${cls==='avail'?`onclick="setRes('${k}')"`:''}><b>${t.n}</b><br>${t.req.length?'Needs: '+t.req.map(q=>TECHS[q].n).join(', '):'No prerequisites'}<br><i>${unlocksText(k)||'—'}</i></div>`}
 h+=`<div class="row">Science rate: ${btn('−','setRate(-.1)')} ${Math.round(p.rate*100)}% science / ${Math.round((1-p.rate)*100)}% gold ${btn('+','setRate(.1)')} ${btn('Close','closeModal()')}</div>`;modal(h)}
function setRes(k){G.civs[0].research=k;closeModal();updateTop()}
function setRate(d){const p=G.civs[0];p.rate=Math.max(0,Math.min(1,Math.round((p.rate+d)*10)/10));G.cities.forEach(c=>{if(c.civ===0)cityWork(c)});openTech();updateTop()}
function menu(){const has=!!localStorage.getItem('hexforge_save_manual'),hasA=!!localStorage.getItem('hexforge_save_auto');
 modal(`<h2>Hexforge Empires</h2><p>Turn-based empire building on a hex world. Found cities, research, expand and conquer three rival civilisations — or win by building the Star Vault.</p>
 <div class="row">${btn('New game (3 rivals)','newGame(3);closeModal()')}${btn('New game (2 rivals)','newGame(2);closeModal()')}</div>
 <div class="row">${G?btn('Save game','saveGame("manual");msg("Game saved.");closeModal()'):''}${btn('Load saved game','loadGame("manual")',!has)}${btn('Continue autosave','loadGame("auto")',!hasA)}${G?btn('Resume','closeModal()'):''}</div>
 <h3>How to play</h3><p style="font-size:13px;line-height:1.5">Tap/click a unit to select it, then tap a tile to move (long routes go over several turns). Tap an enemy next to you to attack. Tap a city to manage production.
 Drag to pan, pinch or mouse-wheel to zoom. Keys: <b>Enter</b> end turn · <b>Space</b> skip · <b>N</b> next unit · <b>B</b> found city · <b>F</b> fortify · <b>S</b> sleep · <b>R</b>/<b>I</b>/<b>M</b> road/irrigate/mine · <b>T</b> tech · arrows pan.<br>
 Win by conquering every rival, by building the Star Vault (needs Astronomy), or by highest score at turn 300. Ancient ruins (huts) give gifts. Hills and forests help defence; fortify and build walls!</p>`)}
function msg(t){if(!G)return;const d=document.createElement('div');d.textContent=t;$('log').prepend(d);setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),700)},4500);while($('log').children.length>5)$('log').lastChild.remove()}

// ---------- save/load ----------
function saveGame(slot){try{const s={...G,sel:null,selCity:null,fx:null,hoverPath:null,busy:0,civs:G.civs.map(c=>({...c,seen:Array.from(c.seen),vis:[]})),rngState:RI(1e9)};
 rng=mulberry(s.rngState);localStorage.setItem('hexforge_save_'+slot,JSON.stringify(s))}catch(e){console.warn('save failed',e)}}
function loadGame(slot){const d=localStorage.getItem('hexforge_save_'+slot);if(!d)return;const s=JSON.parse(d);s.civs.forEach(c=>{c.seen=Uint8Array.from(c.seen);c.vis=new Uint8Array(W*H)});G=s;rng=mulberry(s.rngState||1);
 updateVis();closeModal();const u=G.units.find(u=>u.civ===0);const c=G.cities.find(c=>c.civ===0);const f=c||u;if(f)centreOn(f.c,f.r);selectNext();redraw();msg('Game loaded.')}

// ---------- input ----------
const ptrs=new Map();let drag=null,pinch=null;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ptrs.size===1)drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false,touch:e.pointerType==='touch'};
 if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:cam.s};drag=null}});
cv.addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptrs.size===2){const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);zoomAt(pinch.s*d/pinch.d,(a.x+b.x)/2,(a.y+b.y)/2);return}
 if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>(drag.touch?12:6))drag.moved=true;if(drag.moved){cam.x=drag.cx-dx;cam.y=drag.cy-dy;clampCam();redraw()}}
 else if(e.pointerType==='mouse'&&G&&G.sel&&G.sel.civ===0){const[c,r]=pixToHex(e.clientX,e.clientY);const k=c+','+r;if(k!==G.hk){G.hk=k;G.hoverPath=inb(c,r)&&!(c===G.sel.c&&r===G.sel.r)?findPath(G.sel,c,r,800):null;redraw()}}});
function endPtr(e){ptrs.delete(e.pointerId);if(pinch){if(ptrs.size<2)pinch=null;drag=null;return}
 if(drag&&!drag.moved)tapAt(e.clientX,e.clientY);drag=null}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(cam.s*(e.deltaY<0?1.15:1/1.15),e.clientX,e.clientY)},{passive:false});
function zoomAt(ns,px,py){ns=Math.max(12,Math.min(70,ns));const wx=(cam.x+px)/cam.s,wy=(cam.y+py)/cam.s;cam.s=ns;cam.x=wx*ns-px;cam.y=wy*ns-py;clampCam();redraw()}
cv.addEventListener('contextmenu',e=>e.preventDefault());
function tapAt(px,py){if(!G||G.busy)return;const[c,r]=pixToHex(px,py);if(!inb(c,r))return;const me=G.civs[0];G.hoverPath=null;
 const u=G.sel;const city=cityAt(c,r);const mineHere=unitsAt(c,r).filter(x=>x.civ===0);
 if(u&&G.units.includes(u)&&!(u.c===c&&u.r===r)&&me.seen[idx(c,r)]&&!G.over){
  if(dist(u.c,u.r,c,r)===1){const e=enemyUnitAt(c,r,0);
   if(e&&UNITS[u.type].a>0){if(u.mp<=0){msg('No moves left.');return}const o=combatOdds(u,c,r);
    if(o<0.5&&!G.confirmAtk){G.confirmAtk=idx(c,r);msg(`Win chance about ${Math.round(o*100)}%. Tap again to attack.`);return}
    G.confirmAtk=0;stepTo(u,c,r);updateVis();afterAction();return}
   if(e&&UNITS[u.type].a===0){msg('This unit cannot attack.');return}
   if(mineHere.length&&!(u.mp>0)){select(mineHere[0]);return}
   const res=stepTo(u,c,r);if(res==='moved'){u.sleep=0;updateVis();afterAction();return}
   if(u.mp<=0&&mineHere.length===0&&!city){msg('No moves left this turn.');return}}
  else if(!mineHere.length&&!(city&&city.civ===0)){const p=findPath(u,c,r);if(p){u.goto={c,r};u.fort=0;u.sleep=0;runGoto(u);updateVis();afterAction();return}else if(isLand(T(c,r))){msg("Can't find a route there.");return}}
  else if((city&&city.civ===0)||mineHere.length){if(dist(u.c,u.r,c,r)>1&&u.mp>0&&!G.tapSame){const p=findPath(u,c,r);if(p&&G.lastTap===idx(c,r)){u.goto={c,r};runGoto(u);updateVis();afterAction();G.lastTap=-1;return}G.lastTap=idx(c,r)}}}
 if(city&&city.civ===0&&!(mineHere.length&&G.sel&&mineHere.includes(G.sel)&&false)){if(mineHere.length&&(!G.sel||G.sel.c!==c||G.sel.r!==r)&&mineHere.some(needsOrders)){select(mineHere.find(needsOrders));return}openCity(city);return}
 if(mineHere.length){const i=mineHere.indexOf(G.sel);select(mineHere[(i+1)%mineHere.length]);mineHere[(i+1)%mineHere.length].sleep=0;mineHere[(i+1)%mineHere.length].fort=mineHere[(i+1)%mineHere.length].fort;return}
 if(city&&me.seen[idx(c,r)]){openCity(city);return}
 G.sel=null;updatePanel();redraw();
 const t=T(c,r);if(me.seen[idx(c,r)]){const y=tileYield(t,null);msg(`${TER[t.t].n}${t.res?' ('+RES[t.res].n+')':''}: 🌾${y.f} ⚒${y.p} 💱${y.t}${t.owner>=0?' · '+G.civs[t.owner].name:''}`)}}
addEventListener('keydown',e=>{if(!G)return;if(!$('modal').classList.contains('hide')){if(e.key==='Escape')closeModal();return}
 const k=e.key.toLowerCase();const u=G.sel;
 if(k==='enter'){endTurn();e.preventDefault()}else if(k===' '){act('skip');e.preventDefault()}else if(k==='n'){selectNext()}
 else if(k==='b'&&u&&u.type==='settler')act('found');else if(k==='f')act('fort');else if(k==='s')act('sleep');else if(k==='t')openTech();
 else if(k==='r')act('road');else if(k==='i')act('farm');else if(k==='m')act('mine');else if(k==='escape')menu();
 else if(e.key.startsWith('Arrow')){const d=80;if(k==='arrowleft')cam.x-=d;if(k==='arrowright')cam.x+=d;if(k==='arrowup')cam.y-=d;if(k==='arrowdown')cam.y+=d;clampCam();redraw()}});
$('bEnd').onclick=()=>{endTurn()};$('bTech').onclick=openTech;$('bMenu').onclick=menu;$('tRes').onclick=openTech;
$('zIn').onclick=()=>zoomAt(cam.s*1.2,innerWidth/2,innerHeight/2);$('zOut').onclick=()=>zoomAt(cam.s/1.2,innerWidth/2,innerHeight/2);$('bNext').onclick=selectNext;
mini.addEventListener('pointerdown',e=>{const b=mini.getBoundingClientRect();const c=(e.clientX-b.left)/b.width*(W+.5),r=(e.clientY-b.top)/b.height*H;centreOn(Math.floor(c),Math.floor(r));redraw()});
addEventListener('resize',resize);
resize();
if(localStorage.getItem('hexforge_save_auto'))menu();else{newGame(3);menu()}
