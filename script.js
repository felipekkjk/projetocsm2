(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const W=960,H=600,keys={},mouse={x:700,y:300};
const $=id=>document.getElementById(id);
const ui={hp:$("hp-bar"),st:$("st-bar"),hpText:$("hp-text"),stText:$("st-text"),boss:$("boss-bar"),souls:$("souls"),interaction:$("interaction"),toast:$("toast"),stage:$("stage-title"),objective:$("objective"),counter:$("enemy-counter")};
let mode="menu",last=0,toastTimer=0,shake=0,worldTime=0,hitStop=0,stageCompleted=false;
let echoes=0,kills=0,stageIndex=0,checkpointStage=0,checkpoint={x:480,y:440},enemies=[],particles=[],slashes=[],pickups=[];
const player={x:480,y:430,r:14,hp:100,maxHp:100,st:100,maxSt:100,face:0,speed:175,attack:0,attackCd:0,dodge:0,dodgeCd:0,invuln:0,run:false,anim:0,dead:false,konCd:0,konCast:0};
const boss={x:0,y:0,r:29,hp:220,maxHp:220,face:0,state:"idle",timer:1,attackCd:0,hitFlash:0,dead:false};
let konEffects=[];
let obstacles=[],gate={x:870,y:300,open:false},bonfire={x:480,y:300,r:26};
const stages=[
 {name:"FASE 01 — DISTRITO CINZENTO",place:"TOKYO • DISTRITO COMERCIAL",objective:"Elimine os demônios e encontre a passagem para a estação.",floor:"#242326",spawn:{x:480,y:475},fire:{x:480,y:300},gate:{x:875,y:300},obstacles:[{x:95,y:120,w:125,h:46},{x:320,y:82,w:90,h:55},{x:520,y:110,w:130,h:42},{x:780,y:120,w:95,h:58},{x:80,y:390,w:90,h:55},{x:280,y:475,w:150,h:35},{x:690,y:450,w:130,h:42},{x:850,y:360,w:55,h:90}],enemies:[["stalker",235,205],["stalker",720,390],["crawler",520,205],["stalker",350,385]]},
 {name:"FASE 02 — ESTAÇÃO ABANDONADA",place:"LINHA 13 • PLATAFORMA SUBTERRÂNEA",objective:"Atravesse a plataforma. Derrote os guardiões que protegem o túnel.",floor:"#20242a",spawn:{x:90,y:500},fire:{x:475,y:300},gate:{x:875,y:300},obstacles:[{x:180,y:80,w:70,h:180},{x:180,y:350,w:70,h:170},{x:390,y:80,w:70,h:170},{x:390,y:350,w:70,h:170},{x:600,y:80,w:70,h:170},{x:600,y:350,w:70,h:170},{x:810,y:80,w:70,h:180},{x:810,y:350,w:70,h:170}],enemies:[["crawler",300,290],["stalker",510,285],["stalker",700,250],["crawler",730,455],["brute",490,470]]},
 {name:"FASE 03 — SANTUÁRIO DO CONTRATO",place:"SUBSOLO • CÂMARA DO PACTO",objective:"Explore a câmara e derrote os guardiões do contrato.",floor:"#211d21",spawn:{x:480,y:475},fire:{x:480,y:510},gate:{x:875,y:300},obstacles:[{x:105,y:105,w:100,h:55},{x:755,y:105,w:100,h:55},{x:105,y:440,w:100,h:55},{x:755,y:440,w:100,h:55},{x:340,y:170,w:75,h:60},{x:545,y:170,w:75,h:60}],enemies:[["stalker",250,220],["crawler",700,210],["brute",480,300],["stalker",700,430]]},
 {name:"FASE 04 — BAIRRO SUBMERSO",place:"TOKYO • RUAS ALAGADAS",objective:"Atravesse as ruas inundadas e elimine todos os demônios.",floor:"#1b2528",spawn:{x:85,y:500},fire:{x:480,y:520},gate:{x:875,y:300},obstacles:[{x:140,y:90,w:150,h:65},{x:390,y:75,w:85,h:125},{x:650,y:95,w:170,h:65},{x:120,y:350,w:100,h:125},{x:350,y:390,w:170,h:55},{x:670,y:350,w:150,h:115}],enemies:[["crawler",280,245],["stalker",510,190],["brute",740,260],["crawler",550,460],["stalker",220,500]]},
 {name:"FASE 05 — COMPLEXO DA SEGURANÇA",place:"SETOR RESTRITO • ARQUIVO 09",objective:"Recupere o arquivo perdido. Nenhum guardião pode permanecer.",floor:"#292522",spawn:{x:480,y:520},fire:{x:480,y:520},gate:{x:875,y:300},obstacles:[{x:100,y:100,w:190,h:48},{x:385,y:100,w:190,h:48},{x:670,y:100,w:190,h:48},{x:100,y:420,w:190,h:48},{x:385,y:420,w:190,h:48},{x:670,y:420,w:190,h:48},{x:300,y:240,w:80,h:90},{x:580,y:240,w:80,h:90}],enemies:[["brute",240,280],["stalker",480,210],["crawler",720,280],["stalker",350,365],["crawler",610,365],["brute",480,500]]},
 {name:"FASE 06 — ALTAR DO DEMÔNIO",place:"LIMIAR • CONTRATO FINAL",objective:"Derrote o Demônio do Pânico para encerrar a operação.",floor:"#21191f",spawn:{x:480,y:490},fire:{x:480,y:535},gate:{x:875,y:300},obstacles:[{x:95,y:95,w:100,h:55},{x:765,y:95,w:100,h:55},{x:95,y:450,w:100,h:55},{x:765,y:450,w:100,h:55},{x:315,y:160,w:85,h:65},{x:560,y:160,w:85,h:65}],enemies:[]}
]; 
const FINAL_BOSS_STAGE = stages.length - 1;
function isBossStage(index=stageIndex){return index===FINAL_BOSS_STAGE;}
function completeStage(){
 if(stageCompleted || mode!=="playing") return;
 stageCompleted=true;
 if(stageIndex===stages.length-1){
   mode="won";setScreen("win-screen");
 } else {
   mode="stagewon";setScreen("stage-clear-screen");
   $("stage-clear-copy").textContent=`${stages[stageIndex].name} foi concluída. Prepare-se para ${stages[stageIndex+1].name}.`;
   $("clear-echoes").textContent=echoes;
 }
 ui.interaction.classList.remove("show");
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angleTo(a,b){return Math.atan2(b.y-a.y,b.x-a.x)}
function showToast(t){ui.toast.textContent=t;ui.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),1900)}
function setScreen(id){["start-screen","pause-screen","dead-screen","stage-clear-screen","win-screen"].forEach(x=>$(x).classList.toggle("hidden",x!==id));}
function spawnParticles(x,y,color,n=8,power=90){for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,s=20+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.35,max:.65,size:2+Math.random()*3,color});}}
function makeEnemy(type,x,y){const data={stalker:{hp:42,max:42,r:13,speed:85,damage:10,color:"#63504c",name:"Rastejante"},crawler:{hp:30,max:30,r:11,speed:112,damage:8,color:"#78635a",name:"Rastejante"},brute:{hp:90,max:90,r:20,speed:55,damage:18,color:"#493238",name:"Brutamontes"}}[type];return{x,y,type,...data,face:0,attackCd:.5+Math.random(),hitFlash:0,dead:false,stun:0,anim:Math.random()*6.28};}
function loadStage(index,fromCheckpoint=false){
 stageIndex=index;stageCompleted=false;const s=stages[index];obstacles=s.obstacles.map(o=>({...o}));bonfire={...s.fire,r:26};gate={...s.gate,open:false};enemies=s.enemies.map(e=>makeEnemy(...e));pickups=[];particles=[];slashes=[];konEffects=[];boss.dead=true;boss.hp=boss.maxHp;
 player.x=s.spawn.x;player.y=s.spawn.y;player.hp=fromCheckpoint?Math.max(55,player.hp):player.maxHp;player.st=player.maxSt;player.invuln=1;player.dead=false;
 checkpointStage=index;checkpoint={x:s.fire.x,y:s.fire.y+45};mode="playing";setScreen("");ui.stage.textContent=s.name;ui.objective.textContent=s.objective;
 if(isBossStage(index)){boss.dead=false;boss.x=720;boss.y=275;boss.hp=boss.maxHp;boss.state="idle";boss.timer=1.1;showToast("O contrato final começa. Observe os movimentos do chefe.");}
 else showToast(`Área ${index+1}/${stages.length} — ${s.place}`);
 updateHud();
}
function resetGame(){echoes=0;kills=0;loadStage(0,false);}
function hitObstacle(x,y,r){return obstacles.some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)}
function moveEntity(ent,dx,dy,r){let nx=clamp(ent.x+dx,r+15,W-r-15);if(!hitObstacle(nx,ent.y,r))ent.x=nx;let ny=clamp(ent.y+dy,r+15,H-r-15);if(!hitObstacle(ent.x,ny,r))ent.y=ny;}
function updateHud(){ui.hp.style.width=player.hp/player.maxHp*100+"%";ui.st.style.width=player.st/player.maxSt*100+"%";ui.hpText.textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;ui.stText.textContent=`${Math.ceil(player.st)} / ${player.maxSt}`;ui.boss.style.width=(isBossStage()?boss.hp/boss.maxHp*100:0)+"%";ui.souls.textContent=echoes;ui.counter.textContent=isBossStage()?(boss.dead?"CHEFE DERROTADO":"CHEFE: 1"):`AMEAÇAS: ${enemies.filter(e=>!e.dead).length}`;}
function attack(){
 if(mode!=="playing"||player.attackCd>0||player.dodge>0||player.st<17)return;
 player.st-=17;player.attack=.24;player.attackCd=.42;player.face=Math.atan2(mouse.y-player.y,mouse.x-player.x);slashes.push({x:player.x,y:player.y,a:player.face,life:.24,kind:"sword"});
 let hit=false;
 for(const e of enemies){if(e.dead)continue;const d=dist(player,e),a=angleTo(player,e),diff=Math.atan2(Math.sin(a-player.face),Math.cos(a-player.face));if(d<67+e.r&&Math.abs(diff)<1.05){e.hp-=e.type==="brute"?34:40;e.hitFlash=.13;e.stun=.18;e.x+=Math.cos(a)*13;e.y+=Math.sin(a)*13;spawnParticles(e.x,e.y,"#b9574d",9,75);shake=4;hit=true;if(e.hp<=0)killEnemy(e);}}
 if(isBossStage()&&!boss.dead){const d=dist(player,boss),a=angleTo(player,boss),diff=Math.atan2(Math.sin(a-player.face),Math.cos(a-player.face));if(d<78&&Math.abs(diff)<1.05){boss.hp=Math.max(0,boss.hp-30);boss.hitFlash=.14;boss.x+=Math.cos(a)*12;boss.y+=Math.sin(a)*12;spawnParticles(boss.x,boss.y,"#c65c4b",10,90);shake=5;hit=true;if(boss.hp<=0){boss.dead=true;echoes+=250;spawnParticles(boss.x,boss.y,"#d7b77b",45,150);gate.open=true;ui.objective.textContent="O chefe caiu. Fase concluída.";showToast("Demônio do Pânico derrotado • +250 ecos");completeStage();}}}
 if(!hit)spawnParticles(player.x+Math.cos(player.face)*34,player.y+Math.sin(player.face)*34,"#d9c59d",4,35);
 updateHud();
}
function summonKon(){
 if(mode!=="playing"||player.konCd>0||player.st<35)return;
 player.st-=35;player.konCd=8;player.konCast=.65;
 const a=player.face, cx=player.x+Math.cos(a)*88, cy=player.y+Math.sin(a)*88;
 konEffects.push({x:cx,y:cy,a,life:.72,max:.72});
 spawnParticles(cx,cy,"#e9c77d",28,150);
 let hits=0;
 for(const e of enemies){
   if(e.dead)continue;
   const d=dist({x:cx,y:cy},e);
   if(d<112){e.hp-=58;e.stun=.65;e.hitFlash=.2;spawnParticles(e.x,e.y,"#d5b66f",15,100);hits++;if(e.hp<=0)killEnemy(e);}
 }
 if(isBossStage()&&!boss.dead&&dist({x:cx,y:cy},boss)<135){
   boss.hp=Math.max(0,boss.hp-48);boss.hitFlash=.25;boss.state="recover";boss.timer=.9;hits++;
   spawnParticles(boss.x,boss.y,"#d5b66f",22,120);
   if(boss.hp<=0){boss.dead=true;echoes+=250;spawnParticles(boss.x,boss.y,"#d7b77b",45,150);gate.open=true;completeStage();}
 }
 showToast(hits?`KON! Contrato ativado • ${hits} alvo(s) atingido(s)`:"KON! A raposa surgiu, mas não encontrou alvos.");
 updateHud();
}
function killEnemy(e){e.dead=true;kills++;echoes+=e.type==="brute"?55:25;pickups.push({x:e.x,y:e.y,r:8,life:12});spawnParticles(e.x,e.y,"#9d4a43",18,110);showToast(`${e.name} derrotado • ecos recuperados`);updateHud();if(enemies.every(x=>x.dead)&&!isBossStage()){gate.open=true;ui.objective.textContent="Todos os inimigos foram derrotados.";showToast("Área limpa. Fase concluída.");completeStage();}}
function dodge(){if(mode!=="playing"||player.dodgeCd>0||player.st<27)return;let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);if(!dx&&!dy){dx=Math.cos(player.face);dy=Math.sin(player.face);}let l=Math.hypot(dx,dy)||1;player.dodge=.24;player.dodgeCd=.68;player.invuln=.4;player.st-=27;moveEntity(player,dx/l*95,dy/l*95,player.r);spawnParticles(player.x,player.y,"#aaa49a",8,40);}
function damagePlayer(d){if(player.invuln>0||player.dead)return;player.hp=Math.max(0,player.hp-d);player.invuln=.78;shake=9;spawnParticles(player.x,player.y,"#9b3d3c",13,90);if(player.hp<=0){player.dead=true;mode="dead";setScreen("dead-screen");}}
function enemyUpdate(e,dt){if(e.dead)return;e.anim+=dt*(e.type==="crawler"?8:e.type==="brute"?3:5);e.attackCd-=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.stun=Math.max(0,e.stun-dt);let d=dist(e,player),a=angleTo(e,player);e.face=a;if(e.stun>0)return;if(d>34){moveEntity(e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt,e.r);}else if(e.attackCd<=0){e.attackCd=e.type==="brute"?1.6:1.15;if(d<49)damagePlayer(e.damage);spawnParticles(e.x+Math.cos(a)*18,e.y+Math.sin(a)*18,"#a44a42",6,55);}}
function bossUpdate(dt){if(boss.dead)return;boss.timer-=dt;boss.attackCd-=dt;boss.hitFlash=Math.max(0,boss.hitFlash-dt);let d=dist(player,boss),a=angleTo(boss,player);boss.face=a;if(boss.state==="idle"){if(d>78)moveEntity(boss,Math.cos(a)*77*dt,Math.sin(a)*77*dt,boss.r);if(d<112&&boss.attackCd<=0){boss.state="windup";boss.timer=.72;}}
 else if(boss.state==="windup"&&boss.timer<=0){boss.state="swing";boss.timer=.25;boss.attackCd=1.35;let diff=Math.atan2(Math.sin(angleTo(boss,player)-boss.face),Math.cos(angleTo(boss,player)-boss.face));if(d<103&&Math.abs(diff)<1.3)damagePlayer(26);spawnParticles(boss.x+Math.cos(a)*35,boss.y+Math.sin(a)*35,"#b64c42",15,100);shake=5;}
 else if(boss.state==="swing"&&boss.timer<=0){boss.state="recover";boss.timer=.72;}
 else if(boss.state==="recover"&&boss.timer<=0){boss.state="idle";boss.timer=.2;}}
function interact(){
 if(mode!=="playing")return;
 if(dist(player,bonfire)<64){checkpointStage=stageIndex;checkpoint={x:bonfire.x,y:bonfire.y+48};player.hp=player.maxHp;player.st=player.maxSt;enemies.forEach(e=>{if(e.dead)return;e.hp=e.maxHp;e.x+=Math.random()*80-40;e.y+=Math.random()*80-40;});if(isBossStage()&&!boss.dead){boss.hp=boss.maxHp;boss.x=720;boss.y=275;}showToast("Marco ativado. Vitalidade e fôlego restaurados.");updateHud();return;}
 if(gate.open&&dist(player,gate)<75){if(stageIndex<stages.length-1){loadStage(stageIndex+1,true);}else{mode="won";setScreen("win-screen");}}
}
function update(dt){
 if(mode!=="playing")return;if(hitStop>0){hitStop-=dt;return;}
 player.anim+=dt;player.konCd=Math.max(0,player.konCd-dt);player.konCast=Math.max(0,player.konCast-dt);player.attack=Math.max(0,player.attack-dt);player.attackCd=Math.max(0,player.attackCd-dt);player.dodge=Math.max(0,player.dodge-dt);player.dodgeCd=Math.max(0,player.dodgeCd-dt);player.invuln=Math.max(0,player.invuln-dt);
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),moving=!!(dx||dy);
 if(moving){let l=Math.hypot(dx,dy);dx/=l;dy/=l;player.face=Math.atan2(dy,dx);}
 player.run=!!keys.shift&&moving&&player.st>0&&player.dodge<=0;let speed=player.run?250:player.speed;if(player.dodge<=0)moveEntity(player,dx*speed*dt,dy*speed*dt,player.r);
 if(player.run)player.st=Math.max(0,player.st-23*dt);else if(player.attack<=0&&player.dodge<=0)player.st=Math.min(player.maxSt,player.st+20*dt);
 enemies.forEach(e=>enemyUpdate(e,dt));if(isBossStage())bossUpdate(dt);
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt;});particles=particles.filter(p=>p.life>0);
 slashes.forEach(s=>s.life-=dt);slashes=slashes.filter(s=>s.life>0);konEffects.forEach(k=>k.life-=dt);konEffects=konEffects.filter(k=>k.life>0);
 pickups.forEach(p=>{p.life-=dt;if(dist(player,p)<24&&p.life>0){p.life=0;player.hp=Math.min(player.maxHp,player.hp+12);echoes+=10;showToast("Fragmento recolhido • +10 ecos");}});pickups=pickups.filter(p=>p.life>0);
 const nearFire=dist(player,bonfire)<64,nearGate=dist(player,gate)<75&&gate.open;ui.interaction.classList.toggle("show",nearFire||nearGate);ui.interaction.textContent=nearFire?"[ E ] DESCANSAR NO MARCO":nearGate?(stageIndex<stages.length-1?"[ E ] AVANÇAR PARA A PRÓXIMA FASE":"[ E ] CONCLUIR MISSÃO"):"";
 updateHud();
}
function drawFloor(){
 const s=stages[stageIndex], t=worldTime;
 ctx.fillStyle=s.floor;ctx.fillRect(0,0,W,H);
 for(let y=0;y<H;y+=40)for(let x=0;x<W;x+=40){
  const n=((x*13+y*7)%23)/23;
  ctx.fillStyle=`rgba(${25+n*20},${27+n*18},${30+n*16},.72)`;
  ctx.fillRect(x+1,y+1,38,38);
  ctx.strokeStyle="#d8d0c018";ctx.lineWidth=1;ctx.strokeRect(x+1,y+1,38,38);
 }
 for(let i=0;i<34;i++){
  const x=(i*173+47)%W,y=(i*97+31)%H;
  ctx.strokeStyle=i%3===0?"#08090a66":"#b8a58b18";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7+(i%5)*3,y+3+(i%4)*4);ctx.lineTo(x+11+(i%6)*3,y+9+(i%3)*3);ctx.stroke();
  if(i%4===0){ctx.fillStyle="#090a0c55";ctx.beginPath();ctx.ellipse(x+16,y+8,9,4,.4,0,Math.PI*2);ctx.fill();}
 }
 if(stageIndex===1){
  ctx.fillStyle="#101419";ctx.fillRect(0,255,W,90);
  ctx.fillStyle="#6f6250";ctx.fillRect(0,261,W,3);ctx.fillRect(0,336,W,3);
  ctx.fillStyle="#d0a94e";ctx.fillRect(0,247,W,4);ctx.fillRect(0,345,W,4);
  for(let x=0;x<W;x+=54){ctx.fillStyle="#3a4145";ctx.fillRect(x,270,28,58);}
 } else if(stageIndex===3){
  for(let i=0;i<18;i++){const x=(i*211+65)%W,y=(i*137+45)%H;
   ctx.fillStyle="#5a899044";ctx.beginPath();ctx.ellipse(x,y,25+(i%4)*8,5+(i%3)*3,-.15,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle="#b5d1ce35";ctx.beginPath();ctx.moveTo(x-15,y);ctx.lineTo(x+16,y-2);ctx.stroke();}
 } else if(stageIndex===4){
  ctx.strokeStyle="#c4a66b20";ctx.lineWidth=2;
  for(let x=70;x<W;x+=140){ctx.beginPath();ctx.moveTo(x,25);ctx.lineTo(x,H-25);ctx.stroke();}
  ctx.fillStyle="#b18b4d18";ctx.fillRect(25,25,W-50,8);
 } else if(stageIndex===5){
  ctx.save();ctx.translate(480,300);ctx.strokeStyle="#a34a4729";ctx.lineWidth=3;
  for(let r=75;r<290;r+=42){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
  for(let a=0;a<Math.PI*2;a+=Math.PI/6){ctx.beginPath();ctx.moveTo(Math.cos(a)*85,Math.sin(a)*85);ctx.lineTo(Math.cos(a)*280,Math.sin(a)*280);ctx.stroke();}
  ctx.restore();
 }
 const glow=ctx.createRadialGradient(480,285,25,480,285,520);
 glow.addColorStop(0,stageIndex===3?"#6a9ba018":"#b58a6014");glow.addColorStop(1,"#05060900");
 ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 for(let i=0;i<42;i++){
  const x=(i*239+Math.sin(t*.25+i)*18)%W;
  const y=(i*127+t*(stageIndex===3?115:15)+H*4)%H;
  ctx.fillStyle=stageIndex===3?"#b7d4d344":"#d9c7a522";
  ctx.fillRect(x,y,stageIndex===3?1:2,stageIndex===3?7:2);
 }
 ctx.strokeStyle="#b8a48a25";ctx.lineWidth=2;ctx.strokeRect(25,25,W-50,H-50);
}
function drawObstacles(){
 obstacles.forEach((o,i)=>{
  ctx.fillStyle="#03040599";ctx.beginPath();ctx.ellipse(o.x+o.w/2,o.y+o.h+8,o.w*.56,10,0,0,Math.PI*2);ctx.fill();
  const isStation=stageIndex===1,isFacility=stageIndex===4;
  const base=isStation?"#30383d":isFacility?"#343638":stageIndex===3?"#354347":"#403b38";
  ctx.fillStyle=base;ctx.fillRect(o.x,o.y,o.w,o.h);
  const grad=ctx.createLinearGradient(o.x,o.y,o.x,o.y+o.h);
  grad.addColorStop(0,"#ffffff22");grad.addColorStop(.18,"#ffffff08");grad.addColorStop(1,"#00000066");
  ctx.fillStyle=grad;ctx.fillRect(o.x,o.y,o.w,o.h);
  ctx.fillStyle="#0a0c0f";ctx.fillRect(o.x+7,o.y+Math.min(17,o.h*.2),Math.max(0,o.w-14),Math.max(8,o.h-25));
  ctx.strokeStyle=isFacility?"#9a8661":"#897866";ctx.lineWidth=2;ctx.strokeRect(o.x+.5,o.y+.5,o.w-1,o.h-1);
  ctx.fillStyle=isFacility?"#b59b6b":"#65594d";ctx.fillRect(o.x+5,o.y+5,o.w-10,4);
  const count=Math.max(2,Math.floor(o.w/28));
  for(let n=0;n<count;n++){
   const wx=o.x+10+n*((o.w-20)/count);
   ctx.fillStyle=isStation?"#a5b8b522":"#d0b28b20";
   ctx.fillRect(wx,o.y+o.h*.36,Math.max(5,o.w/count-9),Math.max(7,o.h*.3));
   ctx.fillStyle="#080a0d66";ctx.fillRect(wx+2,o.y+o.h*.36+2,Math.max(2,o.w/count-13),Math.max(3,o.h*.3-4));
  }
  if(o.h>75){ctx.strokeStyle="#d5c4a51c";ctx.beginPath();ctx.moveTo(o.x+o.w/2,o.y+8);ctx.lineTo(o.x+o.w/2,o.y+o.h-8);ctx.stroke();}
 });
}
function drawBonfire(){ctx.save();ctx.translate(bonfire.x,bonfire.y);ctx.shadowBlur=30;ctx.shadowColor="#e28b3e";ctx.fillStyle="#453a32";ctx.beginPath();ctx.ellipse(0,12,27,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9c8a73";ctx.fillRect(-17,7,34,6);ctx.rotate(-.35);ctx.fillRect(-13,2,28,5);ctx.rotate(.7);ctx.fillRect(-12,0,27,5);let pulse=.5+Math.sin(worldTime*4)*.15;ctx.fillStyle="#f1b45b";ctx.beginPath();ctx.moveTo(0,7);ctx.quadraticCurveTo(-20,-17,0,-42*pulse);ctx.quadraticCurveTo(21,-17,0,7);ctx.fill();ctx.fillStyle="#fff0b5";ctx.beginPath();ctx.ellipse(0,-10,5,14*pulse,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawGate(){ctx.save();ctx.translate(gate.x,gate.y);ctx.strokeStyle=gate.open?"#d0a66d":"#4a4240";ctx.lineWidth=7;ctx.strokeRect(-22,-65,44,130);ctx.lineWidth=2;ctx.strokeStyle=gate.open?"#ffcf88":"#79685b";ctx.beginPath();ctx.moveTo(-13,55);ctx.lineTo(0,-53);ctx.lineTo(13,55);ctx.stroke();if(gate.open){ctx.shadowBlur=24;ctx.shadowColor="#c48a55";ctx.fillStyle="#c18a5133";ctx.fillRect(-16,-56,32,112);}ctx.restore();}

// --- CARREGAMENTO DA IMAGEM E REDESENHO DO JOGADOR ---
const loadSprite = (src) => { const img = new Image(); img.src = src; return img; };
const akiSprite = loadSprite("assets/aki.png");
const enemySprites = {
  stalker: loadSprite("assets/enemy_stalker.png"),
  crawler: loadSprite("assets/enemy_crawler.png"),
  brute: loadSprite("assets/enemy_brute.png")
};
const bossSprite = loadSprite("assets/boss_panic.png");

function drawPlayer(){
 ctx.save();
 ctx.translate(Math.round(player.x), Math.round(player.y));
 
 // Inverte horizontalmente quando o mouse/direção aponta para a esquerda
 const lookingLeft = Math.abs(player.face) > Math.PI / 2;
 if (lookingLeft) {
   ctx.scale(-1, 1);
 }
 
 const moving = !!(keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright);
 const bob = moving ? Math.abs(Math.sin(player.anim * 13)) * 2 : Math.sin(player.anim * 2) * 0.5;
 
 if (player.invuln > 0 && Math.floor(worldTime * 22) % 2 === 0) {
   ctx.globalAlpha = 0.48;
 }
 
 // Sombra no chão
 ctx.fillStyle = "#030407b8";
 ctx.beginPath();
 ctx.ellipse(0, 14, 16, 6, 0, 0, Math.PI * 2);
 ctx.fill();
 
 if (akiSprite.complete && akiSprite.naturalWidth) {
   ctx.imageSmoothingEnabled = false;
   const spriteWidth = 40;
   const spriteHeight = 72;
   ctx.drawImage(
     akiSprite, 
     -spriteWidth / 2, 
     -spriteHeight + 10 + bob, 
     spriteWidth, 
     spriteHeight
   );
 } else {
   ctx.fillStyle = "#171c25";
   ctx.fillRect(-10, -12, 20, 29);
 }
 ctx.restore();
}

function drawEnemy(e){
 if(e.dead)return;
 const sprite = enemySprites[e.type];
 if(sprite && sprite.complete && sprite.naturalWidth){
   const dimensions = {
     stalker: {w:58,h:64, y:5},
     crawler: {w:76,h:68, y:4},
     brute: {w:78,h:76, y:5}
   }[e.type];
   ctx.save();
   ctx.translate(Math.round(e.x), Math.round(e.y));
   // Os sprites são ilustrações frontais/laterais: espelhar é melhor que girar a arte inteira.
   if(Math.cos(e.face) > 0) ctx.scale(-1,1);
   const bob = Math.sin(e.anim) * (e.type === "brute" ? 1 : 2);
   ctx.globalAlpha = e.hitFlash > 0 ? 0.78 : 1;
   ctx.imageSmoothingEnabled = false;
   ctx.drawImage(sprite, -dimensions.w/2, -dimensions.h + dimensions.y + bob, dimensions.w, dimensions.h);
   ctx.restore();
   if(e.hp < e.maxHp){
     const bw = e.type === "brute" ? 48 : 38;
     const by = e.y - dimensions.h - 3;
     ctx.fillStyle = "#09090dcc"; ctx.fillRect(e.x-bw/2,by,bw,4);
     ctx.fillStyle = e.type === "brute" ? "#bd5550" : "#a64b48";
     ctx.fillRect(e.x-bw/2+1,by+1,(bw-2)*Math.max(0,e.hp/e.maxHp),2);
   }
   return;
 }
 ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));ctx.rotate(e.face);
 const bob=Math.sin(e.anim)* (e.type==="brute"?1.2:2.2), flash=e.hitFlash>0;
 const ink="#100d12", bone="#b7a18a", red="#9d393c";
 ctx.fillStyle="#020305aa";ctx.beginPath();ctx.ellipse(0,13,e.r+10,8,0,0,Math.PI*2);ctx.fill();
 if(e.type==="stalker"){
  // Demônio Rastejante: corpo humanoide magro, máscara rachada e braços compridos.
  ctx.strokeStyle=ink;ctx.lineWidth=7;ctx.lineCap="square";
  ctx.beginPath();ctx.moveTo(-7,-2+bob);ctx.lineTo(-15,9);ctx.lineTo(-22,20);ctx.moveTo(7,-2+bob);ctx.lineTo(15,8);ctx.lineTo(23,18);ctx.moveTo(-5,8);ctx.lineTo(-9,22);ctx.moveTo(5,8);ctx.lineTo(10,22);ctx.stroke();
  ctx.fillStyle=flash?"#e8cfc2":"#44343a";ctx.beginPath();ctx.moveTo(-11,-8+bob);ctx.lineTo(-8,-20+bob);ctx.lineTo(0,-25+bob);ctx.lineTo(9,-18+bob);ctx.lineTo(12,-5+bob);ctx.lineTo(7,10+bob);ctx.lineTo(-8,9+bob);ctx.closePath();ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle="#21191f";ctx.fillRect(-7,-18+bob,14,8);ctx.fillStyle="#ef9b65";ctx.fillRect(-6,-16+bob,4,3);ctx.fillRect(3,-16+bob,4,3);
  ctx.strokeStyle=bone;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-3+bob);ctx.lineTo(0,3+bob);ctx.lineTo(5,-3+bob);ctx.stroke();
  ctx.fillStyle=red;ctx.fillRect(-3,5+bob,6,4);
 }else if(e.type==="crawler"){
  // Demônio de esgoto: baixo, quadrúpede, carapaça e espinhos.
  ctx.strokeStyle=ink;ctx.lineWidth=6;ctx.lineCap="square";ctx.beginPath();
  ctx.moveTo(-7,0);ctx.lineTo(-15,8);ctx.lineTo(-19,15);ctx.moveTo(7,0);ctx.lineTo(15,8);ctx.lineTo(19,15);ctx.moveTo(-4,5);ctx.lineTo(-7,15);ctx.moveTo(5,5);ctx.lineTo(8,15);ctx.stroke();
  ctx.fillStyle=flash?"#e8cfc2":"#51434a";ctx.beginPath();ctx.ellipse(0,-2+bob,15,10,-.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle="#21191f";ctx.beginPath();ctx.moveTo(5,-7+bob);ctx.lineTo(15,-14+bob);ctx.lineTo(18,-3+bob);ctx.lineTo(12,5+bob);ctx.lineTo(3,4+bob);ctx.closePath();ctx.fill();
  ctx.fillStyle="#ef9b65";ctx.fillRect(12,-7+bob,4,3);ctx.fillStyle=bone;ctx.fillRect(13,2+bob,6,2);
  ctx.fillStyle="#30252c";for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-9+i*7,-8+bob);ctx.lineTo(-7+i*7,-17-(i%2)*3+bob);ctx.lineTo(-2+i*7,-7+bob);ctx.fill();}
 }else{
  // Brutamontes: grande massa blindada, placas ósseas e chifres.
  ctx.strokeStyle=ink;ctx.lineWidth=10;ctx.lineCap="square";ctx.beginPath();ctx.moveTo(-12,-1);ctx.lineTo(-22,9);ctx.lineTo(-25,18);ctx.moveTo(12,-1);ctx.lineTo(22,9);ctx.lineTo(25,18);ctx.moveTo(-7,12);ctx.lineTo(-10,24);ctx.moveTo(8,12);ctx.lineTo(11,24);ctx.stroke();
  ctx.fillStyle=flash?"#ead0c4":"#49343a";ctx.beginPath();ctx.moveTo(-18,-10+bob);ctx.lineTo(-15,-25+bob);ctx.lineTo(-5,-31+bob);ctx.lineTo(11,-27+bob);ctx.lineTo(19,-12+bob);ctx.lineTo(17,12+bob);ctx.lineTo(5,19+bob);ctx.lineTo(-14,12+bob);ctx.closePath();ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle="#21171e";ctx.fillRect(-12,-22+bob,24,15);ctx.fillStyle="#e87958";ctx.fillRect(-9,-17+bob,6,4);ctx.fillRect(4,-17+bob,6,4);
  ctx.fillStyle="#a28a78";ctx.beginPath();ctx.moveTo(-13,-23+bob);ctx.lineTo(-22,-39+bob);ctx.lineTo(-5,-29+bob);ctx.moveTo(13,-23+bob);ctx.lineTo(22,-39+bob);ctx.lineTo(5,-29+bob);ctx.fill();
  ctx.strokeStyle=red;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-13,-3+bob);ctx.lineTo(0,5+bob);ctx.lineTo(13,-3+bob);ctx.stroke();
 }
 // brilho de impacto e barra de vida compacta
 if(flash){ctx.fillStyle="#fff1df66";ctx.fillRect(-e.r-5,-e.r-17,e.r*2+10,3);}
 ctx.restore();
 if(e.hp<e.maxHp){const bw=e.type==="brute"?48:34,by=e.y-e.r-(e.type==="brute"?31:25);ctx.fillStyle="#09090dcc";ctx.fillRect(e.x-bw/2,by,bw,4);ctx.fillStyle=e.type==="brute"?"#bd5550":"#a64b48";ctx.fillRect(e.x-bw/2+1,by+1,(bw-2)*Math.max(0,e.hp/e.maxHp),2);}
}
function drawBoss(){
 if(boss.dead)return;
 if(bossSprite.complete && bossSprite.naturalWidth){
   const pulse = 1 + Math.sin(worldTime*2.7)*0.018;
   const bob = Math.sin(worldTime*3.5)*2;
   ctx.save();
   ctx.translate(Math.round(boss.x), Math.round(boss.y));
   ctx.fillStyle = "#020204c9";
   ctx.beginPath(); ctx.ellipse(0,34,100,25,0,0,Math.PI*2); ctx.fill();
   ctx.shadowBlur = 34; ctx.shadowColor = boss.hitFlash > 0 ? "#fff0df" : "#9d263c";
   ctx.globalAlpha = boss.hitFlash > 0 ? 0.82 : 1;
   ctx.scale(pulse,pulse);
   ctx.imageSmoothingEnabled = false;
   ctx.drawImage(bossSprite,-132,-178+bob,264,264);
   ctx.restore();
   if(boss.state === "windup" || boss.state === "swing"){
     ctx.save(); ctx.translate(boss.x,boss.y);
     ctx.strokeStyle = "#e05b50"; ctx.lineWidth = boss.state === "windup" ? 4 : 8;
     ctx.shadowBlur = 18; ctx.shadowColor = "#e05b50";
     ctx.beginPath(); ctx.arc(0,0,112,-1.15,1.15); ctx.stroke(); ctx.restore();
   }
   const bw=116,bx=boss.x-bw/2,by=boss.y-177;
   ctx.fillStyle="#08080ddc";ctx.fillRect(bx,by,bw,8);
   ctx.fillStyle="#b63e43";ctx.fillRect(bx+1,by+1,(bw-2)*Math.max(0,boss.hp/boss.maxHp),6);
   ctx.strokeStyle="#c6a16d";ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,8);
   return;
 }
 ctx.save();ctx.translate(Math.round(boss.x),Math.round(boss.y));
 const pulse=1+Math.sin(worldTime*2.7)*.035, breathe=Math.sin(worldTime*3.5)*2;
 ctx.scale(pulse,pulse);
 // Aura e sombra
 ctx.fillStyle="#020204c9";ctx.beginPath();ctx.ellipse(0,35,66,23,0,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=42;ctx.shadowColor="#a52f3c88";ctx.fillStyle="#7d263322";ctx.beginPath();ctx.arc(0,0,68,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 // Manto rasgado e corpo colossal
 ctx.fillStyle=boss.hitFlash>0?"#e5c3b6":"#241c24";ctx.beginPath();ctx.moveTo(-38,-27);ctx.lineTo(-58,-4);ctx.lineTo(-52,37);ctx.lineTo(-32,28);ctx.lineTo(-22,55);ctx.lineTo(-7,37);ctx.lineTo(8,58);ctx.lineTo(22,34);ctx.lineTo(45,43);ctx.lineTo(56,-2);ctx.lineTo(34,-31);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#70414a";ctx.lineWidth=3;ctx.stroke();
 // costelas expostas como placas
 ctx.strokeStyle="#a77a70";ctx.lineWidth=4;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-24,-2+i*10+breathe);ctx.quadraticCurveTo(0,13+i*9+breathe,25,-4+i*10+breathe);ctx.stroke();}
 // pescoço e cabeça de máscara
 ctx.fillStyle="#493038";ctx.fillRect(-16,-43,32,25);
 ctx.fillStyle=boss.hitFlash>0?"#e5c3b6":"#35242c";ctx.beginPath();ctx.moveTo(-30,-37);ctx.lineTo(-25,-65);ctx.lineTo(-11,-58);ctx.lineTo(0,-78);ctx.lineTo(12,-59);ctx.lineTo(29,-67);ctx.lineTo(34,-34);ctx.lineTo(23,-15);ctx.lineTo(0,-9);ctx.lineTo(-23,-17);ctx.closePath();ctx.fill();ctx.strokeStyle="#986052";ctx.lineWidth=3;ctx.stroke();
 // coroa de chifres quebrados
 ctx.fillStyle="#171218";ctx.beginPath();ctx.moveTo(-23,-54);ctx.lineTo(-48,-91);ctx.lineTo(-15,-69);ctx.lineTo(-3,-103);ctx.lineTo(8,-70);ctx.lineTo(43,-92);ctx.lineTo(27,-52);ctx.closePath();ctx.fill();ctx.strokeStyle="#a36c58";ctx.lineWidth=2;ctx.stroke();
 // olhos e boca
 ctx.fillStyle="#100d13";ctx.fillRect(-23,-43,46,19);ctx.shadowBlur=17;ctx.shadowColor="#ff674f";ctx.fillStyle="#ff9a61";ctx.fillRect(-16,-38,9,5);ctx.fillRect(8,-38,9,5);ctx.shadowBlur=0;
 ctx.strokeStyle="#0d0b10";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-14,-15);ctx.lineTo(-4,-10);ctx.lineTo(8,-15);ctx.lineTo(18,-10);ctx.stroke();
 // braços longos e mãos com garras
 ctx.strokeStyle="#241a22";ctx.lineWidth=17;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-30,-22);ctx.lineTo(-53,1);ctx.lineTo(-63,27);ctx.moveTo(30,-22);ctx.lineTo(53,1);ctx.lineTo(64,27);ctx.stroke();
 ctx.strokeStyle="#a66c5d";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-63,27);ctx.lineTo(-73,39);ctx.lineTo(-68,24);ctx.moveTo(-63,27);ctx.lineTo(-56,42);ctx.moveTo(64,27);ctx.lineTo(74,39);ctx.lineTo(69,24);ctx.moveTo(64,27);ctx.lineTo(57,42);ctx.stroke();
 // telegraph visual do golpe
 if(boss.state==="windup"||boss.state==="swing"){
  ctx.strokeStyle="#e05b50";ctx.lineWidth=boss.state==="windup"?4:8;ctx.shadowBlur=18;ctx.shadowColor="#e05b50";ctx.beginPath();ctx.arc(0,0,83,-1.15,1.15);ctx.stroke();ctx.shadowBlur=0;
 }
 ctx.restore();
 // barra de vida flutuante
 const bw=92,bx=boss.x-bw/2,by=boss.y-119;ctx.fillStyle="#08080bdc";ctx.fillRect(bx,by,bw,7);ctx.fillStyle="#b63e43";ctx.fillRect(bx+1,by+1,(bw-2)*Math.max(0,boss.hp/boss.maxHp),5);ctx.strokeStyle="#c6a16d";ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,7);
}
function draw(){ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-.5);}drawFloor();drawObstacles();drawBonfire();drawGate();pickups.forEach(p=>{ctx.fillStyle="#d4b26c";ctx.shadowBlur=12;ctx.shadowColor="#e4bb69";ctx.beginPath();ctx.arc(p.x,p.y,5+Math.sin(worldTime*8)*2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});enemies.forEach(drawEnemy);drawBoss();konEffects.forEach(k=>{ctx.save();let fade=clamp(k.life/k.max,0,1);ctx.globalAlpha=fade;ctx.translate(k.x,k.y);ctx.rotate(k.a);
 ctx.shadowBlur=28;ctx.shadowColor="#e8c36f";ctx.fillStyle="#d7b66d";ctx.strokeStyle="#fff0bd";ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-45,-34);ctx.lineTo(-58,-76);ctx.lineTo(-20,-54);ctx.lineTo(0,-62);ctx.lineTo(24,-54);ctx.lineTo(59,-77);ctx.lineTo(45,-30);ctx.lineTo(35,18);ctx.lineTo(0,48);ctx.lineTo(-35,18);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle="#241d1b";ctx.fillRect(-25,-17,10,5);ctx.fillRect(15,-17,10,5);
 ctx.fillStyle="#fff0bd";ctx.beginPath();ctx.moveTo(-13,12);ctx.lineTo(0,32);ctx.lineTo(13,12);ctx.closePath();ctx.fill();
 ctx.restore();});drawPlayer();particles.forEach(p=>{ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;slashes.forEach(s=>{ctx.save();ctx.globalAlpha=s.life/.2;ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.strokeStyle="#eee0bc";ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,64,-.78,.78);ctx.stroke();ctx.restore();});ctx.restore();}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function pause(){mode="paused";setScreen("pause-screen");}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;worldTime+=dt;update(dt);draw();requestAnimationFrame(loop);}
const movementKeys = new Set(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","shift"]);
function clearPressedKeys(){
  for(const key of Object.keys(keys)) keys[key] = false;
}
window.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(movementKeys.has(k) || k===" " || k==="j" || k==="e") {
    if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) e.preventDefault();
    keys[k]=true;
  }
  if(k===" "&&!e.repeat)dodge();
  if(k==="j"&&!e.repeat)attack();
  if(k==="k"&&!e.repeat)summonKon();
  if(k==="e"&&!e.repeat)interact();
  if(k==="escape"&&!e.repeat&&mode==="playing")pause();
});
window.addEventListener("keyup",e=>{
  keys[e.key.toLowerCase()]=false;
});
window.addEventListener("blur",clearPressedKeys);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden) clearPressedKeys();
});
window.addEventListener("pageshow",clearPressedKeys);
canvas.addEventListener("mousemove",e=>{const p=point(e);mouse.x=p.x;mouse.y=p.y;});
canvas.addEventListener("mousedown",e=>{if(e.button===0){const p=point(e);mouse.x=p.x;mouse.y=p.y;attack();}});
$("start-btn").onclick=resetGame;$("next-stage-btn").onclick=()=>{if(stageIndex<stages.length-1)loadStage(stageIndex+1,true);};$("pause-btn").onclick=()=>{if(mode==="playing")pause();};$("resume-btn").onclick=()=>{mode="playing";setScreen("");};$("restart-btn").onclick=()=>loadStage(checkpointStage,true);$("retry-btn").onclick=()=>loadStage(checkpointStage,true);$("again-btn").onclick=resetGame;
requestAnimationFrame(loop);
})();