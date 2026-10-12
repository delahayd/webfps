'use strict';
const WORLD_WIDTH=47,WORLD_DEPTH=35,BASE_Y=12;
const baseLevel=[
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
let level=[],elevations=[],secretDoors=[],secretsFound=0;
const floorAt=(x,y)=>elevations[Math.floor(y)]?.[Math.floor(x)]??0;
const ceilingAt=(x,y)=>floorAt(x,y)+(y<7?3.8:3.5);
const solid=(x,y)=>(level[Math.floor(y)]?.[Math.floor(x)]??'#')==='#';
const setCell=(x,y,value)=>{level[y]=level[y].slice(0,x)+value+level[y].slice(x+1)};
function resetWorld(){
 const grid=Array.from({length:WORLD_DEPTH},()=>Array(WORLD_WIDTH).fill('#'));
 elevations=Array.from({length:WORLD_DEPTH},()=>Array(WORLD_WIDTH).fill(0));
 const carve=(x1,y1,x2,y2,z=0)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){grid[y][x]='.';elevations[y][x]=z}};
 for(let y=0;y<baseLevel.length;y++)for(let x=0;x<24;x++)grid[y+BASE_Y][x+4]=baseLevel[y][x];
 // Original concealed annexes remain sealed at both ends until investigated.
 carve(1,19,3,24);carve(28,24,31,28);
 // Raised cathedral and eight actual 30 cm stone stair risers.
 carve(6,1,25,6,2.4);
 for(let y=7;y<=13;y++)carve(15,y,17,y,Math.round((14-y)*.3*10)/10);
 carve(15,14,17,14,0);
 for(let [x,y]of [[9,3],[13,3],[22,3],[9,5],[22,5]])grid[y][x]='#';
 // Eastern combat hall leads down a separate stairwell into the lower crypt.
 carve(34,14,45,18);carve(27,16,35,16);
 for(let y=19;y<=24;y++)carve(36,y,38,y,-(y-18)*.3);
 carve(34,25,45,33,-1.8);
 for(let [x,y]of [[41,16],[36,28],[43,28],[36,31],[43,31]])grid[y][x]='#';
 level=grid.map(row=>row.join(''));secretsFound=0;
 secretDoors=[
  {id:'west',x:4,y:20,hintX:5.014,hintY:20.5,cells:[[4,20],[4,24]],opened:false,opening:false,remaining:0},
  {id:'east',x:27,y:27,hintX:26.986,hintY:27.5,cells:[[27,27],[27,24]],opened:false,opening:false,remaining:0}
 ];
}
function hiddenMapCell(x,y){return (x<4&&y>=19&&y<=24&&!secretDoors[0]?.opened)||(x>=28&&x<=31&&y>=24&&y<=28&&!secretDoors[1]?.opened)}
function bodyFits(x,y){const height=floorAt(x,y);for(let [dx,dy]of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])if(solid(x+dx,y+dy)||Math.abs(floorAt(x+dx,y+dy)-height)>.34)return false;return true}
function move(o,dx,dy){const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.08));for(let i=0;i<count;i++){const x=o.x+dx/count,y=o.y+dy/count,h=floorAt(o.x,o.y);if(bodyFits(x,o.y)&&Math.abs(floorAt(x,o.y)-h)<.34)o.x=x;if(bodyFits(o.x,y)&&Math.abs(floorAt(o.x,y)-floorAt(o.x,o.y))<.34)o.y=y}o.z=floorAt(o.x,o.y)}
function line(x,y,xx,yy,z=floorAt(x,y)+1.05,zz=floorAt(xx,yy)+1.05){const distance=Math.hypot(xx-x,yy-y);for(let step=.08;step<distance;step+=.08){const t=step/distance,px=x+(xx-x)*t,py=y+(yy-y)*t,h=z+(zz-z)*t;if(solid(px,py)||h<floorAt(px,py)+.025||h>ceilingAt(px,py)-.025)return false}return true}
resetWorld();
