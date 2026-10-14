'use strict';
const WORLD_WIDTH=47,WORLD_DEPTH=57;
let level=[],secretDoors=[],officeDoors=[],secretsFound=0;
const FIRST_FLOOR=4;
const stairAt=(x,y)=>x>=12&&x<15&&y>=38&&y<47?'B':x>=18&&x<21&&y>=1&&y<9?'A':null;
const floorAt=(x,y)=>{const stair=stairAt(x,y);if(stair==='B')return Math.max(0,Math.min(4,Math.floor((46.5-y)*2+.00001)*.25));if(stair==='A')return Math.max(0,Math.min(4,Math.floor((9-y)*2+.00001)*.25));if((y>=36&&y<42&&x<16)||(y>=1&&y<8))return FIRST_FLOOR;return 0};
const outdoor=(x,y)=>y>=15&&y<34;
const ceilingAt=(x,y)=>outdoor(x,y)?80:stairAt(x,y)?8:floorAt(x,y)+3.8;
const cellAt=(x,y)=>level[Math.floor(y)]?.[Math.floor(x)]??'#';
const solid=(x,y)=>['#','D'].includes(cellAt(x,y));
const setCell=(x,y,value)=>{level[y]=level[y].slice(0,x)+value+level[y].slice(x+1)};
const campusTrees=[[6,20],[10,27],[33,20],[37,29],[4,30],[41,18]];
const campusCars=[{x:39,y:23,color:[.58,.09,.08]},{x:39,y:27,color:[.12,.23,.39]},{x:39,y:31,color:[.7,.73,.72]}];
function propBlocks(x,y){return outdoor(x,y)&&(campusTrees.some(([a,b])=>Math.hypot(x-a,y-b)<.4)||campusCars.some(c=>Math.abs(x-c.x)<1&&Math.abs(y-c.y)<1.95))}
function resetWorld(){
 const g=Array.from({length:WORLD_DEPTH},()=>Array(WORLD_WIDTH).fill('#'));
 const carve=(x1,y1,x2,y2)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)g[y][x]='.'};
 // Building B: reception, spine, Computer Science and microelectronics offices.
 carve(16,35,22,55);carve(5,50,32,55);
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
 for(let x of [15,23]){g[11][x]='#';g[12][x]='#';door(x,11,'x',x===15?'ROBOTICS OFFICE':'ADMINISTRATION OFFICE')}
 // Physical sixteen-riser stairways and upstairs wings (4 m above ground).
 for(let y=36;y<=46;y++)g[y][11]='#';
 for(let y=38;y<=46;y++)g[y][15]='#';
 carve(12,36,14,47);carve(12,47,18,47);
 officeDoors=officeDoors.filter(d=>!(d.x===15&&d.y===38));
 door(11,36,'x','COMPUTER SCIENCE OFFICE');
 carve(11,1,34,7);carve(18,8,20,9);
 for(let y=2;y<=8;y++){g[y][17]='#';g[y][21]='#'}
 carve(21,1,24,1);carve(37,1,45,7);carve(34,3,38,4);
 // The final office stays locked until the upstairs guards have fallen.
 g[3][35]=g[4][35]='#';
 // Fire-door interlocks retain the campaign order.
 for(let x=16;x<=22;x++){g[34][x]='#';g[14][x]='#'}
 for(let x=18;x<=20;x++)g[8][x]='#';
 // Concealed service tunnels, each with one wall panel hiding a weapon cache.
 carve(1,36,3,41);carve(36,9,40,13);
 secretDoors=[
  {id:'plasma',x:4,y:38,axis:'x',hintX:5.012,hintY:38.5,cells:[[4,38]],opened:false,opening:false,remaining:0,label:'SERVICE PANEL'},
  {id:'bfg',x:35,y:11,axis:'x',hintX:34.988,hintY:11.5,cells:[[35,11]],opened:false,opening:false,remaining:0,label:'RESTRICTED ARCHIVE'}
 ];
 level=g.map(r=>r.join(''));secretsFound=0;
}
function hiddenMapCell(x,y){return (x<=4&&y>=36&&y<=41&&!secretDoors[0]?.opened)||(x>=35&&x<=40&&y>=9&&y<=13&&!secretDoors[1]?.opened)}
function bodyFits(x,y){const h=floorAt(x,y);return !propBlocks(x,y)&&!(typeof furnitureBlocks==='function'&&furnitureBlocks(x,y,h+.5))&&[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].every(([dx,dy])=>!solid(x+dx,y+dy)&&Math.abs(floorAt(x+dx,y+dy)-h)<=.3&&!propBlocks(x+dx,y+dy))}
function move(o,dx,dy){const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.07));for(let i=0;i<count;i++){const x=o.x+dx/count,y=o.y+dy/count,h=floorAt(o.x,o.y);if(bodyFits(x,o.y)&&Math.abs(floorAt(x,o.y)-h)<=.3)o.x=x;if(bodyFits(o.x,y)&&Math.abs(floorAt(o.x,y)-floorAt(o.x,o.y))<=.3)o.y=y}o.z=floorAt(o.x,o.y)}
function line(x,y,xx,yy,z=floorAt(x,y)+1.05,zz=floorAt(xx,yy)+1.05){const distance=Math.hypot(xx-x,yy-y);for(let step=.08;step<distance;step+=.08){const t=step/distance,px=x+(xx-x)*t,py=y+(yy-y)*t,h=z+(zz-z)*t;if(solid(px,py)||h<floorAt(px,py)+.025||h>ceilingAt(px,py)-.025||(h<1.4&&propBlocks(px,py))||(typeof furnitureBlocks==='function'&&furnitureBlocks(px,py,h)))return false}return true}
function closestOfficeDoor(p){return officeDoors.find(d=>Math.abs(p.z-floorAt(d.x,d.y))<.4&&Math.hypot(p.x-d.x-.5,p.y-d.y-d.width/2)<1.8&&Math.abs(Math.atan2(Math.sin(Math.atan2(d.y+d.width/2-p.y,d.x+.5-p.x)-p.a),Math.cos(Math.atan2(d.y+d.width/2-p.y,d.x+.5-p.x)-p.a)))<.9)}
function updateOfficeDoors(dt){for(let d of officeDoors)d.progress=Math.min(1,d.progress+(d.open?dt*2.5:0))}
function openOfficeDoor(d){if(d.open)return;d.open=true;for(let n=0;n<d.width;n++)setCell(d.x,d.y+n,'.')}
resetWorld();
