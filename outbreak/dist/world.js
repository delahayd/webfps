'use strict';
const WORLD_WIDTH=65,WORLD_DEPTH=73;
let level=[],secretDoors=[],officeDoors=[],secretsFound=0;
const FIRST_FLOOR=4;
const stairAt=(x,y)=>x>=12&&x<15&&y>=38&&y<47?'B':x>=18&&x<26&&y>=8&&y<11?'A':null;
const floorAt=(x,y)=>{const stair=stairAt(x,y);if(stair==='B')return Math.max(0,Math.min(4,Math.floor((46.5-y)*2+.00001)*.25));if(stair==='A')return Math.max(0,Math.min(4,Math.floor((x-18)*2+.00001)*.25));if((x<4&&y>=36&&y<61)||(x<13&&y>=61&&y<71)||(y>=36&&y<42&&x<16)||(y>=1&&y<8)||(x>=36&&x<64&&y>=1&&y<14)||(x>=26&&x<36&&y>=8&&y<11))return FIRST_FLOOR;return 0};
const secretTerrace=(x,y)=>x>=1&&x<13&&y>=61&&y<71;
const administrationAt=(x,y)=>x>=24&&x<35&&y>=11&&y<14;
const outdoor=(x,y)=>!administrationAt(x,y)&&(secretTerrace(x,y)||(y>=15&&y<34)||(x>=48&&y>=38&&y<70));
const ceilingAt=(x,y)=>outdoor(x,y)?80:stairAt(x,y)?8:floorAt(x,y)+3.8;
const cellAt=(x,y)=>level[Math.floor(y)]?.[Math.floor(x)]??'#';
const solid=(x,y)=>['#','D'].includes(cellAt(x,y));
const setCell=(x,y,value)=>{level[y]=level[y].slice(0,x)+value+level[y].slice(x+1)};
const campusTrees=[[6,20],[10,27],[40,20],[37,29],[4,30],[41,18]];
const campusCars=[{x:39,y:23,color:[.58,.09,.08]},{x:39,y:27,color:[.12,.23,.39]},{x:39,y:31,color:[.7,.73,.72]}].map(c=>({...c,maxHp:180,hp:180,destroyed:false}));
function propBlocks(x,y){return outdoor(x,y)&&(campusTrees.some(([a,b])=>Math.hypot(x-a,y-b)<.4)||campusCars.some(c=>!c.destroyed&&Math.abs(x-c.x)<1&&Math.abs(y-c.y)<1.95))}
function resetWorld(){
 for(const c of campusCars){c.destroyed=false;c.hp=c.maxHp}
 const g=Array.from({length:WORLD_DEPTH},()=>Array(WORLD_WIDTH).fill('#'));
 const carve=(x1,y1,x2,y2)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)g[y][x]='.'};
 // Building B: reception, spine, Computer Science and microelectronics offices.
 carve(16,35,22,55);carve(5,50,32,55);carve(5,57,40,70);carve(17,54,21,59);carve(35,43,44,53);carve(30,50,38,52);
 for(let y of [36,43]){carve(5,y,14,y+5);carve(24,y,33,y+5);carve(14,y+2,24,y+3)}
 carve(1,15,45,33);
 // Building A: offices and robotics, northern director chamber.
 carve(16,9,22,14);carve(4,9,14,13);carve(24,9,34,13);carve(14,11,24,12);
 carve(11,1,27,7);carve(18,8,20,8);
 officeDoors=[];
 const door=(x,y,axis,label)=>{for(let n=0;n<2;n++)g[y+n][x]='D';officeDoors.push({x,y,axis,label,width:2,open:false,progress:0})};
 for(let y of [36,43]){
  for(let yy=y;yy<=y+5;yy++){g[yy][15]='#';g[yy][23]='#'}
  door(15,y+2,'x','COMPUTER SCIENCE OFFICE');door(23,y+2,'x','MICROELECTRONICS OFFICE');
 }
 for(let x of [15,23]){g[11][x]='#';g[12][x]='#';door(x,x===15?11:12,'x',x===15?'ROBOTICS OFFICE':'ADMINISTRATION OFFICE')}
 // Physical sixteen-riser stairways and upstairs wings (4 m above ground).
 for(let y=36;y<=46;y++)g[y][11]='#';
 for(let y=38;y<=46;y++)g[y][15]='#';
 carve(12,36,14,47);carve(12,47,18,47);
 officeDoors=officeDoors.filter(d=>!(d.x===15&&d.y===38));
 door(11,36,'x','COMPUTER SCIENCE OFFICE');
 carve(11,1,34,7);carve(18,8,20,9);
 for(let y=5;y<=7;y++){g[y][17]='#';g[y][21]='#'}
 // Stairwell opens onto a broad landing, then into one continuous guard hall.
 for(let y=1;y<=7;y++)for(let x=1;x<=16;x++)g[y][x]='#';
 carve(18,1,46,4);carve(22,2,46,7);carve(36,8,46,13);
 // Ground-floor administration remains separate from the upper guard hall.
 for(let x=24;x<=35;x++)g[8][x]='#';
 for(let y=11;y<=13;y++)g[y][35]='#';
 // East-facing staircase opens straight into the upper hall, with no wall ahead.
 carve(18,8,46,10);carve(16,9,17,11);
 for(let x=18;x<=25;x++)g[7][x]='#';
 for(let x=18;x<=21;x++)g[11][x]='#';
 for(let x=26;x<=35;x++)g[11][x]='#';
 // Monumental four-metre double door and a larger director's office.
 carve(50,1,62,13);carve(47,5,50,8);
 officeDoors.push({x:48,y:5,axis:'x',label:'DIRECTOR — SECURITY BULKHEAD',width:4,open:false,progress:0,boss:true});
 // The final office stays locked until the upstairs guards have fallen.
 for(let y=5;y<=8;y++)g[y][48]='D';
 // Fire-door interlocks retain the campaign order.
 for(let x=16;x<=22;x++){g[34][x]='#';g[14][x]='#'}
 for(let y=8;y<=10;y++)g[y][18]='#';
 // Concealed service tunnels, each with one wall panel hiding a weapon cache.
 carve(1,36,3,48);carve(1,45,3,59);carve(1,58,3,60);carve(1,61,12,70);
 for(let y=61;y<=70;y++)g[y][13]='#';
 carve(44,35,46,37);carve(44,35,50,37);carve(49,36,51,40);carve(48,38,62,69);
 secretDoors=[
  {id:'plasma',x:4,y:38,axis:'x',hintX:5.012,hintY:38.5,cells:[[4,38]],opened:false,opening:false,remaining:0,label:'SERVICE PANEL'},
  {id:'bfg',x:43,y:34,axis:'y',hintX:43.5,hintY:33.988,cells:[[43,34],[43,35]],opened:false,opening:false,remaining:0,label:'RESTRICTED ARCHIVE'}
 ];
 level=g.map(r=>r.join(''));secretsFound=0;
}
function hiddenMapCell(x,y){return (x<=4&&y>=36&&y<=60||x<=12&&y>=61)&&!secretDoors[0]?.opened||(x>=44&&y>=35||x>=48&&y>=38)&&!secretDoors[1]?.opened}
function bodyFits(x,y){const h=floorAt(x,y);return !propBlocks(x,y)&&!(typeof furnitureBlocks==='function'&&furnitureBlocks(x,y,h+.5))&&[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].every(([dx,dy])=>!solid(x+dx,y+dy)&&Math.abs(floorAt(x+dx,y+dy)-h)<=.3&&!propBlocks(x+dx,y+dy))}
function move(o,dx,dy){const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.07));for(let i=0;i<count;i++){const x=o.x+dx/count,y=o.y+dy/count,h=floorAt(o.x,o.y);if(bodyFits(x,o.y)&&Math.abs(floorAt(x,o.y)-h)<=.3)o.x=x;if(bodyFits(o.x,y)&&Math.abs(floorAt(o.x,y)-floorAt(o.x,o.y))<=.3)o.y=y}o.z=floorAt(o.x,o.y)}
function line(x,y,xx,yy,z=floorAt(x,y)+1.05,zz=floorAt(xx,yy)+1.05){const distance=Math.hypot(xx-x,yy-y);for(let step=.08;step<distance;step+=.08){const t=step/distance,px=x+(xx-x)*t,py=y+(yy-y)*t,h=z+(zz-z)*t;if(solid(px,py)||h<floorAt(px,py)+.025||h>ceilingAt(px,py)-.025||(h<1.4&&propBlocks(px,py))||(typeof furnitureBlocks==='function'&&furnitureBlocks(px,py,h)))return false}return true}
function closestOfficeDoor(p){return officeDoors.find(d=>Math.abs(p.z-floorAt(d.x,d.y))<.4&&Math.hypot(p.x-d.x-.5,p.y-d.y-d.width/2)<1.8&&Math.abs(Math.atan2(Math.sin(Math.atan2(d.y+d.width/2-p.y,d.x+.5-p.x)-p.a),Math.cos(Math.atan2(d.y+d.width/2-p.y,d.x+.5-p.x)-p.a)))<.9)}
function updateOfficeDoors(dt){for(let d of officeDoors)d.progress=Math.min(1,d.progress+(d.open?dt*2.5:0))}
function openOfficeDoor(d){if(d.open||d.boss&&!bossGateOpen)return;d.open=true;for(let n=0;n<d.width;n++)setCell(d.x,d.y+n,'.')}
resetWorld();
