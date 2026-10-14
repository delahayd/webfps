'use strict';
// A layered canvas opening: office, character stages, light, camera motion and particles.
class OpeningCinema {
  constructor({canvas,container,caption,chapter,skip,onComplete,onSkip,sound}){
    Object.assign(this,{canvas,container,caption,chapter,skip,onComplete,onSkip,sound});
    this.reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;this.ctx=canvas.getContext('2d');this.backdrop=document.createElement('canvas');this.backdrop.width=960;this.backdrop.height=540;this.duration=15;this.elapsed=0;this.active=false;this.cues=new Set();
    skip.onclick=()=>this.finish(true);
    this.particles=Array.from({length:70},(_,i)=>({phase:i*2.39996,radius:55+(i*37)%170,height:(i*73)%300,speed:.5+(i%7)*.13}));
  }
  async load(){
    const load=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Unable to load '+url));image.src=url});
    const [stages,boss,ending]=await Promise.all([load('assets/intro-characters.png'),load('assets/director.png'),load('assets/ending-characters.png')]);
    this.deadDirector=this.crop(ending,0,0,ending.width*.672,ending.height);this.hero=this.crop(ending,ending.width*.674,0,ending.width*.326,ending.height);
    this.human=this.crop(stages,0,0,stages.width*.44,stages.height);
    this.possessed=this.crop(stages,stages.width*.46,0,stages.width*.54,stages.height);
    this.boss=this.crop(boss,0,0,boss.width/4,boss.height/2);
  }
  crop(image,x,y,w,h){
    const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);const g=c.getContext('2d');g.drawImage(image,x,y,w,h,0,0,c.width,c.height);
    const pixels=g.getImageData(0,0,c.width,c.height).data;let left=c.width,right=0,top=c.height,bottom=0;
    for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++)if(pixels[(yy*c.width+xx)*4+3]>45){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy)}
    return {image:c,x:left,y:top,w:Math.max(1,right-left+1),h:Math.max(1,bottom-top+1)};
  }
  start(kind='intro'){this.kind=kind;this.duration=kind==='boss'?6:kind==='ending'?18:15;this.skip.textContent=kind==='ending'?'SKIP ENDING [ESC]':kind==='boss'?'FACE HER [ESC]':'SKIP INTRO [ESC]';this.elapsed=0;this.cues.clear();this.active=true;this.container.hidden=false;this.skip.focus();this.draw()}
  finish(skipped=false){if(!this.active)return;this.active=false;this.container.hidden=true;this.caption.textContent='';this.chapter.textContent='';(skipped?this.onSkip:this.onComplete)()}
  update(dt){if(!this.active||document.hidden||!document.hasFocus())return;this.elapsed=Math.min(this.duration,this.elapsed+dt);
    for(let [at,name]of (this.kind==='boss'?[[.2,'signal'],[2.3,'reveal']]:this.kind==='ending'?[[.3,'office'],[11,'end']]:[[.3,'office'],[3.6,'signal'],[6.3,'change'],[9.1,'reveal'],[12,'end']]))if(this.elapsed>=at&&!this.cues.has(name)){this.cues.add(name);this.sound(name)}
    this.draw();if(this.elapsed>=this.duration)this.finish(false);
  }
  drawCharacter(source,height,bottom,alpha){if(alpha<=0)return;const g=this.ctx,w=height*source.w/source.h;g.save();g.globalAlpha=alpha;g.drawImage(source.image,source.x,source.y,source.w,source.h,480-w/2,bottom-height,w,height);g.restore()}
  draw(){if(this.kind==='boss')this.drawBoss();else if(this.kind==='ending')this.drawEnding();else this.drawIntro()}
  drawIntro(){
    if(!this.human)return;const g=this.ctx,t=this.elapsed,clamp=(n)=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)},taint=smooth((t-3.5)/5.5),surge=Math.exp(-Math.pow((t-8.7)/.25,2));
    const chapter=t<3.6?'BUILDING A · DIRECTOR’S OFFICE · 06:16 AM':t<9?'CONTAINMENT FAILURE':'THE POSSESSION';
    const caption=t<3.6?'“The experiment is stable. We can proceed.”':t<6.5?'Something answers from the other side.':t<10?'“No… this is not our signal.”':t<12.5?'The director is no longer alone.':'One minute later. Building B. Your mission begins.';
    if(this.chapter.textContent!==chapter)this.chapter.textContent=chapter;if(this.caption.textContent!==caption)this.caption.textContent=caption;
    g.clearRect(0,0,960,540);g.fillStyle='#03070c';g.fillRect(0,0,960,540);g.save();
    const zoom=this.reducedMotion?1:1+smooth(t/12)*.065,shake=!this.reducedMotion&&t>6&&t<10?(Math.sin(t*49)*2.5+Math.sin(t*77)*1.3)*taint:0;
    g.translate(480+shake,270+Math.sin(t*43)*shake*.3);g.scale(zoom,zoom);g.translate(-480,-270);
    // Institutional office in perspective, with dawn beyond the window.
    const wall=g.createLinearGradient(0,0,0,540);wall.addColorStop(0,'#202d3b');wall.addColorStop(1,'#0c1521');g.fillStyle=wall;g.fillRect(-40,-40,1040,620);
    g.fillStyle='#344958';g.beginPath();g.moveTo(0,0);g.lineTo(115,90);g.lineTo(115,440);g.lineTo(0,540);g.fill();
    g.fillStyle='#1c2936';g.beginPath();g.moveTo(960,0);g.lineTo(845,90);g.lineTo(845,440);g.lineTo(960,540);g.fill();
    g.strokeStyle='#73818b33';g.lineWidth=2;for(let x=125;x<840;x+=120){g.beginPath();g.moveTo(x,90);g.lineTo(x,440);g.stroke()}
    const sky=g.createLinearGradient(140,110,140,320);sky.addColorStop(0,'#2f5378');sky.addColorStop(1,'#c4b6a0');g.fillStyle=sky;g.fillRect(145,110,195,205);
    g.fillStyle='#263b4a';for(let i=0;i<7;i++){g.fillRect(145+i*28,260-(i%3)*13,24,55+(i%3)*13);g.fillStyle='#9dbed377';g.fillRect(151+i*28,271-(i%3)*13,8,6);g.fillStyle='#263b4a'}
    g.fillStyle='#9aabb0';g.fillRect(140,104,205,8);g.fillRect(140,315,205,8);g.fillRect(140,104,8,219);g.fillRect(337,104,8,219);g.fillRect(237,104,6,219);g.fillRect(140,207,205,6);
    // Research shelves, books, binders and certificates.
    g.fillStyle='#17232d';g.fillRect(675,125,155,260);for(let y=165;y<365;y+=64){for(let i=0;i<8;i++){g.fillStyle=['#345b60','#756957','#394e74','#667069'][i%4];g.fillRect(686+i*16,y-29-(i%3)*5,12,29+(i%3)*5);g.fillStyle='#bbcec5';g.fillRect(688+i*16,y-18,8,3)}g.fillStyle='#8d9691';g.fillRect(677,y,151,5)}
    g.fillStyle='#657781';g.fillRect(394,105,162,50);g.fillStyle='#101d28';g.fillRect(397,108,156,44);g.fillStyle='#b4d6df';g.font='bold 14px monospace';g.textAlign='center';g.fillText('RESEARCH UNIT',475,128);g.font='11px monospace';g.fillText('DIRECTOR',475,145);
    // Rolling chair remains visible behind the initial seated character.
    g.fillStyle='#080e16';g.beginPath();g.roundRect(417,204,126,245,22);g.fill();g.fillStyle='#72858f';g.fillRect(475,440,10,48);g.fillRect(420,482,120,5);
    if(taint>0){const aura=g.createRadialGradient(480,290,15,480,290,270);aura.addColorStop(0,'#b047ff'+Math.floor(taint*95).toString(16).padStart(2,'0'));aura.addColorStop(1,'#6b16cc00');g.fillStyle=aura;g.fillRect(180,0,600,540);
      for(let i=0;i<9;i++){g.strokeStyle='rgba(155,67,240,'+taint*.4+')';g.lineWidth=2+taint*2;g.beginPath();g.moveTo(480,345);for(let n=1;n<12;n++){const a=i*2.399+n*.13+t*.3;g.lineTo(480+Math.cos(a)*n*taint*18,345-n*19+Math.sin(t*4+n)*12)}g.stroke()}
    }
    const humanAlpha=1-smooth((t-6.2)/1.5),midAlpha=smooth((t-6.2)/1.4)*(1-smooth((t-8.2)/1.4)),bossAlpha=smooth((t-8.2)/1.4);
    if(this.replacement){this.drawCharacter(this.replacement,315,445,1)}else if(!this.hideCharacters){this.drawCharacter(this.human,305+Math.sin(t*1.7)*1.2,445,humanAlpha);
    this.drawCharacter(this.possessed,365+smooth((t-6)/3)*35,454,midAlpha);
    this.drawCharacter(this.boss,390+smooth((t-9)/2)*10,455,bossAlpha);}
    // The desk occludes lower bodies. It shudders and cracks during the change.
    g.save();g.translate(shake*.4,0);g.fillStyle='#253744';g.beginPath();g.moveTo(210,365);g.lineTo(750,365);g.lineTo(870,430);g.lineTo(90,430);g.closePath();g.fill();g.fillStyle='#789394';g.fillRect(90,430,780,7);g.fillStyle='#162632';g.fillRect(112,437,736,130);g.fillStyle='#354854';g.fillRect(130,453,80,78);g.fillRect(750,453,78,78);
    // A monitor exposes the anomaly, documents flutter on the desk.
    g.fillStyle='#050d13';g.fillRect(225,290,132,90);g.fillStyle=taint>.1?'#281536':'#163c42';g.fillRect(232,296,118,73);g.strokeStyle=taint>.1?'#cf63ff':'#6affcd';g.lineWidth=2;g.beginPath();for(let x=0;x<110;x++){let y=332+Math.sin(x*.15+t*3)*(4+taint*20);x?g.lineTo(237+x,y):g.moveTo(237+x,y)}g.stroke();g.fillStyle='#99cfcc';g.font='9px monospace';g.textAlign='center';g.fillText(taint>.1?'SIGNAL UNKNOWN':'TEST 077 · STABLE',291,309);g.fillStyle='#6d7d83';g.fillRect(285,380,12,17);g.fillRect(269,396,45,6);
    for(let i=0;i<3;i++){g.save();g.translate(548+i*24,394+Math.sin(t*7+i)*taint*5);g.rotate((i-1)*.08+taint*Math.sin(t*5+i)*.12);g.fillStyle='#bec7c4';g.fillRect(-40,-15,70,28);g.fillStyle='#596871';for(let y=-9;y<10;y+=5)g.fillRect(-32,y,45,1);g.restore()}
    if(taint>.4){g.strokeStyle='#a95cec';g.lineWidth=3;g.beginPath();g.moveTo(470,429);g.lineTo(462,410);g.lineTo(482,390);g.lineTo(469,367);g.stroke()}
    g.restore();
    for(let particle of this.particles){if(taint<=0||this.reducedMotion)break;const a=particle.phase+t*particle.speed;const x=480+Math.cos(a)*particle.radius*taint,y=465-((particle.height+t*40)%350);g.fillStyle='rgba(208,115,255,'+taint*.75+')';g.fillRect(x,y,2+(particle.height%3),2+(particle.height%3))}
    g.restore();
    if(surge>.01&&!this.reducedMotion){g.fillStyle='rgba(221,170,255,'+surge*.65+')';g.fillRect(0,0,960,540)}
    if(taint>0&&!this.reducedMotion){g.fillStyle='rgba(8,2,18,'+(taint*(.03+.05*(1+Math.sin(t*7))))+')';g.fillRect(0,35,960,442)}
    const vignette=g.createRadialGradient(480,270,110,480,270,570);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000bd');g.fillStyle=vignette;g.fillRect(0,0,960,540);
    // Letterbox bars and a quiet end fade, with captions kept in the DOM for readability.
    g.fillStyle='#020509';g.fillRect(0,0,960,35);g.fillRect(0,477,960,63);
    const fade=smooth((t-13)/2);if(fade){g.fillStyle='rgba(2,5,9,'+fade+')';g.fillRect(0,0,960,540);g.fillStyle='rgba(170,227,226,'+fade+')';g.textAlign='center';g.font='bold 24px monospace';g.fillText('LIBERATE THE LAB',480,252);g.font='12px monospace';g.fillText('BUILDING B → CAMPUS → BUILDING A',480,283)}
  }
  officeSnapshot(replacement=null){const t=this.elapsed;this.elapsed=.8;this.hideCharacters=true;this.replacement=replacement;this.drawIntro();this.replacement=null;this.hideCharacters=false;this.elapsed=t}
  drawBoss(){
    if(!this.boss)return;const g=this.ctx,t=this.elapsed;this.officeSnapshot();
    const backdrop=this.backdrop;backdrop.getContext('2d').drawImage(this.canvas,0,0);
    g.fillStyle='#030109';g.fillRect(0,0,960,540);g.save();const shake=this.reducedMotion?0:(Math.sin(t*31)*4+Math.sin(t*53)*2)*(t>1?1:.35);g.translate(480+shake,270+Math.cos(t*37)*shake*.35);const zoom=this.reducedMotion?1:1+.06*Math.min(1,t/3);g.scale(zoom,zoom);g.translate(-480,-270);g.drawImage(backdrop,0,0);g.fillStyle='#210c325c';g.fillRect(0,35,960,442);
    const aura=g.createRadialGradient(480,250,30,480,250,300);aura.addColorStop(0,'#b34af077');aura.addColorStop(1,'#51147700');g.fillStyle=aura;g.fillRect(170,35,620,442);this.drawCharacter(this.boss,400+Math.min(1,t/4)*45,474,1);
    for(let i=0;i<22;i++){g.fillStyle='#ce64ff99';const a=i*2.399+t*.7;g.fillRect(480+Math.cos(a)*(140+i%5*14),370-(i*23+t*35)%310,3,3)}g.restore();g.fillStyle='#020509';g.fillRect(0,0,960,35);g.fillRect(0,477,960,63);
    this.chapter.textContent='BUILDING A · THE POSSESSED DIRECTOR';this.caption.textContent=t<2?'“You came to free my laboratory?”':t<4?'“Come closer. Face me!”':'The final confrontation begins.';
  }
  drawEnding(){
    if(!this.deadDirector||!this.hero)return;const g=this.ctx,t=this.elapsed,later=t>=9;
    this.officeSnapshot(later?this.hero:null);
    if(!later){g.fillStyle='#08111b7a';g.fillRect(0,35,960,442);this.drawCharacter(this.deadDirector,140,468,1);g.fillStyle='#020509';g.fillRect(0,477,960,63)}
    const transition=t>=7&&t<10?Math.max(0,1-Math.abs(t-8.5)/1.5):0;if(transition){g.fillStyle='rgba(0,0,0,'+transition+')';g.fillRect(0,0,960,540)}
    if(t>14){const alpha=Math.min(1,(t-14)/3);g.fillStyle='rgba(3,9,14,'+alpha*.9+')';g.fillRect(0,35,960,442);g.fillStyle='rgba(144,233,220,'+alpha+')';g.textAlign='center';g.font='bold 28px monospace';g.fillText('THE ADVENTURE CONTINUES',480,265)}
    this.chapter.textContent=later?'BUILDING A · THE DIRECTOR’S SEAT':'THE LABORATORY IS FREE';
    this.caption.textContent=t<4.5?'We could not save the unit director.':t<9?'She is dead. But the laboratory is finally safe.':t<14?'You take her seat. A new chapter begins.':'The adventure continues.';
  }

}
