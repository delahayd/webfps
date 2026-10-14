'use strict';
// Persistent combat marks. The normal identifies the actual wall/floor/ceiling plane.
let decals=[];
function traceSurface(x,y,z,dx,dy,dz,range=60){
 const length=Math.hypot(dx,dy,dz);if(length<1e-6)return null;dx/=length;dy/=length;dz/=length;
 const prop=typeof furnitureRay==='function'?furnitureRay(x,y,z,dx,dy,dz,range):null;let px=x,py=y,pz=z;
 for(let t=.04;t<=range;t+=.04){const xx=x+dx*t,yy=y+dy*t,zz=z+dz*t;if(prop&&prop.distance<=t)return prop;
  if(zz>floorAt(px,py)+.015&&zz<=floorAt(xx,yy)+.015&&floorAt(xx,yy)>floorAt(px,py)+.02){const axis=floorAt(xx,py)>floorAt(px,py)+.02?'x':'y',component=axis==='x'?dx:dy,plane=axis==='x'?Math.round(xx):Math.round(yy*2)/2;if(Math.abs(component)>1e-7){const at=(plane-(axis==='x'?x:y))/component,n=component>0?-1:1;return{x:x+dx*at+(axis==='x'?n*.013:0),y:y+dy*at+(axis==='y'?n*.013:0),z:z+dz*at,nx:axis==='x'?n:0,ny:axis==='y'?n:0,nz:0}}}
  if(zz<=floorAt(xx,yy)+.015||zz>=ceilingAt(xx,yy)-.01){const plane=zz<=floorAt(xx,yy)+.015?floorAt(xx,yy):ceilingAt(xx,yy),at=Math.abs(dz)>1e-7?(plane-z)/dz:t;return{x:x+dx*at,y:y+dy*at,z:plane+(zz<=floorAt(xx,yy)+.015?.012:-.012),nx:0,ny:0,nz:zz<=floorAt(xx,yy)+.015?1:-1}}
  if(solid(xx,yy)){
   const door=officeDoors.find(d=>!d.open&&xx>=d.x&&xx<d.x+1&&yy>=d.y&&yy<d.y+d.width);
   let axis=door?.axis??(Math.floor(xx)!==Math.floor(px)?'x':'y');
   let plane=axis==='x'?(dx>0?Math.floor(xx):Math.floor(xx)+1):(dy>0?Math.floor(yy):Math.floor(yy)+1);
   if(door)plane=axis==='x'?door.x+(dx>0?.415:.585):door.y+(dy>0?.415:.585);
   const component=axis==='x'?dx:dy;if(Math.abs(component)<1e-6)return null;
   const at=(plane-(axis==='x'?x:y))/component,n=component>0?-1:1;
   return{x:x+dx*at+(axis==='x'?n*.013:0),y:y+dy*at+(axis==='y'?n*.013:0),z:z+dz*at,cellX:Math.floor(xx),cellY:Math.floor(yy),nx:axis==='x'?n:0,ny:axis==='y'?n:0,nz:0,door:door?officeDoors.indexOf(door):null};
  }
  px=xx;py=yy;pz=zz;
 }return prop;
}
function addMark(hit,kind='impact',size=.13){if(hit&&Number.isFinite(hit.x+hit.y+hit.z))decals.push({...hit,kind,size})}
function shotMarks(range=60){const pellets=weapon===1?7:1;for(let n=0;n<pellets;n++){const spread=weapon===1?.14:weapon===2?.025:0,a=p.a+(Math.random()-.5)*spread,pitch=p.pitch+(Math.random()-.5)*spread;addMark(traceSurface(p.x,p.y,p.z+1.05,Math.cos(a)*Math.cos(pitch),Math.sin(a)*Math.cos(pitch),Math.sin(pitch),range),weapon===3?'scratch':'impact',weapon===1?.095:.13)}}
function persistentMarks(){return decals.filter(d=>d.furnitureId!=null?furniture[d.furnitureId]?.hp>0:d.door!=null||d.nz||d.cellX==null||solid(d.cellX,d.cellY)).map(d=>({...d,y:d.y+(d.door!=null?officeDoors[d.door].progress*officeDoors[d.door].width:0),decal:true,height:d.size,width:d.size,base:d.z}))}
