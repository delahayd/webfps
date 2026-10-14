'use strict';
let furniture=[],furnitureRevision=0;
function resetFurniture(){
 const desks=[[7,52],[29,52],[7,46],[30,46],[8,39.8],[29,39.8],[6,12.5],[32,12.5],[13,5.5],[30,5.5],[42,2.5]];
 const cabinets=[[5.8,50.8],[32,50.8],[5.8,43.8],[32,43.8],[5.8,36.8],[32,36.8],[4.8,9.8],[33,9.8],[14,2.5],[33,2],[44,5.5]];
 furniture=[...desks.map(([x,y])=>({x,y,type:'desk',w:2.2,d:1.05,h:1.55,maxHp:130,hp:130})),...cabinets.map(([x,y])=>({x,y,type:'cabinet',w:1.25,d:.65,h:2.35,maxHp:210,hp:210}))].map((f,id)=>({...f,id,z:floorAt(f.x,f.y),revision:0,damageFlash:0}));furnitureRevision++;
}
function furnitureBlocks(x,y,z){return furniture.some(f=>f.hp>0&&Math.abs(x-f.x)<f.w/2+.12&&Math.abs(y-f.y)<f.d/2+.12&&z>=f.z&&z<f.z+f.h)}
function furnitureRay(x,y,z,dx,dy,dz,range=60){const length=Math.hypot(dx,dy,dz);if(length<1e-6)return null;const dir=[dx/length,dy/length,dz/length],origin=[x,y,z];let closest=null;
 for(let f of furniture){if(f.hp<=0)continue;const low=[f.x-f.w/2,f.y-f.d/2,f.z],high=[f.x+f.w/2,f.y+f.d/2,f.z+f.h];let enter=0,leave=range,axis=0,sign=0,valid=true;
  for(let n=0;n<3;n++){if(Math.abs(dir[n])<1e-8){if(origin[n]<low[n]||origin[n]>high[n])valid=false;continue}let a=(low[n]-origin[n])/dir[n],b=(high[n]-origin[n])/dir[n];if(a>b)[a,b]=[b,a];if(a>enter){enter=a;axis=n;sign=dir[n]>0?-1:1}leave=Math.min(leave,b)}
  if(valid&&leave>=enter&&enter>=0&&enter<=range&&(!closest||enter<closest.distance)){const point=origin.map((v,n)=>v+dir[n]*enter);closest={f,distance:enter,x:point[0]+(axis===0?sign*.014:0),y:point[1]+(axis===1?sign*.014:0),z:point[2]+(axis===2?sign*.014:0),nx:axis===0?sign:0,ny:axis===1?sign:0,nz:axis===2?sign:0,furnitureId:f.id}}
 }return closest;
}
function damageFurniture(f,n){if(f.hp<=0)return;f.hp=Math.max(0,f.hp-n);f.revision++;f.damageFlash=.15;furnitureRevision++;if(typeof tone==='function')tone(f.hp?115:65,.12,'triangle',.035);if(typeof tell==='function'&&!f.hp)tell(f.type==='cabinet'?'Cabinet destroyed':'Desk destroyed')}
