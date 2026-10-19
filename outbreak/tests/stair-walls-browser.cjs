// Regression: the upper stairwell must not look over a lower room's ceiling.
const fs=require('node:fs');
(async()=>{
 const server=process.argv[2]||'http://127.0.0.1:8098/',debug=process.argv[3]||'http://127.0.0.1:9247';
 const tabs=await(await fetch(debug+'/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 try{
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.navigate',{url:server+'?stair-walls='+Date.now()});
  await evaluate(`new Promise((resolve,reject)=>{let i=0;const tick=()=>{if(typeof renderer!=='undefined'&&renderer?.ready&&!$('play').disabled)resolve();else if(i++>250)reject(Error('Load timeout'));else setTimeout(tick,100)};tick()})`);
  console.log(await evaluate(`(()=>{const check=(v,m)=>{if(!v)throw Error(m)};reset();mode='paused';$('veil').style.display='none';enemies=[];furniture=[];
   const faces=[],quad=renderer.quad;renderer.quad=function(mesh,points,...args){faces.push(points);return quad.call(this,mesh,points,...args)};try{renderer.rebuildWorld(level,floorAt,ceilingAt)}finally{renderer.quad=quad}
   let checked=0;for(let y=1;y<WORLD_DEPTH-1;y++)for(let x=1;x<WORLD_WIDTH-1;x++){if(cellAt(x,y)==='#'||outdoor(x+.5,y+.5))continue;const high=ceilingAt(x+.5,y+.5),floor=floorAt(x+.5,y+.5);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(cellAt(nx,ny)==='#'||outdoor(nx+.5,ny+.5))continue;const low=Math.max(floor,ceilingAt(nx+.5,ny+.5));if(low>=high-.01)continue;const axis=dx?0:2,along=dx?2:0,plane=dx?x+(dx>0?1:0):y+(dy>0?1:0),t=dx?y+.5:x+.5;
    for(const z of [low+.005,(low+high)/2,high-.005])check(faces.some(q=>q.every(v=>Math.abs(v[axis]-plane)<.0001)&&Math.min(...q.map(v=>v[along]))<=t&&Math.max(...q.map(v=>v[along]))>=t&&Math.min(...q.map(v=>v[1]))<=z&&Math.max(...q.map(v=>v[1]))>=z),'Missing ceiling closure at '+[x,y,dx,dy,z]);checked++}}
   const gl=renderer.gl,probe=document.createElement('canvas');probe.width=probe.height=2;const g=probe.getContext('2d');g.fillStyle='#ff00ff';g.fillRect(0,0,2,2);renderer.textures.wallProbe=renderer.texture(probe);const mesh=[];renderer.quad(mesh,[[23,3.8,11.25],[26,3.8,11.25],[26,8,11.25],[23,8,11.25]]);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);const base=renderer.staticBatches;let probes=0;
   try{for(const x of [24.5,25.5])for(const pitch of [-.2,0,.2]){const camera={x,y:9.5,z:floorAt(x,9.5),eyeZ:floorAt(x,9.5),a:Math.PI/2,pitch},before=new Uint8Array(4),after=new Uint8Array(4);renderer.staticBatches=base;renderer.draw(camera,[],0);gl.readPixels(480,270,1,1,gl.RGBA,gl.UNSIGNED_BYTE,before);renderer.staticBatches=[...base,{buffer,kind:'wallProbe',count:6}];renderer.draw(camera,[],0);gl.readPixels(480,270,1,1,gl.RGBA,gl.UNSIGNED_BYTE,after);check(before.every((v,i)=>v===after[i]),'Marker behind staircase wall leaked at '+x+', pitch '+pitch);probes++}}
   finally{renderer.staticBatches=base;gl.deleteBuffer(buffer);gl.deleteTexture(renderer.textures.wallProbe);delete renderer.textures.wallProbe}
   for(let y=8;y<=10;y++)setCell(18,y,'.');p.x=17.5;p.y=9.5;p.z=0;move(p,12,0);check(p.x>29&&p.z===4,'Stair ascent remains accessible');move(p,-12,0);check(p.x<18&&p.z===0,'Stair descent remains accessible');renderer.rebuildWorld(level,floorAt,ceilingAt);p.x=25.5;p.y=9.5;p.z=p.eyeZ=floorAt(p.x,p.y);p.a=Math.PI/2;p.pitch=0;render();check(gl.getError()===0,'WebGL error');return{ceilingJoinsChecked:checked,occlusionProbes:probes,ascent:true,descent:true,webgl:'pass'}})()`));
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/outbreak-stair-garden-fixed.png',Buffer.from(shot.data,'base64'));
  console.log('PASS: upper stairwell walls occlude the lower room and garden; stairs remain traversable.');
 }finally{ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
