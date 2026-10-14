// Requires a locally running HTTP server and Chrome with --remote-debugging-port.
const fs=require('node:fs');
const server=process.argv[2]||'http://127.0.0.1:8097/',debug=process.argv[3]||'http://127.0.0.1:9247';
(async()=>{
 const tabs=await(await fetch(debug+'/json')).json();const ws=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0,pending=new Map(),errors=[];
 ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1040,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:server+'?qa='+Date.now()});
 await evaluate(`new Promise((resolve,reject)=>{let i=0;const tick=()=>{if(typeof renderer!=='undefined'&&renderer?.ready)resolve(true);else if(i++>200)reject(Error('Load timeout: '+document.getElementById('description').textContent));else setTimeout(tick,100)};tick()})`);
 console.log(await evaluate(`(async()=>{const check=(v,m)=>{if(!v)throw Error(m)};
 check(renderer.weapons.length===7,'Seven weapon images');check(Object.keys(renderer.textures).filter(k=>k.startsWith('enemy')).length===32,'Thirty-two directional walk textures');
 for(let name of ['zombie','scientist','mutant','director','weaponAtlas']){const img=new Image();img.src='assets/'+name+'.png';await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);check(g.getImageData(0,0,1,1).data[3]<45,'Transparent sprite backdrop: '+name)}
 reset();mode='paused';$('veil').style.display='none';owned.fill(true);for(let w=0;w<7;w++){weapon=w;render();check(renderer.gl.getError()===0,'Weapon render '+w)}
 const doors=officeDoors;for(let d of doors){openOfficeDoor(d);d.progress=1}renderer.rebuildWorld(level,floorAt,ceilingAt);openDoor(34,16,22);openDoor(14,16,22);stage=2;
 p.x=26;p.y=31;p.a=-.22;p.pitch=.13;weapon=5;hud();render();check(renderer.gl.getError()===0,'Exterior geometry render');
 audio=new AudioContext();await audio.resume();combatAudio.init(audio);await Promise.all([combatAudio.weaponReady,combatAudio.voiceReady,combatAudio.musicReady]);check(combatAudio.samples.every(samples=>samples[0]),'Original weapon recordings');
 for(let w=3;w<7;w++)combatAudio.shot(w);check(combatAudio.musicBuffer&&combatAudio.voices.filter(Boolean).length===4,'Music and voice load');
 return{pass:true,weaponImages:renderer.weapons.length,directionalFrames:32,officeDoors:doors.length,recordedWeaponSounds:3,newSynthesizedWeaponSounds:4,webgl:renderer.gl.getParameter(renderer.gl.RENDERER)}
 })()`));
 const shot=async name=>{const result=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/'+name+'.png',Buffer.from(result.data,'base64'))};
 await shot('outbreak-parking');
 await evaluate(`p.x=26;p.y=31;p.a=-1.9;p.pitch=.12;render()`);await shot('outbreak-building4');
 await evaluate(`p.x=13;p.y=20;p.a=1.2;p.pitch=.15;weapon=4;hud();render()`);await shot('outbreak-building5');
 await evaluate(`p.x=13;p.y=39.5;p.a=Math.PI;p.pitch=0;weapon=3;hud();render()`);await shot('outbreak-office-open');
 await evaluate(`p.x=19.5;p.y=6.5;p.a=-Math.PI/2;p.pitch=.05;weapon=6;bossAwake=true;const b=enemies.find(e=>e.type===3);b.a=Math.PI/2;hud();render()`);await shot('outbreak-director');
 console.log({runtimeErrors:errors});ws.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
