const path=require('node:path');
process.chdir(path.resolve(__dirname,'../..'));
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{style:{},textContent:'',innerHTML:'',setAttribute(){},addEventListener(){},focus(){},getContext(){return context}});return elements.get(id)};
const sandbox={console,Math,document:{getElementById:el,createElement:()=>el(Math.random()),querySelector:el,addEventListener(){},exitPointerLock(){}},window:{addEventListener(){}},CombatAudio:class{stopVoice(){}setGameplayActive(){}stopCinematicMusic(){}startCinematicMusic(){}stoneDoor(){}shot(){}impact(){}say(){}},requestAnimationFrame(){}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('outbreak/dist/intro.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('outbreak/dist/world.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('outbreak/dist/decals.js','utf8'),sandbox);let source=fs.readFileSync('outbreak/dist/game.js','utf8');source=source.slice(0,source.indexOf('try{renderer=new HellRenderer'));vm.runInContext(source,sandbox);
vm.runInContext(`
const check=(v,m)=>{if(!v)throw Error(m)};
function reachable(x,y){const q=[[Math.floor(p.x),Math.floor(p.y)]],seen=new Set(q.map(v=>v.join(',')));for(let i=0;i<q.length;i++){let [a,b]=q[i];for(let [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let n=[a+dx,b+dy],k=n.join(',');if(bodyFits(n[0]+.5,n[1]+.5)&&!seen.has(k)){seen.add(k);q.push(n)}}}return seen.has([Math.floor(x),Math.floor(y)].join(','))}
check(officeDoors.length===6&&officeDoors.every(d=>d.width===2),'Six larger double-width office doors');check(!reachable(seals[0].x,seals[0].y),'Offices initially closed');
const d=officeDoors[0];p.x=d.x+1.6;p.y=d.y+.5;p.a=Math.PI;interact();check(d.open&&!solid(d.x,d.y),'E opens office door');updateOfficeDoors(.5);check(d.progress===1,'Door animation completes');
for(let d of officeDoors)openOfficeDoor(d);p.x=19.5;p.y=53.5;
check(seals.slice(0,2).every(s=>reachable(s.x,s.y)),'B5 terminals reachable');check(!reachable(19,20),'Court locked before systems');
for(let s of seals.slice(0,2)){p.x=s.x;p.y=s.y;activateSeals()}
check(stage===1&&reachable(19,20),'B5 fire door');p.y=30;activateSeals();check(stage===2&&reachable(seals[2].x,seals[2].y),'B4 entrance');check(!reachable(19,3),'Boss chamber locked');
p.x=seals[2].x;p.y=seals[2].y;activateSeals();check(stage===3&&reachable(19,3),'Boss door');
check(!reachable(2.5,39.5)&&!reachable(38,11.5),'Secrets initially sealed');check(hiddenMapCell(2,39)&&hiddenMapCell(38,11),'Map hides caches');
for(let d of secretDoors){p.x=d.id==='plasma'?5.5:34.5;p.y=d.y+.5;p.a=d.id==='plasma'?Math.PI:0;interact();check(d.opening,'Secret interaction');updateSecrets(.8);check(d.opened,'Secret opens')}
check(secretsFound===2&&!hiddenMapCell(2,39),'Secrets revealed');
for(let o of [...items,...enemies])check(!solid(o.x,o.y)&&reachable(o.x,o.y),'Invalid or unreachable spawn '+JSON.stringify(o));
for(let i of items.filter(i=>['chainsaw','heavy','rocket','plasma','bfg'].includes(i.type))){p.x=i.x;p.y=i.y;collectItems()}
check(owned.every(Boolean),'All seven weapons available');check(ammoSlot(6)===5,'BFG shares plasma cells');
p.x=19;p.y=6;activateSeals();check(bossAwake,'Boss activation');enemies.find(e=>e.type===3).hp=0;activateSeals();check(mode==='ending','Victory begins ending cinema');opening.finish(true);check(mode==='won','Ending completes victory');
reset();check(stage===0&&!bossAwake&&enemies.find(e=>e.type===3).hp===1800&&solid(19,34)&&officeDoors.every(d=>!d.open)&&secretDoors.every(d=>!d.opened)&&owned.filter(Boolean).length===2,'Restart clears all progression');
check(outdoor(19,24)&&ceilingAt(19,24)>50,'Open-air courtyard');check(!bodyFits(39,23)&&!bodyFits(6,20),'Cars and trunks block movement');
// Weapon behavior: melee reach, projectile collision, splash occlusion, charge and ammunition.
reset();mode='playing';owned.fill(true);p.x=19.5;p.y=45.5;p.a=-Math.PI/2;p.pitch=0;
enemies=[demon(19.5,44.5)];weapon=3;shoot();check(enemies[0].hp===33&&ammo[3]===Infinity,'Chainsaw melee and unlimited fuel');cooldown=0;enemies=[demon(19.5,42.5)];shoot();check(enemies[0].hp===65,'Chainsaw limited reach');
weapon=4;ammo[4]=8;cooldown=0;enemies=[demon(19.5,41.5),demon(20.5,41.5)];shoot();check(playerShots.length===1&&ammo[4]===7,'Rocket launch');for(let i=0;i<40;i++)updatePlayerShots(.02);check(enemies[0].hp<=0&&enemies[1].hp<65,'Rocket direct hit and splash');
enemies=[demon(14.5,45.5)];explodeShot({x:16.5,y:45.5,z:1,kind:'rocket',damage:120,sourceYaw:Math.PI});check(enemies[0].hp===65,'Closed office door shields blast');
playerShots=[];explosions=[];weapon=5;ammo[5]=100;cooldown=0;enemies=[demon(19.5,43.5)];shoot();for(let i=0;i<20;i++)updatePlayerShots(.01);check(enemies[0].hp===33&&ammo[5]===99,'Plasma flight and hit');
playerShots=[];weapon=6;cooldown=0;ammo[5]=80;enemies=[demon(19.5,42.5,2)];shoot();check(charging&&playerShots.length===0&&ammo[5]===40,'BFG charge and cost');updatePlayerShots(.3);check(charging&&playerShots.length===0,'BFG charge persists');for(let i=0;i<70;i++)updatePlayerShots(.02);check(!charging&&enemies[0].hp<=0,'BFG charge, flight and blast');cooldown=0;ammo[5]=39;shoot();check(!charging&&ammo[5]===39,'BFG requires forty cells');
reset();mode='playing';owned[4]=true;weapon=4;ammo[4]=5;p.x=19.5;p.y=35.5;p.a=-Math.PI/2;enemies=[];shoot();for(let i=0;i<20;i++)updatePlayerShots(.02);check(playerShots.length===0&&p.hp<100,'Rocket wall collision and self damage');
reset();mode='playing';enemies=[];p.x=19.5;p.y=45.5;p.a=Math.PI;p.pitch=0;shoot();check(decals.length>0&&decals[0].nx===1,'Hitscan leaves impact on wall');const count=decals.length;updateBlood(600);check(decals.length===count,'Wall impact persists');
const mark=traceSurface(19.5,45.5,1.05,0,0,-1,3);check(mark&&mark.nz===1&&Math.abs(mark.z-.012)<.001,'Floor trace normal');addMark(mark,'bloodstain',.4);let old=decals.length;updateBlood(600);check(decals.length===old,'Blood decal persists');
splats.push({x:19,y:45,base:.012,size:.4,life:Infinity});updateBlood(600);check(splats.length===1,'Floor blood persists');reset();check(decals.length===0&&splats.length===0,'Restart clears persistent traces');
const e=demon(19,45);e.a=0;p.x=22;p.y=45;check(enemySprite(e)==='enemy0_0_0','Front view');p.x=16;check(enemySprite(e)==='enemy0_2_0','Back view');p.x=19;p.y=48;check(enemySprite(e)==='enemy0_1_0','Profile view');e.moving=true;e.walk=.6;check(enemySprite(e).endsWith('_1'),'Walking frame changes');
`,sandbox);
const inferno=fs.readFileSync('inferno/dist/game.js','utf8').match(/const WEAPONS=([^;]+)/)[1];
assert.equal(vm.runInContext('JSON.stringify(WEAPONS.slice(0,3))',sandbox),JSON.stringify(vm.runInNewContext(inferno)));
console.log('PASS: larger office doors, ordered campaign, accessible spawns, secrets, seven weapons, projectile damage, persistent impacts/blood, boss/ending transitions and reset; original Inferno weapon stats preserved.');
