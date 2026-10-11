'use strict';
const canvas=document.getElementById('game'),overlay=document.getElementById('overlay'),ctx=overlay.getContext('2d'),$=id=>document.getElementById(id),W=960,H=540;
let renderer;
const combatAudio=new CombatAudio();
const killLines=["Back to hell.","One less demon.","Your ticket to hell.","Not today, demon."];
let lastQuip=-10,quipIndex=-1,quipTimer=0,splats=[];
let mouse={left:false,right:false};
const level=[
'########################',
'#.....#.........#......#',
'#.....#.........#......#',
'#......................#',
'#.....#.........#......#',
'###.###..##.##..###.####',
'#........#...#.........#',
'#........#...#.........#',
'#......................#',
'#.............#........#',
'#...##........#..##....#',
'#...##........#..##....#',
'#......................#',
'####.###........###.####',
'#......#........#......#',
'#......#........#......#',
'#......................#',
'#......#........#......#',
'########################'];
let p,enemies,items,seals,shots,particles,mode='menu',time=0,kills=0,cooldown=0,flash=0,hurt=0,notice=0,weapon=0,ammo,mapShown=false,finalWave=false,keys={},last=0,sound=true,audio;
const exit={x:12,y:1.7};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function solid(x,y){return (level[Math.floor(y)]?.[Math.floor(x)]??'#')==='#'}
function clear(x,y){return !solid(x-.2,y-.2)&&!solid(x+.2,y-.2)&&!solid(x-.2,y+.2)&&!solid(x+.2,y+.2)}
function move(o,dx,dy){if(clear(o.x+dx,o.y))o.x+=dx;if(clear(o.x,o.y+dy))o.y+=dy}
function line(x,y,xx,yy){let d=Math.hypot(xx-x,yy-y);for(let i=.15;i<d;i+=.12)if(solid(x+(xx-x)*i/d,y+(yy-y)*i/d))return false;return true}
function demon(x,y,type=0){return{x,y,type,hp:[55,75,230][type],cd:1+Math.random(),hit:0}}
function reset(){p={x:12,y:16.4,a:-Math.PI/2,pitch:0,hp:100};enemies=[demon(10,12),demon(15,11),demon(3,8),demon(5,2,1),demon(20,3,1),demon(19,8),demon(3,15),demon(20,15,1),demon(12,4,2)];items=[{x:3,y:16,type:'health'},{x:20,y:16,type:'ammo'},{x:2,y:3,type:'ammo'},{x:21,y:3,type:'health'},{x:7,y:8,type:'health'},{x:17,y:8,type:'ammo'},{x:1.6,y:11.5,type:'secret'}];seals=[{x:3,y:2.5,on:true},{x:20,y:2.5,on:true},{x:12,y:7.5,on:true}];shots=[];particles=[];splats=[];lastQuip=-10;quipTimer=0;combatAudio.stopVoice();$('quip').textContent='';ammo=[48,18];weapon=0;time=kills=cooldown=flash=hurt=notice=0;finalWave=false;mapShown=false;keys={};mouse={left:false,right:false};}
function tone(f=100,d=.1,type='sawtooth',vol=.08){if(!sound||!audio)return;let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,f/3),audio.currentTime+d);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
function tell(t){$('message').textContent=t;notice=3}
function finish(win){combatAudio.stopVoice();mode=win?'won':'dead';document.exitPointerLock?.();$('veil').style.display='flex';$('crosshair').style.display='none';document.querySelector('.eyebrow').textContent=win?'YOU MADE IT THROUGH HELL.':'HELL CAUGHT UP WITH YOU.';document.querySelector('h1').innerHTML=win?'THE GATE<br><em>IS OPEN</em>':'YOU ARE<br><em>DEAD</em>';$('description').textContent=win?`${kills} demons killed · ${Math.floor(time/60)} min ${Math.floor(time%60)} s. You are free.`:'The seals are still waiting. Pick up your weapon.';$('play').textContent='TRY AGAIN →';$('hint').textContent='ONE MORE TRY. ONE MORE CHANCE.'}
function verticalHit(e){const d=Math.hypot(e.x-p.x,e.y-p.y),height=e.type===2?2.2:1.65,aimHeight=1.05+Math.tan(p.pitch)*d;return aimHeight>-.1&&aimHeight<height;}
function shoot(){if(mode!=='playing'||cooldown>0)return;if(ammo[weapon]<=0){tell('Out of ammo — switch weapons [1 / 2]');cooldown=.3;return}ammo[weapon]--;cooldown=weapon?.65:.28;flash=.14;combatAudio.shot(weapon);let candidates=enemies.filter(e=>e.hp>0&&verticalHit(e)&&line(p.x,p.y,e.x,e.y)&&Math.abs(angle(Math.atan2(e.y-p.y,e.x-p.x)-p.a))<(weapon?.19:.065)+.12/Math.hypot(e.x-p.x,e.y-p.y)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));for(let e of candidates.slice(0,weapon?3:1)){e.hp-=weapon?Math.max(24,110-Math.hypot(e.x-p.x,e.y-p.y)*8):34;e.hit=.2;bloodBurst(e,e.hp<=0);combatAudio.impact();if(e.hp<=0){kills++;killQuip();}}}
function bloodBurst(enemy,dead){
  const d=Math.hypot(enemy.x-p.x,enemy.y-p.y),height=clamp(1.05+Math.tan(p.pitch)*d,.3,enemy.type===2?1.9:1.45),count=dead?32:16;
  for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,speed=.4+Math.random()*1.8;particles.push({x:enemy.x,y:enemy.y,z:height,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,vz:.5+Math.random()*2.1,size:.025+Math.random()*.055,life:1.1+Math.random()*.5})}
  splats.push({x:enemy.x,y:enemy.y,size:dead?.8:.4,life:28});particles=particles.slice(-240);splats=splats.slice(-70);
}
function killQuip(){if(time-lastQuip<4.5)return;lastQuip=time;quipIndex=(quipIndex+1)%killLines.length;quipTimer=3;$('quip').textContent='“'+killLines[quipIndex]+'”';combatAudio.say(quipIndex,killLines[quipIndex])}
function updateBlood(dt){
  for(let b of particles){b.life-=dt;b.vz-=5.5*dt;const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;if(!solid(nx,ny)){b.x=nx;b.y=ny}else{b.vx*=-.15;b.vy*=-.15}b.z+=b.vz*dt;if(b.z<=.02){splats.push({x:b.x,y:b.y,size:b.size*3,life:22});b.life=0}}
  particles=particles.filter(b=>b.life>0);for(let b of splats)b.life-=dt;splats=splats.filter(b=>b.life>0).slice(-70);
  quipTimer=Math.max(0,quipTimer-dt);if(!quipTimer)$('quip').textContent='';
}
function interact(){for(let s of seals)if(s.on&&Math.hypot(s.x-p.x,s.y-p.y)<1.6){s.on=false;tone(340,.5,'triangle',.15);let n=seals.filter(s=>!s.on).length;tell(`Seal broken — ${n} / 3`);if(n===3){finalWave=true;enemies.push(demon(10,3),demon(14,3),demon(12,9,1));tell('THE GATE IS OPEN! Head north.');}return}}
function damage(n){p.hp=Math.max(0,p.hp-n);hurt=.45;tone(55,.18,'sawtooth',.12);if(!p.hp)finish(false)}
function update(dt){time+=dt;updateBlood(dt);cooldown=Math.max(0,cooldown-dt);flash=Math.max(0,flash-dt);hurt=Math.max(0,hurt-dt);notice-=dt;if(notice<=0)$('message').textContent='';let f=(keys.w||keys.z||mouse.right?1:0)-(keys.s?1:0),r=(keys.d?1:0)-(keys.a||keys.q?1:0),speed=(keys.shift?3.9:2.8)*dt/Math.max(1,Math.hypot(f,r));p.a+=((keys.arrowright?1:0)-(keys.arrowleft?1:0))*dt*2;move(p,(Math.cos(p.a)*f-Math.sin(p.a)*r)*speed,(Math.sin(p.a)*f+Math.cos(p.a)*r)*speed);p.pitch=clamp(p.pitch+((keys.arrowup?1:0)-(keys.arrowdown?1:0))*dt*1.3,-1.35,1.35);if(keys[' ']||mouse.left)shoot();
for(let e of enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.cd-=dt;let d=Math.hypot(p.x-e.x,p.y-e.y),visible=line(e.x,e.y,p.x,p.y);if(d<10&&visible){let a=Math.atan2(p.y-e.y,p.x-e.x);if(d>(e.type===1?3:.75))move(e,Math.cos(a)*dt*[1.35,.65,.65][e.type],Math.sin(a)*dt*[1.35,.65,.65][e.type]);if(e.cd<=0){if(e.type===1){shots.push({x:e.x,y:e.y,dx:Math.cos(a)*3.2,dy:Math.sin(a)*3.2});e.cd=2.3}else if(d<1){damage(e.type===2?22:9);e.cd=.95}}}}
for(let s of shots){s.x+=s.dx*dt;s.y+=s.dy*dt;if(solid(s.x,s.y))s.dead=true;if(Math.hypot(s.x-p.x,s.y-p.y)<.3){damage(12);s.dead=true}}shots=shots.filter(s=>!s.dead);
for(let i of items){if(i.used||Math.hypot(i.x-p.x,i.y-p.y)>.6)continue;if(i.type==='health'&&p.hp===100)continue;i.used=true;if(i.type==='health'){p.hp=Math.min(100,p.hp+35);tell('Health +35')}else{ammo[0]+=24;ammo[1]+=8;if(i.type==='secret'){p.hp=Math.min(100,p.hp+25);tell('Secret found — the damned’s stash!')}else tell('Ammo picked up')}tone(480,.16,'triangle')}
if(finalWave&&Math.hypot(p.x-exit.x,p.y-exit.y)<.85)finish(true);hud();}
function hud(){$('health').innerHTML=Math.ceil(p.hp)+' <i>%</i>';$('healthbar').style.width=p.hp+'%';$('ammo').textContent=ammo[weapon];$('weapon').textContent=weapon?'SHOTGUN':'REVOLVER';$('kills').textContent=kills+' DEMONS KILLED';$('seals').textContent=seals.map(s=>s.on?'◇':'◆').join(' ');$('timer').textContent=String(Math.floor(time/60)).padStart(2,'0')+':'+String(Math.floor(time%60)).padStart(2,'0');$('status').textContent=finalWave?'REACH THE NORTHERN GATE':'BREAK THE THREE SEALS';$('damage').style.opacity=hurt*.65;}
// Procedural pixel sprites: every asset is generated locally.
function sprite(type){let c=document.createElement('canvas');c.width=c.height=64;let g=c.getContext('2d');const rect=(color,x,y,w,h)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};if(typeof type==='number'){let color=['#ae4327','#814a58','#703124'][type];rect('#271713',15,52,13,10);rect('#271713',36,52,13,10);rect(color,16,25,32,29);rect(color,8,31,10,20);rect(color,46,31,10,20);rect('#e0b787',8,48,8,5);rect('#e0b787',48,48,8,5);rect(color,21,12,22,20);rect('#d0b49a',17,3,6,14);rect('#d0b49a',41,3,6,14);rect('#5b201b',24,30,16,19);rect('#f9b62b',24,19,5,4);rect('#f9b62b',35,19,5,4);rect('#160b09',26,27,12,4);rect('#efcca0',28,27,3,5);rect('#efcca0',34,27,3,5);if(type===2){rect('#caa88b',12,23,8,10);rect('#caa88b',44,23,8,10);rect('#ee6121',27,35,10,8)}if(type===1){rect('#ef692d',4,39,9,9);rect('#ffde73',6,41,5,5)}}else if(type==='seal'){g.strokeStyle='#f56a35';g.lineWidth=3;g.beginPath();g.arc(32,32,22,0,Math.PI*2);g.stroke();g.beginPath();for(let n=0;n<6;n++){let a=-Math.PI/2+n*4*Math.PI/5;let x=32+Math.cos(a)*19,y=32+Math.sin(a)*19;n?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}else if(type==='portal'){rect('#3c291e',8,2,48,62);rect('#5d5141',12,4,40,60);rect('#120d1c',18,10,28,54);rect('#ad4dd8',21,13,22,51);rect('#efd6ff',27,18,10,46)}else if(type==='fire'){rect('#d82e12',20,20,24,24);rect('#ff9b26',24,24,16,16);rect('#fff5aa',28,28,8,8)}else{rect(type==='health'?'#d3c6a5':'#847047',16,30,32,24);if(type==='health'){rect('#b13522',28,33,8,18);rect('#b13522',23,38,18,8)}else{rect('#e8b65b',21,34,5,13);rect('#e8b65b',30,34,5,13);rect('#e8b65b',39,34,5,13)}}return c}
const sprites={0:sprite(0),1:sprite(1),2:sprite(2),seal:sprite('seal'),portal:sprite('portal'),fire:sprite('fire'),health:sprite('health'),ammo:sprite('ammo'),secret:sprite('ammo')};
function render(){
ctx.clearRect(0,0,W,H);if(!renderer?.ready)return;
let objects=[...splats.map(b=>({...b,kind:'bloodstain',ground:true,opacity:Math.min(1,b.life/3)})),...particles.map(b=>({...b,kind:'blood',height:b.size,base:b.z})),...enemies.filter(e=>e.hp>0).map(e=>({...e,kind:e.type,height:e.type===2?2.2:1.65})),...items.filter(i=>!i.used).map(i=>({...i,kind:i.type,height:.45})),...seals.filter(s=>s.on).map(s=>({...s,kind:'seal'})),...shots.map(s=>({...s,kind:'fire'})),{...exit,kind:'portal',height:2.5,active:finalWave}];
renderer.draw(p,objects,time);
let moving=mode==='playing'&&(mouse.right||keys.w||keys.z||keys.s||keys.a||keys.q||keys.d),bob=moving?Math.sin(time*10)*5:0,recoil=flash/.14;
let size=weapon?390:330,cx=W*.5+35,top=H*.54+bob+recoil*26;
ctx.imageSmoothingEnabled=true;ctx.drawImage(renderer.weapons[weapon],cx-size/2,top,size,size);
if(flash>0){let mx=cx,my=top+size*.025;ctx.save();ctx.globalCompositeOperation='screen';let fire=ctx.createRadialGradient(mx,my,2,mx,my,80);fire.addColorStop(0,'#ffffe5');fire.addColorStop(.25,'#ffd65df0');fire.addColorStop(.6,'#f7632190');fire.addColorStop(1,'#ff450000');ctx.fillStyle=fire;ctx.fillRect(mx-80,my-80,160,160);ctx.restore()}
if(mapShown)drawMap();
}
function drawMap(){const scale=7,ox=12,oy=12;ctx.fillStyle='#0c0808df';ctx.fillRect(8,8,176,143);for(let y=0;y<level.length;y++)for(let x=0;x<level[y].length;x++){ctx.fillStyle=solid(x,y)?'#79634c':'#211810';ctx.fillRect(ox+x*scale,oy+y*scale,scale-1,scale-1)}for(let s of seals){ctx.fillStyle=s.on?'#f47c32':'#685441';ctx.fillRect(ox+s.x*scale-2,oy+s.y*scale-2,4,4)}ctx.fillStyle=finalWave?'#bd70ef':'#675571';ctx.fillRect(ox+exit.x*scale-2,oy+exit.y*scale-2,4,4);ctx.fillStyle='#ffebad';ctx.beginPath();ctx.arc(ox+p.x*scale,oy+p.y*scale,3,0,7);ctx.fill();ctx.strokeStyle='#ffebad';ctx.beginPath();ctx.moveTo(ox+p.x*scale,oy+p.y*scale);ctx.lineTo(ox+(p.x+Math.cos(p.a))*scale,oy+(p.y+Math.sin(p.a))*scale);ctx.stroke()}
function pause(){if(mode!=='playing')return;mode='paused';combatAudio.stopVoice();keys={};mouse={left:false,right:false};$('veil').style.display='flex';$('crosshair').style.display='none';document.querySelector('.eyebrow').textContent='CATCH YOUR BREATH.';document.querySelector('h1').innerHTML='HELL<br><em>CAN WAIT</em>';$('description').textContent='The fortress is waiting. So are the demons.';$('play').textContent='RESUME →';$('hint').textContent='USE ARROW KEYS IF MOUSE CAPTURE IS UNAVAILABLE'}
$('play').onclick=()=>{if(mode!=='paused')reset();mode='playing';$('veil').style.display='none';$('crosshair').style.display='block';if(!audio){try{audio=new(window.AudioContext||window.webkitAudioContext)()}catch{}}audio?.resume();combatAudio.init(audio);combatAudio.setMuted(!sound);try{let result=canvas.requestPointerLock?.();result?.catch(()=>tell('Mouse capture unavailable: use arrow keys to look around.'))}catch{tell('Use arrow keys to look around.')}tell('Left click: fire · Hold right click: move forward · E: seals');hud()};
$('sound').onclick=()=>{sound=!sound;combatAudio.setMuted(!sound);$('sound').textContent='SOUND: '+(sound?'ON':'OFF')};document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas)pause()});document.addEventListener('mousemove',e=>{if(mode==='playing'&&document.pointerLockElement===canvas){p.a=angle(p.a+e.movementX*.0025);p.pitch=clamp(p.pitch-e.movementY*.0025,-1.35,1.35)}});canvas.addEventListener('mousedown',e=>{if(mode!=='playing')return;e.preventDefault();if(e.button===0){mouse.left=true;shoot()}if(e.button===2)mouse.right=true;});document.addEventListener('mouseup',e=>{if(e.button===0)mouse.left=false;if(e.button===2)mouse.right=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown'].includes(k))e.preventDefault();keys[k]=true;if(mode==='playing'){if(k==='1')weapon=0;if(k==='2')weapon=1;if(k==='e'&&!e.repeat)interact();if(k==='m'&&!e.repeat)mapShown=!mapShown;if(k==='escape'){pause();document.exitPointerLock?.()}}});document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{pause();keys={};mouse={left:false,right:false}});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function frame(t){let dt=Math.min((t-last)/1000,.04);last=t;if(mode==='playing')update(dt);render();requestAnimationFrame(frame)}reset();hud();$('play').disabled=true;$('play').textContent='LOADING THE FORTRESS…';
try{renderer=new HellRenderer(canvas,level);renderer.load(sprites).then(()=>{$('play').disabled=false;$('play').textContent='ENTER HELL →';requestAnimationFrame(frame)}).catch(showLoadError)}catch(error){showLoadError(error)}
function showLoadError(error){$('description').textContent=error.message;$('play').textContent='RELOAD';$('play').disabled=false;$('play').onclick=()=>location.reload();}
