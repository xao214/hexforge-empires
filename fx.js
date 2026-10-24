'use strict';
// Hexforge Empires - art, sound and battle effects. All original, procedural.
// ---------- settings ----------
const SET=(()=>{let s={vol:0.7,mute:false,battle:true};try{Object.assign(s,JSON.parse(localStorage.getItem('hexforge_settings')||'{}'))}catch(e){}return s})();
function saveSet(){try{localStorage.setItem('hexforge_settings',JSON.stringify(SET))}catch(e){}}

// ---------- sound (WebAudio synthesis) ----------
const SFX=(()=>{let ac=null,master=null,noiseBuf=null;
 function init(){if(ac){if(ac.state==='suspended')ac.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();master=ac.createGain();master.connect(ac.destination);setVol();
  noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const b=ac.createBufferSource();b.buffer=ac.createBuffer(1,1,22050);b.connect(ac.destination);b.start(0);}
 function setVol(){if(master)master.gain.value=SET.mute?0:SET.vol*0.6}
 const ok=()=>ac&&!SET.mute&&SET.vol>0;
 function tone(f,dur,{type='sine',vol=.3,at=0,f2=null,attack=.005}={}){if(!ok())return;const t=ac.currentTime+at;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05)}
 function noise(dur,{vol=.3,at=0,type='bandpass',f=1000,f2=null,q=1}={}){if(!ok())return;const t=ac.currentTime+at;const s=ac.createBufferSource();s.buffer=noiseBuf;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
  const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(master);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
 const S={init,setVol,
  sword(){noise(.12,{f:3500,q:2,vol:.5});tone(1800+Math.random()*600,.25,{type:'triangle',vol:.12});tone(2700,.18,{type:'sine',vol:.06,at:.01})},
  thud(){noise(.15,{type:'lowpass',f:500,vol:.5});tone(110,.15,{vol:.3,f2:60})},
  arrow(){noise(.25,{type:'highpass',f:6000,f2:1500,vol:.25})},
  thwack(){noise(.06,{f:1500,q:3,vol:.4});tone(220,.08,{type:'square',vol:.06})},
  catapult(){tone(140,.2,{type:'triangle',vol:.25,f2:70});noise(.3,{type:'bandpass',f:400,f2:900,vol:.15,at:.05})},
  boom(){noise(.7,{type:'lowpass',f:900,f2:80,vol:.9});tone(70,.6,{vol:.6,f2:30})},
  gallop(){for(let i=0;i<6;i++)noise(.05,{type:'lowpass',f:700,vol:.35,at:i*.11+(i%2)*.04})},
  hit(){noise(.1,{type:'lowpass',f:1200,vol:.4})},
  victory(){[523,659,784,1047].forEach((f,i)=>tone(f,.35,{type:'triangle',vol:.22,at:i*.1}))},
  defeat(){[392,330,262,196].forEach((f,i)=>tone(f,.45,{type:'sawtooth',vol:.08,at:i*.16}))},
  found(){[392,523,659].forEach((f,i)=>{tone(f,1.4,{type:'sine',vol:.18,at:i*.06});tone(f*2.01,.8,{vol:.05,at:i*.06})})},
  grow(){tone(660,.18,{type:'triangle',vol:.15});tone(880,.3,{type:'triangle',vol:.15,at:.12})},
  build(){noise(.04,{f:2500,q:4,vol:.3});noise(.04,{f:2500,q:4,vol:.3,at:.12});tone(1047,.4,{type:'sine',vol:.15,at:.24});tone(1319,.5,{type:'sine',vol:.12,at:.3})},
  wonder(){const ch=[[262,330,392],[349,440,523],[392,494,587],[523,659,784]];ch.forEach((c,i)=>c.forEach(f=>tone(f,i===3?1.4:.32,{type:'sawtooth',vol:.06,at:i*.28,attack:.03})));tone(131,2.2,{type:'triangle',vol:.15})},
  tech(){[784,988,1175,1568].forEach((f,i)=>tone(f,.25,{vol:.1,at:i*.07}))},
  capture(){S.gallop();[392,523].forEach((f,i)=>tone(f,.3,{type:'square',vol:.07,at:.4+i*.15}))},
  click(){tone(900,.04,{type:'square',vol:.04})},
 };return S})();
['pointerdown','keydown','touchend'].forEach(ev=>addEventListener(ev,()=>SFX.init(),{capture:true,passive:true}));

// ---------- unit art ----------
const SKIN='#e2b48a',WOOD='#7a5230',METAL='#c9ced6',DARK='#1a1a1a',BRONZE='#c08a3e';
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const m=v=>Math.max(0,Math.min(255,Math.round(f<0?v*(1+f):v+(255-v)*f)));return`rgb(${m(r)},${m(g)},${m(b)})`}
// draws a unit centred at (x,y), roughly s px "radius". col = civ colour. t = time (s). opt.flip faces left.
function drawUnitArt(c,type,x,y,s,col,t,opt={}){const k=s/20;c.save();c.translate(x,y);c.scale(opt.flip?-k:k,k);c.lineJoin='round';c.lineCap='round';
 const ph=(opt.seed||0)*1.7;const bob=opt.still?0:Math.sin(t*3+ph)*0.8;const lw=1.4;
 const dk=shade(col,-.45),lt=shade(col,.3);
 const line=(x1,y1,x2,y2,st,w)=>{c.strokeStyle=st;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()};
 const circ=(cx,cy,r,f,st)=>{c.beginPath();c.arc(cx,cy,r,0,7);if(f){c.fillStyle=f;c.fill()}if(st){c.strokeStyle=st;c.lineWidth=lw;c.stroke()}};
 const poly=(pts,f,st)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(f){c.fillStyle=f;c.fill()}if(st){c.strokeStyle=st;c.lineWidth=lw;c.stroke()}};
 // ground shadow
 c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,15,13,3.5,0,0,7);c.fill();
 function person(hx,by,o={}){// by = foot y
  const walk=o.walk?Math.sin(t*6+ph)*2:0;
  line(hx-2,by-8,hx-2-walk*.5,by,DARK,3);line(hx+2,by-8,hx+2+walk*.5,by,DARK,3);
  const top=by-20+bob;poly([[hx-5,top+4],[hx+5,top+4],[hx+6,by-7],[hx-6,by-7]],o.body||col,DARK);
  if(o.armour){c.fillStyle=o.armour;c.fillRect(hx-4.5,top+5,9,6)}
  c.fillStyle=dk;c.fillRect(hx-6,by-9,12,2);
  circ(hx,top-1,4.2,SKIN,DARK);
  if(o.helm==='bronze'){c.fillStyle=BRONZE;c.beginPath();c.arc(hx,top-1.5,4.6,Math.PI,0);c.fill();c.fillStyle=col;c.fillRect(hx-1,top-10,2,5)}
  if(o.helm==='iron'){c.fillStyle=METAL;c.beginPath();c.arc(hx,top-1.5,4.8,Math.PI,0);c.fill();line(hx,top-1,hx,top+3,METAL,1.5);poly([[hx-2,top-6],[hx+2,top-6],[hx+4,top-11],[hx-1,top-12]],col)}
  if(o.helm==='kettle'){c.fillStyle=METAL;c.beginPath();c.arc(hx,top-2,4,Math.PI,0);c.fill();c.fillRect(hx-7,top-2.5,14,1.8)}
  if(o.helm==='hood'){poly([[hx-5,top],[hx,top-8],[hx+5,top]],dk)}
  if(o.helm==='tricorn'){poly([[hx-7,top-3],[hx,top-9],[hx+7,top-3],[hx,top-1]],DARK);circ(hx+4,top-5,1,col)}
  if(o.helm==='band'){c.fillStyle=col;c.fillRect(hx-4.5,top-3,9,1.8);line(hx-4,top-3,hx-8,top-1,col,1.2)}
  if(o.helm==='hat'){c.fillStyle='#c8a860';c.beginPath();c.ellipse(hx,top-4,7,1.8,0,0,7);c.fill();c.fillRect(hx-3,top-8,6,4)}
  return top}
 function horse(hx,by,body,cloth){const g=opt.still?0:Math.sin(t*5+ph)*1.5;
  for(const[lx,o]of[[-8,g],[-5,-g],[6,-g],[9,g]])line(hx+lx,by-8,hx+lx+o,by,shade(body,-.4),2.4);
  c.fillStyle=body;c.beginPath();c.ellipse(hx,by-11+bob*.4,11,5.5,0,0,7);c.fill();c.strokeStyle=DARK;c.lineWidth=lw;c.stroke();
  poly([[hx+7,by-14],[hx+12,by-23+bob*.5],[hx+17,by-21+bob*.5],[hx+16,by-18],[hx+12,by-17],[hx+10,by-10]],body,DARK);
  line(hx+11,by-23,hx+8,by-15,shade(body,-.5),2);line(hx-11,by-12,hx-15,by-4+g*.5,shade(body,-.5),2.5);
  if(cloth){poly([[hx-10,by-15],[hx+8,by-15],[hx+9,by-5],[hx-11,by-5]],cloth,DARK);c.fillStyle=lt;c.fillRect(hx-10,by-8,19,1.5)}}
 switch(type){
 case'settler':{line(10,15,8,-14+bob,WOOD,1.8);const tp=person(0,15,{walk:1,helm:'hat',body:col});circ(-6,tp+6,5.5,'#a07a4a',DARK);line(-9,tp+3,-3,tp+9,'#5a3a1a',1);break}
 case'worker':{const tp=person(0,15,{helm:'band',body:shade(col,.15)});line(-4,tp+10,9,tp-4,WOOD,1.8);poly([[5,tp-7],[13,tp-1],[12,tp-4]],METAL,DARK);break}
 case'warrior':{const tp=person(0,15,{helm:'band'});c.fillStyle='#8a6a40';c.beginPath();c.ellipse(-6,tp+11,4,6.5,0,0,7);c.fill();c.stroke();
  const sw=opt.still?0:Math.sin(t*2+ph)*.15;c.save();c.translate(5,tp+10);c.rotate(-.5+sw);line(0,0,0,-14,WOOD,2.4);circ(0,-14,2.6,'#5a3a1a');c.restore();break}
 case'archer':{const tp=person(-2,15,{helm:'hood'});c.fillStyle=WOOD;c.fillRect(-9,tp+2,3,10);line(-8,tp+2,-9,tp-2,'#ddd',1);
  c.strokeStyle='#6b4520';c.lineWidth=2;c.beginPath();c.arc(4,tp+8,10,-1.25,1.25);c.stroke();line(4+10*Math.cos(-1.25),tp+8+10*Math.sin(-1.25),4+10*Math.cos(1.25),tp+8+10*Math.sin(1.25),'#eee',.7);line(1,tp+8,15,tp+8,'#ddd',1);break}
 case'spear':{line(9,15,9,-22+bob,WOOD,1.8);poly([[7.5,-22+bob],[10.5,-22+bob],[9,-28+bob]],METAL,DARK);const tp=person(0,15,{helm:'bronze'});circ(-6,tp+11,6.5,col,DARK);circ(-6,tp+11,4.5,null,lt);circ(-6,tp+11,1.5,BRONZE);break}
 case'horse':{horse(0,15,'#8b5a2b');const tp=person(-1,4,{helm:'band'});line(3,tp+8,15,tp-6,WOOD,1.6);poly([[14,tp-8],[16,tp-5],[18,tp-10]],METAL);break}
 case'chariot':{horse(5,15,'#a0703a');line(-14,6,0,6,WOOD,1.6);poly([[-18,-2],[-6,-2],[-6,8],[-18,8]],col,DARK);c.fillStyle=lt;c.fillRect(-18,1,12,1.5);
  const rot=opt.still?0:t*4;c.save();c.translate(-12,9);c.rotate(rot);circ(0,0,6,null,WOOD);for(let i=0;i<4;i++){line(-6*Math.cos(i*.785),-6*Math.sin(i*.785),6*Math.cos(i*.785),6*Math.sin(i*.785),WOOD,1.1)}c.restore();
  circ(-12,-9+bob,3.6,SKIN,DARK);c.fillStyle=dk;c.fillRect(-15,-6+bob,6,5);c.strokeStyle='#6b4520';c.lineWidth=1.6;c.beginPath();c.arc(-9,-6+bob,6,-1.2,1.2);c.stroke();break}
 case'sword':{const tp=person(0,15,{helm:'iron',armour:'#9aa3ad'});poly([[-12,tp+3],[-4,tp+3],[-4,tp+16],[-8,tp+19],[-12,tp+16]],col,DARK);line(-8,tp+4,-8,tp+17,lt,1.5);
  const sw=opt.still?0:Math.sin(t*2.2+ph)*.12;c.save();c.translate(5,tp+11);c.rotate(-.7+sw);line(0,0,0,-15,METAL,2.2);line(-3,-2,3,-2,BRONZE,1.8);c.restore();break}
 case'catapult':{poly([[-15,8],[14,8],[12,3],[-13,3]],WOOD,DARK);for(const wx of[-10,9]){circ(wx,10,4.5,'#5a3a1a',DARK);circ(wx,10,1.2,METAL)}
  line(-4,3,-1,-10,WOOD,2.5);line(4,3,-1,-10,WOOD,2.5);const arm=opt.still?0:Math.sin(t*1.5+ph)*.06;c.save();c.translate(-1,-8);c.rotate(-.95+arm);line(-4,0,20,0,WOOD,2.5);c.beginPath();c.arc(20,-2,3,0,Math.PI);c.fillStyle='#444';c.fill();circ(20,-3,2.4,'#888');c.restore();
  line(13,3,13,-14,DARK,1);poly([[13,-14],[20,-12],[13,-9]],col);break}
 case'pike':{line(-6,15,15,-26+bob,WOOD,1.8);poly([[13.5,-24+bob],[16.5,-25+bob],[17,-31+bob]],METAL,DARK);const tp=person(0,15,{helm:'kettle',armour:'#a9b1ba'});c.fillStyle=col;c.fillRect(-5,tp+11,10,3);break}
 case'knight':{horse(0,15,'#d8d8d8',col);const tp=person(-1,4,{helm:'iron',armour:METAL,body:col});line(-2,tp+10,22,tp+4,'#ddd',2);poly([[22,tp+3],[22,tp+5],[27,tp+3.8]],METAL);
  poly([[-9,tp+5],[-3,tp+5],[-3,tp+13],[-6,tp+15],[-9,tp+13]],col,DARK);line(-6,tp+6,-6,tp+14,'#fff',1);break}
 case'musket':{const tp=person(0,15,{helm:'tricorn',body:col});c.fillStyle='#eee';c.fillRect(-1,tp+4,2,8);line(-6,tp+5,-1,tp+11,'#eee',1.4);
  line(-2,tp+16,13,tp-6,'#3a2a1a',2.2);line(11,tp-3,14,tp-8,'#555',1.6);line(14,tp-8,16,tp-12,METAL,1);break}
 case'cannon':{circ(-3,9,6.5,WOOD,DARK);circ(-3,9,1.5,METAL);poly([[-16,8],[0,4],[2,8],[-14,12]],WOOD,DARK);
  c.save();c.translate(-3,3);c.rotate(-.18);c.fillStyle='#3a3a3a';c.beginPath();c.moveTo(-8,-3.5);c.lineTo(17,-2.5);c.lineTo(17,2.5);c.lineTo(-8,3.5);c.arc(-8,0,3.5,Math.PI/2,Math.PI*1.5);c.fill();
  c.strokeStyle=DARK;c.stroke();c.fillStyle=BRONZE;c.fillRect(15,-3,2.5,6);c.fillRect(2,-3.2,1.8,6.4);c.restore();line(-15,8,-15,-10,DARK,1);poly([[-15,-10],[-8,-8],[-15,-5]],col);break}
 default:circ(0,0,8,col,DARK)}
 c.restore()}

// ---------- battle scene ----------
const BATTLE=(()=>{const q=[];let cur=null,el=null,c2=null,raf=0;
 const RANGED={archer:'arrow',catapult:'stone',cannon:'ball'};
 function ensure(){if(el)return;el=document.createElement('div');el.id='battle';el.innerHTML='<canvas></canvas><div class="bbtns"><button id="bSkip">Skip ▶</button><button id="bSkipAll">Skip all</button></div>';document.body.appendChild(el);
  c2=el.querySelector('canvas');el.addEventListener('pointerdown',e=>{if(e.target.id==='bSkipAll'){q.length=0}finish()});}
 function queue(b){if(!SET.battle){quickSounds(b);return}q.push(b);if(!cur)next()}
 function quickSounds(b){const r=RANGED[b.a.type];if(r==='ball')SFX.boom();else if(r)SFX.arrow();else SFX.sword();setTimeout(()=>b.playerWon?SFX.victory():SFX.defeat(),250)}
 function next(){cur=q.shift();if(!cur){if(el)el.style.display='none';cancelAnimationFrame(raf);redraw();return}
  ensure();el.style.display='block';const D=Math.min(2,devicePixelRatio||1);c2.width=innerWidth*D;c2.height=innerHeight*D;cur.D=D;
  const n=cur.rounds.length;cur.rd=Math.max(110,Math.min(280,1500/n));cur.t0=performance.now();cur.fired={};cur.parts=[];cur.hpA=cur.a.hp0;cur.hpD=cur.d.hp0;
  cur.total=450+n*cur.rd+900;if(UNITS[cur.a.type].mounted)SFX.gallop();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
 function finish(){if(!cur)return;cur=null;next()}
 function loop(){raf=requestAnimationFrame(loop);if(!cur)return;const now=performance.now();const t=now-cur.t0;try{draw(t,now/1000)}catch(e){console.warn(e);finish();return}if(t>cur.total)finish()}
 function draw(t,ts){const b=cur,c=c2.getContext('2d'),Wd=innerWidth,Ht=innerHeight;c.setTransform(b.D,0,0,b.D,0,0);
  // backdrop
  const g=c.createLinearGradient(0,0,0,Ht);g.addColorStop(0,'#2a3d5c');g.addColorStop(.55,'#86a4c4');g.addColorStop(.56,TER[b.ter].c);g.addColorStop(1,shade(TER[b.ter].c,-.5));c.fillStyle=g;c.fillRect(0,0,Wd,Ht);
  const hz=Ht*.55;c.fillStyle='rgba(40,50,60,.55)';c.beginPath();c.moveTo(0,hz);for(let x=0;x<=Wd;x+=Wd/12)c.lineTo(x,hz-(Math.sin(x*.013+b.seed)*0.5+0.6)*Ht*.08);c.lineTo(Wd,hz);c.fill();
  if(b.ter==='forest'||b.ter==='hills'){c.fillStyle=b.ter==='forest'?'#1d4a1d':'#6d6038';for(let i=0;i<14;i++){const x=(i*137+b.seed*50)%Wd,y=hz+4;if(b.ter==='forest'){c.beginPath();c.moveTo(x,y-40);c.lineTo(x-14,y+4);c.lineTo(x+14,y+4);c.fill()}else{c.beginPath();c.arc(x,y+20,50,Math.PI,0);c.fill()}}}
  if(b.city){const cx=Wd*.78;c.fillStyle='#8d8a80';c.fillRect(cx-Wd*.18,hz-Ht*.16,Wd*.36,Ht*.16);c.fillStyle=G.civs[b.d.civ].col;c.fillRect(cx-6,hz-Ht*.16-30,4,30);c.fillRect(cx-2,hz-Ht*.16-30,18,11);
   c.fillStyle='#6d6a62';for(let x=cx-Wd*.18;x<cx+Wd*.18;x+=22)c.fillRect(x,hz-Ht*.16-10,12,10)}
  // units
  const size=Math.min(Wd,Ht)*.16;const ay=Ht*.72,ax0=Wd*.3,dx0=Wd*.7;const intro=Math.min(1,t/350);const ease=v=>1-(1-v)*(1-v);
  let ax=ax0-(1-ease(intro))*Wd*.3,dx=dx0+(1-ease(intro))*Wd*.3;let aflash=0,dflash=0;
  const rt=t-450;const ri=Math.floor(rt/b.rd);const rp=(rt%b.rd)/b.rd;const ranged=RANGED[b.a.type];
  if(rt>=0&&ri<b.rounds.length){const who=b.rounds[ri];// 'd' = defender got hit
   if(who==='d'&&ranged){if(!b.fired[ri+'s']){b.fired[ri+'s']=1;ranged==='arrow'?SFX.arrow():ranged==='stone'?SFX.catapult():SFX.boom();if(ranged==='ball')for(let i=0;i<10;i++)b.parts.push({x:ax+size*.9,y:ay-size*.3,vx:Math.random()*2-.5,vy:-Math.random()*1.5,life:600,col:'rgba(200,200,200,.6)',r:8+Math.random()*10,t:ts})}
    const pr=Math.min(1,rp/0.7);const px=ax+size*.8+(dx-ax-size*.8)*pr,py=ay-size*.4-Math.sin(pr*Math.PI)*(ranged==='arrow'?size*.4:size*1.2);
    if(pr<1){c.save();c.translate(px,py);c.scale(size/45,size/45);if(ranged==='arrow'){c.rotate(Math.atan2(-Math.cos(pr*Math.PI)*(size*.4)*Math.PI,(dx-ax)));c.strokeStyle='#eee';c.lineWidth=2;c.beginPath();c.moveTo(-14,0);c.lineTo(10,0);c.stroke();c.fillStyle='#ccc';c.beginPath();c.moveTo(10,-3);c.lineTo(15,0);c.lineTo(10,3);c.fill()}
     else{c.fillStyle=ranged==='ball'?'#222':'#777';c.beginPath();c.arc(0,0,ranged==='ball'?6:9,0,7);c.fill()}c.restore()}}
   else{const l=Math.sin(Math.min(1,rp/0.8)*Math.PI);if(who==='d')ax+=l*(dx-ax)*.32;else dx-=l*(dx-ax)*.32}
   if(rp>0.62&&!b.fired[ri]){b.fired[ri]=1;if(who==='d'){b.hpD=Math.max(0,b.hpD-3)}else b.hpA=Math.max(0,b.hpA-3);
    const hx=who==='d'?dx:ax;if(!(who==='d'&&ranged))SFX.sword();else SFX.thwack();SFX.hit();
    for(let i=0;i<14;i++)b.parts.push({x:hx,y:ay-size*.35,vx:(Math.random()-.5)*6,vy:-Math.random()*5,life:400,col:i%2?'#ffd34d':'#fff',r:2+Math.random()*2,t:ts})}
   if(rp>0.62&&rp<0.95){if(who==='d')dflash=1;else aflash=1}}
  const done=rt>=b.rounds.length*b.rd;const out=done?Math.min(1,(rt-b.rounds.length*b.rd)/500):0;
  if(done&&!b.fired.end){b.fired.end=1;b.hpA=b.a.hpEnd;b.hpD=b.d.hpEnd;b.playerWon?SFX.victory():SFX.defeat()}
  const drawSide=(u,x,flip,flash,hp,lost)=>{c.save();if(lost){c.globalAlpha=1-out;c.translate(x,ay);c.rotate((flip?-1:1)*out*1.2);c.translate(-x,-ay)}
   drawUnitArt(c,u.type,x,ay-size*.3,size,G.civs[u.civ].col,ts,{flip,seed:flip?2:1});
   if(flash){c.globalCompositeOperation='lighter';c.globalAlpha=.6;drawUnitArt(c,u.type,x,ay-size*.3,size,'#ffffff',ts,{flip,still:1,seed:flip?2:1})}c.restore();
   const bw=size*1.4;c.fillStyle='rgba(0,0,0,.7)';c.fillRect(x-bw/2-2,ay+size*.75,bw+4,14);c.fillStyle=hp>6?'#3e3':hp>3?'#ec3':'#e33';c.fillRect(x-bw/2,ay+size*.75+2,bw*Math.max(0,hp)/10,10);
   c.fillStyle='#fff';c.font=`bold ${Math.round(size*.17)}px system-ui`;c.textAlign='center';c.fillText(`${G.civs[u.civ].name} ${UNITS[u.type].n}${u.vet?' ★':''}`,x,ay+size*.75+34)};
  drawSide(b.a,ax,false,aflash,b.hpA,done&&!b.aWon);drawSide(b.d,dx,true,dflash,b.hpD,done&&b.aWon);
  // particles
  for(const p of b.parts){const age=(ts-p.t)*1000;if(age>p.life)continue;const k=age/16;c.globalAlpha=1-age/p.life;c.fillStyle=p.col;c.beginPath();c.arc(p.x+p.vx*k,p.y+p.vy*k+.08*k*k,p.r,0,7);c.fill()}c.globalAlpha=1;
  c.fillStyle='#fff';c.font=`bold ${Math.round(Ht*.045)}px system-ui`;c.textAlign='center';c.fillText('⚔ Battle',Wd/2,Ht*.12);
  if(done){c.font=`bold ${Math.round(Ht*.09)}px system-ui`;c.fillStyle=b.playerWon?'#ffe36a':'#ff6a5a';c.globalAlpha=Math.min(1,out*2);c.fillText(b.playerWon?'VICTORY!':'DEFEAT',Wd/2,Ht*.32);c.globalAlpha=1}
  c.font='14px system-ui';c.fillStyle='#ddd';c.fillText('Tap to skip',Wd/2,Ht-14)}
 return{queue,active:()=>!!cur||q.length>0}})();

// ---------- city view ----------
function drawCityView(c,Wd,Ht,city,ts){
 const col=G.civs[city.civ].col,dk=shade(col,-.4);let rs=city.id*9301+49297;const rnd=()=>((rs=(rs*9301+49297)%233280)/233280);
 const near=ring(city.c,city.r,2).map(([a,b])=>T(a,b).t);const has=t=>near.filter(x=>x===t).length;
 const g=c.createLinearGradient(0,0,0,Ht);g.addColorStop(0,'#3b6aa8');g.addColorStop(1,'#cfe3f5');c.fillStyle=g;c.fillRect(0,0,Wd,Ht);
 // sun + clouds
 c.fillStyle='#fff3b0';c.beginPath();c.arc(Wd*.86,Ht*.18,Ht*.08,0,7);c.fill();
 c.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<3;i++){const x=((ts*8+i*Wd/3+city.id*40)%(Wd+120))-60,y=Ht*(.12+i*.07);c.beginPath();c.ellipse(x,y,40,10,0,0,7);c.ellipse(x+25,y-6,25,9,0,0,7);c.fill()}
 const hz=Ht*.62;
 if(has('mount')){c.fillStyle='#7d7470';for(let i=0;i<5;i++){const x=rnd()*Wd,h=Ht*(.25+rnd()*.15);c.beginPath();c.moveTo(x-h,hz);c.lineTo(x,hz-h);c.lineTo(x+h,hz);c.fill();c.fillStyle='#eee';c.beginPath();c.moveTo(x-h*.25,hz-h*.75);c.lineTo(x,hz-h);c.lineTo(x+h*.25,hz-h*.75);c.fill();c.fillStyle='#7d7470'}}
 if(has('hills')){c.fillStyle='#8b7d4a';for(let i=0;i<4;i++){c.beginPath();c.ellipse(rnd()*Wd,hz,Wd*.18,Ht*.12,0,Math.PI,0);c.fill()}}
 c.fillStyle=TER[T(city.c,city.r).t].c;c.fillRect(0,hz,Wd,Ht-hz);
 const water=has('coast')+has('ocean');if(water){c.fillStyle='#2f6fa8';c.fillRect(Wd*.8,hz-2,Wd*.2,Ht-hz+2);c.strokeStyle='rgba(255,255,255,.5)';for(let i=0;i<5;i++){const y=hz+8+i*12;c.beginPath();c.moveTo(Wd*.82+Math.sin(ts*2+i)*6,y);c.lineTo(Wd*.86+Math.sin(ts*2+i)*6,y);c.stroke()}
  if(city.b.harbour){c.fillStyle='#7a5230';c.fillRect(Wd*.78,hz+20,Wd*.1,6);const bx=Wd*.9+Math.sin(ts)*4;c.fillStyle='#5a3a1a';c.beginPath();c.moveTo(bx-18,hz+30);c.lineTo(bx+18,hz+30);c.lineTo(bx+12,hz+40);c.lineTo(bx-12,hz+40);c.fill();c.fillStyle='#eee';c.beginPath();c.moveTo(bx,hz-5);c.lineTo(bx,hz+28);c.lineTo(bx+14,hz+26);c.fill()}
  if(city.b.colossus){const x=Wd*.95;c.fillStyle='#c08a3e';c.fillRect(x-4,hz-Ht*.35,8,Ht*.35);c.beginPath();c.arc(x,hz-Ht*.37,7,0,7);c.fill();c.fillRect(x+3,hz-Ht*.42,3,Ht*.12);c.fillStyle='#ffde6a';c.beginPath();c.arc(x+4.5,hz-Ht*.44,4+Math.sin(ts*4),0,7);c.fill()}}
 if(has('forest')){for(let i=0;i<6;i++){const x=rnd()*Wd*.15+(i%2?Wd*.0:Wd*.02),y=hz+rnd()*10;c.fillStyle='#2f6b2f';c.beginPath();c.moveTo(x,y-34);c.lineTo(x-12,y+4);c.lineTo(x+12,y+4);c.fill()}}
 // building drawing helpers
 const B=[];const base=hz+Ht*.12;
 const house=(x,w,h,roof)=>{c.fillStyle='#e8dcc0';c.fillRect(x-w/2,base-h,w,h);c.strokeStyle='#5a4a30';c.lineWidth=1;c.strokeRect(x-w/2,base-h,w,h);c.fillStyle=roof;c.beginPath();c.moveTo(x-w/2-3,base-h);c.lineTo(x,base-h-w*.5);c.lineTo(x+w/2+3,base-h);c.fill();c.fillStyle='#4a3a28';c.fillRect(x-2,base-7,4,7);c.fillStyle='#ffd27a';c.fillRect(x-w/2+3,base-h+4,3,3)};
 const label=(x,y,t)=>{c.font='bold 10px system-ui';c.textAlign='center';c.fillStyle='rgba(0,0,0,.55)';const w=c.measureText(t).width+6;c.fillRect(x-w/2,y-10,w,12);c.fillStyle='#fff';c.fillText(t,x,y)};
 const BLD_ART={
  palace:(x)=>{c.fillStyle='#f1ead8';c.fillRect(x-45,base-55,90,55);c.fillStyle=col;c.beginPath();c.moveTo(x-50,base-55);c.lineTo(x,base-85);c.lineTo(x+50,base-55);c.fill();for(let i=-3;i<=3;i++){c.fillStyle='#d6cdb5';c.fillRect(x+i*12-2,base-50,4,50)}
   c.fillStyle='#4a3a28';c.fillRect(x-7,base-20,14,20);for(const fx of[-45,45]){c.fillStyle='#333';c.fillRect(x+fx,base-95,2,40);c.fillStyle=col;c.beginPath();c.moveTo(x+fx+2,base-95);c.lineTo(x+fx+18+Math.sin(ts*5+fx)*3,base-89);c.lineTo(x+fx+2,base-83);c.fill()}return'Palace'},
  granary:(x)=>{c.fillStyle='#c9a35c';c.fillRect(x-14,base-40,28,40);c.beginPath();c.ellipse(x,base-40,14,8,0,Math.PI,0);c.fill();c.fillStyle='#8a6a30';for(let i=0;i<4;i++)c.fillRect(x-14,base-34+i*9,28,1.5);return'Granary'},
  barracks:(x)=>{c.fillStyle='#8e7c68';c.fillRect(x-24,base-26,48,26);c.fillStyle=dk;c.fillRect(x-26,base-30,52,5);c.fillStyle='#333';c.fillRect(x+18,base-50,2,24);c.fillStyle=col;c.fillRect(x+20,base-50,14,9);
   c.strokeStyle='#ccc';c.lineWidth=2;c.beginPath();c.moveTo(x-12,base-6);c.lineTo(x-4,base-16);c.moveTo(x-4,base-6);c.lineTo(x-12,base-16);c.stroke();return'Barracks'},
  library:(x)=>{c.fillStyle='#ece6d6';c.fillRect(x-26,base-34,52,34);c.fillStyle='#d8d0b8';c.beginPath();c.moveTo(x-30,base-34);c.lineTo(x,base-50);c.lineTo(x+30,base-34);c.fill();c.fillStyle='#bbb3a0';for(let i=-2;i<=2;i++)c.fillRect(x+i*10-2,base-32,4,32);
   c.fillStyle='#7a2a2a';c.fillRect(x-5,base-14,3,10);c.fillStyle='#2a4a7a';c.fillRect(x-1,base-14,3,10);c.fillStyle='#2a6a3a';c.fillRect(x+3,base-14,3,10);return'Library'},
  market:(x)=>{for(let i=0;i<3;i++){const sx=x-30+i*22;c.fillStyle='#7a5230';c.fillRect(sx-9,base-22,2,22);c.fillRect(sx+7,base-22,2,22);for(let j=0;j<4;j++){c.fillStyle=j%2?'#fff':(i===1?col:['#d84','#4a8'][i/2]);c.fillRect(sx-10+j*5,base-28,5,7)}
   c.fillStyle=['#e33','#fc3','#7c3'][i];for(let j=0;j<3;j++){c.beginPath();c.arc(sx-4+j*4,base-9,2.2,0,7);c.fill()}c.fillStyle='#a77a4a';c.fillRect(sx-9,base-7,18,7)}return'Market'},
  temple:(x)=>{c.fillStyle='#d9d2c0';c.fillRect(x-14,base-30,28,30);c.fillStyle='#b8860b';c.beginPath();c.arc(x,base-30,14,Math.PI,0);c.fill();c.fillStyle='#fd5';c.fillRect(x-1,base-54,2,12);c.fillRect(x-5,base-50,10,2);c.fillStyle='#ffb84a';c.globalAlpha=.6+.4*Math.sin(ts*6);c.beginPath();c.arc(x,base-10,3,0,7);c.fill();c.globalAlpha=1;return'Shrine'},
  aqueduct:(x)=>{c.fillStyle='#bfb59d';c.fillRect(x-60,base-46,120,8);for(let i=0;i<5;i++){const ax=x-60+i*24;c.fillRect(ax,base-38,6,38);c.fillRect(ax+18,base-38,6,38)}c.fillStyle='#5aa0e0';c.fillRect(x-60,base-47,120,2);return'Aqueduct'},
  walls:null,harbour:null,colossus:null,
  university:(x)=>{c.fillStyle='#e6e0d0';c.fillRect(x-28,base-36,56,36);c.fillStyle='#8aa6c8';c.beginPath();c.arc(x,base-36,18,Math.PI,0);c.fill();c.fillStyle='#333';c.fillRect(x-1,base-60,2,8);c.fillStyle='#bbb3a0';for(let i=-2;i<=2;i++)c.fillRect(x+i*11-2,base-34,4,34);return'Academy'},
  observ:(x)=>{c.fillStyle='#d8d4cc';c.fillRect(x-22,base-70,44,70);c.fillStyle='#4a5a8a';c.beginPath();c.arc(x,base-70,24,Math.PI,0);c.fill();c.save();c.translate(x,base-80);c.rotate(-.6+Math.sin(ts*.5)*.2);c.fillStyle='#c08a3e';c.fillRect(0,-4,34,8);c.restore();
   c.fillStyle='#fff';for(let i=0;i<5;i++){c.globalAlpha=.5+.5*Math.sin(ts*3+i);c.fillRect(x-40+i*20,base-110-(i%2)*12,2,2)}c.globalAlpha=1;return'Star Vault'},
 };
 // houses (pop) behind
 const nh=Math.min(28,3+city.pop*3);const hs=[];for(let i=0;i<nh;i++)hs.push([rnd()*Wd*.74+Wd*.03,14+rnd()*12,14+rnd()*12+(city.pop>6?rnd()*20:0)]);
 c.save();c.translate(0,-Ht*.06);for(const[x,w,h]of hs)house(x,w,h,i2col(rnd()));c.restore();
 function i2col(v){return v<.33?'#a0442c':v<.66?'#7a4a2a':shade(col,-.2)}
 // landmark buildings in slots
 const keys=['palace','granary','barracks','library','market','temple','university','aqueduct','observ'].filter(k=>k==='palace'?city.capital||city.b.palace:city.b[k]);
 const slots=keys.length;const lbls=[];keys.forEach((k,i)=>{const x=Wd*.08+(i+.5)*(Wd*.68/Math.max(slots,1));const nm=BLD_ART[k](x);lbls.push([x,nm])});
 for(let i=0;i<Math.min(8,city.pop);i++)house(Wd*.05+((i*97+city.id*13)%70)/100*Wd,16,14,i2col(((i*37)%100)/100));
 // walls in front
 if(city.b.walls){const wy=base+16;c.fillStyle='#9a958a';c.fillRect(0,wy,Wd*.8,20);for(let x=0;x<Wd*.8;x+=18)c.fillRect(x,wy-8,10,8);c.fillStyle='#4a3a28';c.beginPath();c.arc(Wd*.4,wy+20,10,Math.PI,0);c.fill();
  for(const tx of[Wd*.05,Wd*.75]){c.fillStyle='#8a857a';c.fillRect(tx-10,wy-26,20,46);c.fillStyle=col;c.fillRect(tx-2,wy-40,12,7);c.fillStyle='#333';c.fillRect(tx-3,wy-42,2,16)}}
 c.font='bold 10px system-ui';lbls.forEach(([x,nm],i)=>label(x,base+(city.b.walls?30:12)+(slots>6&&i%2?13:0),nm));
 // citizens walking
 const ny=Ht*.93;c.fillStyle='#b9a27a';c.fillRect(0,ny-6,Wd*.8,10);
 for(let i=0;i<city.pop;i++){const sp=12+((i*7)%10)*2,dir=i%2?1:-1;let x=((ts*sp*dir+i*137)%(Wd*.8));if(x<0)x+=Wd*.8;const step=Math.sin(ts*8+i)*2;
  c.strokeStyle='#222';c.lineWidth=2;c.beginPath();c.moveTo(x-2,ny);c.lineTo(x-2+step,ny+6);c.moveTo(x+2,ny);c.lineTo(x+2-step,ny+6);c.stroke();
  c.fillStyle=i%3===0?col:['#c66','#6a6','#dd8','#86c'][i%4];c.fillRect(x-4,ny-12,8,12);c.fillStyle=SKIN;c.beginPath();c.arc(x,ny-15,3.5,0,7);c.fill()}
 // banner
 c.font='bold 18px system-ui';c.textAlign='left';c.fillStyle='rgba(0,0,0,.5)';c.fillRect(8,8,c.measureText(city.name).width+46,28);c.fillStyle=col;c.fillRect(14,14,14,16);c.fillStyle='#fff';c.fillText(city.name+'  ',34,28);
 c.font='12px system-ui';c.fillText(`Population ${city.pop}`,10,52)}
let cityViewRaf=0;
function startCityView(city){cancelAnimationFrame(cityViewRaf);const cvs=document.getElementById('cityview');if(!cvs)return;const D=Math.min(2,devicePixelRatio||1);const w=cvs.clientWidth,h=cvs.clientHeight;cvs.width=w*D;cvs.height=h*D;const c=cvs.getContext('2d');
 let last=0;const f=now=>{if(!document.body.contains(cvs)||document.getElementById('modal').classList.contains('hide'))return;cityViewRaf=requestAnimationFrame(f);if(now-last<45)return;last=now;c.setTransform(D,0,0,D,0,0);drawCityView(c,w,h,city,now/1000)};cityViewRaf=requestAnimationFrame(f)}
