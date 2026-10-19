'use strict';
// A perspective WebGL renderer. World axes: x / elevation / map-y.
class HellRenderer {
  constructor(canvas,level,floorAt=()=>0,ceilingAt=()=>3.5){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true});
    if(!this.gl)throw new Error('This version requires WebGL.');
    this.level=level;this.textures={};this.weapons=[];this.ready=false;
    const gl=this.gl,compile=(type,source)=>{let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
    const vs=`attribute vec3 position;attribute vec2 uv;attribute vec3 color;uniform vec3 camera;uniform float yaw;uniform float pitch;uniform float aspect;varying vec2 texcoord;varying vec3 tint;varying vec3 world;varying float depth;
    void main(){vec3 delta=position-camera;float c=cos(yaw),s=sin(yaw),cp=cos(pitch),sp=sin(pitch);vec3 right=vec3(-s,0.,c);vec3 up=vec3(-c*sp,cp,-s*sp);vec3 forward=vec3(c*cp,sp,s*cp);float z=dot(delta,forward);float tangent=.57735;const float nearPlane=.04;const float farPlane=240.;gl_Position=vec4(dot(delta,right)/(aspect*tangent),dot(delta,up)/tangent,((farPlane+nearPlane)*z-2.*farPlane*nearPlane)/(farPlane-nearPlane),z);texcoord=uv;tint=color;world=position;depth=length(delta);}`;
    const fs=`precision highp float;uniform sampler2D image;uniform float sprite;uniform float clock;uniform float glow;uniform float opacity;uniform float gateCut;varying vec2 texcoord;varying vec3 tint;varying vec3 world;varying float depth;
    void main(){if(gateCut>.5&&texcoord.x>.30&&texcoord.x<.70&&texcoord.y>.03&&texcoord.y<.68)discard;vec4 sampleColor=texture2D(image,texcoord);if(sampleColor.a<.18)discard;float pulse=.93+.07*sin(clock*3.1);float l1=2.4/(1.+distance(world,vec3(13.,1.1,21.))*distance(world,vec3(13.,1.1,21.))*.5);float l2=2.4/(1.+distance(world,vec3(21.,1.1,21.))*distance(world,vec3(21.,1.1,21.))*.5);float l3=3.2/(1.+pow(distance(world,vec3(18.,3.6,4.)),2.)*.24);float l4=3.2/(1.+pow(distance(world,vec3(39.,-.5,29.)),2.)*.24);vec3 light=vec3(.52,.6,.69)+vec3(.2,.15,.34)*(l1+l2+l3+l4)*pulse+vec3(.5)/(1.+depth*.2);float outside=smoothstep(14.5,15.5,world.z)*(1.-smoothstep(33.5,34.5,world.z));light=mix(light,vec3(.95,1.,1.04),outside*.75);vec3 rgb=sampleColor.rgb*tint*light;rgb+=sampleColor.rgb*glow;float fog=1.-exp(-depth*mix(.035,.014,outside));rgb=mix(rgb,vec3(.025,.045,.075),fog);gl_FragColor=vec4(rgb,sampleColor.a*opacity);}`;
    let program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));this.program=program;gl.useProgram(program);
    this.attributes={};for(let a of ['position','uv','color'])this.attributes[a]=gl.getAttribLocation(program,a);
    this.uniforms={};for(let a of ['camera','yaw','pitch','aspect','image','sprite','clock','glow','opacity','gateCut'])this.uniforms[a]=gl.getUniformLocation(program,a);
    this.staticBuffer=gl.createBuffer();this.dynamicBuffer=gl.createBuffer();this.rebuildWorld(level,floorAt,ceilingAt);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.24,.4,.58,1);gl.disable(gl.CULL_FACE);
  }
  rebuildWorld(level,floorAt=()=>0,ceilingAt=()=>3.8){
    this.level=level;const gl=this.gl,groups={};
    const mesh=kind=>groups[kind]??(groups[kind]=[]),wall=(x,y)=>(level[y]?.[x]??'#')==='#';
    for(let y=0;y<level.length;y++)for(let x=0;x<level[y].length;x++){
      if(wall(x,y))continue;const outside=outdoor(x+.5,y+.5),ceiling=ceilingAt(x+.5,y+.5),floor=floorAt(x+.5,y+.5);
      const ground=outside?(secretTerrace(x,y)?'pavement':x>=36?'asphalt':x>=16&&x<=23?'pavement':'grass'):'floor';
      if(stairAt(x+.5,y+.5)){const east=stairAt(x+.5,y+.5)==='A';for(let n=0;n<2;n++){const xx=x+(east?n*.5:0),yy=y+(east?0:n*.5),sx=east?.5:1,sy=east?1:.5,h=floorAt(xx+sx*.5,yy+sy*.5);this.quad(mesh(ground),[[xx,h,yy],[xx+sx,h,yy],[xx+sx,h,yy+sy],[xx,h,yy+sy]]);const other=floorAt(xx+(east?.51:.5),yy+(east?.5:.51));if(Math.abs(other-h)>.01){const low=Math.min(h,other),high=Math.max(h,other);this.quad(mesh('stairwall'),east?[[xx+.5,low,yy],[xx+.5,low,yy+1],[xx+.5,high,yy+1],[xx+.5,high,yy]]:[[xx,low,yy+.5],[xx+1,low,yy+.5],[xx+1,high,yy+.5],[xx,high,yy+.5]])}}}
      else this.quad(mesh(ground),[[x,floor,y],[x+1,floor,y],[x+1,floor,y+1],[x,floor,y+1]]);
      if(!outside)this.quad(mesh('ceiling'),[[x,ceiling,y],[x,ceiling,y+1],[x+1,ceiling,y+1],[x+1,ceiling,y]]);
      for(let [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nx=x+dx,ny=y+dy,terraceWall=secretTerrace(x,y)&&((dy===-1&&y===61&&x>=4)||(dx===1&&x===12));if(!wall(nx,ny)&&!terraceWall){const h=floorAt(x+.5+dx*.51,y+.5+dy*.51),here=floorAt(x+.5+dx*.49,y+.5+dy*.49);if(h>here+.01){const points=dx===-1?[[x,here,y],[x,here,y+1],[x,h,y+1],[x,h,y]]:dx===1?[[x+1,here,y],[x+1,here,y+1],[x+1,h,y+1],[x+1,h,y]]:dy===-1?[[x,here,y],[x+1,here,y],[x+1,h,y],[x,h,y]]:[[x,here,y+1],[x+1,here,y+1],[x+1,h,y+1],[x,h,y+1]];this.quad(mesh('wall'),points)}
          // Seal the upper part of the edge when the adjoining room has a lower ceiling.
          // The opening below stays clear for walking between the room and stairwell.
          const nextCeiling=ceilingAt(nx+.5,ny+.5),low=Math.max(floor,nextCeiling);
          if(!outside&&!outdoor(nx+.5,ny+.5)&&low<ceiling-.01){
            const points=dx===-1?[[x,low,y],[x,low,y+1],[x,ceiling,y+1],[x,ceiling,y]]:dx===1?[[x+1,low,y+1],[x+1,low,y],[x+1,ceiling,y],[x+1,ceiling,y+1]]:dy===-1?[[x+1,low,y],[x,low,y],[x,ceiling,y],[x+1,ceiling,y]]:[[x,low,y+1],[x+1,low,y+1],[x+1,ceiling,y+1],[x,ceiling,y+1]];
            this.quad(mesh('wall'),points);
          }
          continue}
        // Open-air boundaries are low campus fences. Building fronts have real height.
        const facade=terraceWall||(outside&&dy!==0&&(ny===14||ny===34)&&nx>=4&&nx<=45);
        const height=outside?floor+(facade?3.8:1.1):ceiling;
        const points=dx===-1?[[x,floor,y],[x,floor,y+1],[x,height,y+1],[x,height,y]]:dx===1?[[x+1,floor,y+1],[x+1,floor,y],[x+1,height,y],[x+1,height,y+1]]:dy===-1?[[x+1,floor,y],[x,floor,y],[x,height,y],[x+1,height,y]]:[[x,floor,y+1],[x+1,floor,y+1],[x+1,height,y+1],[x,height,y+1]];
        this.quad(mesh(facade?'facade':outside?'fence':stairAt(x+.5,y+.5)?'stairwall':'wall'),points,[1,1,1],1);
      }
    }
    for(let d of officeDoors){const z=floorAt(d.x,d.y+.5);
      this.box(mesh('wall'),d.x,z+3.3,d.y,d.x+1,z+3.8,d.y+d.width,[1,1,1]);
      if(d.axis==='x'){this.box(mesh('roof'),d.x+.38,z,d.y-.04,d.x+.62,z+3.3,d.y+.035,[.6,.54,.43]);this.box(mesh('roof'),d.x+.38,z,d.y+d.width-.035,d.x+.62,z+3.3,d.y+d.width+.04,[.6,.54,.43]);}
    }
    // Upper floors, rooftop cornices and window bands form visible freestanding buildings.
    for(let b of [{x1:3.5,x2:46.2,z1:.5,z2:15,height:9.6,front:15.012},{x1:4.5,x2:34.5,z1:34,z2:56.5,height:11.5,front:33.988}]){
      // Close the exterior shell, leaving openings where upper walkable rooms cross it.
      const upperPassage=(x,y,dx,dy)=>[-1,1].every(sign=>{const xx=x+dx*.55*sign,yy=y+dy*.55*sign;return !solid(xx,yy)&&floorAt(xx,yy)>3.8});
      for(let x=b.x1;x<b.x2;x+=1)for(const y of [b.z1,b.z2])if(!upperPassage(x+.5,y,0,1))this.box(mesh('facade'),x,3.8,y-.025,Math.min(x+1,b.x2),b.height,y+.025);
      for(let y=b.z1;y<b.z2;y+=1)for(const x of [b.x1,b.x2])if(!upperPassage(x,y+.5,1,0))this.box(mesh('facade'),x-.025,3.8,y,x+.025,b.height,Math.min(y+1,b.z2));
      this.box(mesh('roof'),b.x1-.2,b.height,b.z1-.2,b.x2+.2,b.height+.22,b.z2+.2,[.75,.8,.82]);
      for(let x=b.x1+1;x<b.x2-1;x+=2.3)for(let h of [4.4,7.3]){
        this.quad(mesh('window'),[[x,h,b.front],[x+1.5,h,b.front],[x+1.5,h+1.65,b.front],[x,h+1.65,b.front]]);
      }
      // Reception glazing to either side of the courtyard entrances.
      for(let x of [7,10,26,29])this.quad(mesh('window'),[[x,.65,b.front],[x+1.8,.65,b.front],[x+1.8,2.85,b.front],[x,2.85,b.front]]);
      this.box(mesh('roof'),15.5,3.4,b.front-.7,23.5,3.6,b.front+.7,[.5,.6,.65]);
    }
    campusTrees.forEach(([x,z],i)=>this.campusTree(mesh,x,z,i));
    for(let c of campusCars)this.campusCar(mesh,c);
    for(let z=19;z<34;z+=4)this.box(mesh('solid'),36,.013,z,44,.022,z+.08,[.9,.88,.65]);
    this.staticBatches=Object.entries(groups).map(([kind,data])=>{let buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return{kind,buffer,count:data.length/8}});
    if(this.oldBatches)for(let b of this.oldBatches)gl.deleteBuffer(b.buffer);this.oldBatches=this.staticBatches;
  }
  box(mesh,x1,y1,z1,x2,y2,z2,color=[1,1,1]){
    for(let face of [[[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1]],[[x2,y1,z2],[x1,y1,z2],[x1,y2,z2],[x2,y2,z2]],[[x1,y1,z2],[x1,y1,z1],[x1,y2,z1],[x1,y2,z2]],[[x2,y1,z1],[x2,y1,z2],[x2,y2,z2],[x2,y2,z1]],[[x1,y2,z1],[x2,y2,z1],[x2,y2,z2],[x1,y2,z2]]])this.quad(mesh,face,color);
  }
  cylinder(mesh,a,b,r1,r2,color,segments=16){
    const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),axis=d.map(v=>v/length),u=Math.abs(axis[1])>.9?[1,0,0]:[-axis[2],0,axis[0]],ul=Math.hypot(...u);for(let i=0;i<3;i++)u[i]/=ul;
    const v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];
    const point=(center,r,angle)=>center.map((n,i)=>n+r*(Math.cos(angle)*u[i]+Math.sin(angle)*v[i]));
    for(let n=0;n<segments;n++){const a1=n*Math.PI*2/segments,a2=(n+1)*Math.PI*2/segments,c=color.map(k=>k*(.7+.3*Math.max(0,Math.cos(a1-.8))));this.quad(mesh,[point(a,r1,a1),point(a,r1,a2),point(b,r2,a2),point(b,r2,a1)],c);this.quad(mesh,[b,point(b,r2,a1),point(b,r2,a2),b],c);this.quad(mesh,[a,point(a,r1,a2),point(a,r1,a1),a],c)}
  }
  ellipsoid(mesh,x,y,z,rx,ry,rz,color,seed=0){
    const point=(a,b)=>{let wobble=1+.06*Math.sin(a*7+b*5+seed);return[x+Math.cos(a)*Math.cos(b)*rx*wobble,y+Math.sin(b)*ry*wobble,z+Math.sin(a)*Math.cos(b)*rz*wobble]};
    for(let j=0;j<7;j++)for(let i=0;i<12;i++){const a=i*Math.PI/6,b=-Math.PI/2+j*Math.PI/7,c=color.map(k=>k*(.63+.37*Math.max(0,Math.sin(b+.7)*Math.cos(a-.5))));this.quad(mesh,[point(a,b),point(a+Math.PI/6,b),point(a+Math.PI/6,b+Math.PI/7),point(a,b+Math.PI/7)],c)}
  }
  campusTree(mesh,x,z,index){
    this.cylinder(mesh('bark'),[x,0,z],[x+.12,3.7,z-.1],.28,.12,[.65,.53,.4]);
    for(let n=0;n<8;n++){const a=n*2.399+index,h=2.65+(n%3)*.6,xx=x+Math.cos(a)*(1.05+(n%2)*.5),zz=z+Math.sin(a)*1.4,yy=h+1.2;this.cylinder(mesh('bark'),[x,h-.65,z],[xx,yy,zz],.12,.035,[.58,.48,.34]);this.ellipsoid(mesh('solid'),xx,yy+.45,zz,1.1,.9,1.15,[.09+(n%3)*.015,.29+(n%3)*.025,.07],n+index);
      for(let k=0;k<55;k++){const q=k*2.399+n,angle=k*.71+n,r=.8+(k%7)*.09,px=xx+Math.cos(q)*r,pz=zz+Math.sin(q)*r,py=yy+.4+Math.sin(angle)*.85,size=.19+(k%5)*.035;this.quad(mesh('foliage'),[[px-size,py-size,pz],[px+size,py-size,pz],[px+size,py+size,pz],[px-size,py+size,pz]],[.55+(k%3)*.12,.8+(k%2)*.1,.45])}
    }
  }
  campusCar(mesh,c){
    const x=c.x,z=c.y,color=c.color.map(v=>v*(.45+.55*c.hp/c.maxHp));if(c.destroyed){this.box(mesh('solid'),x-.9,.12,z-1.8,x+.9,.5,z+1.8,[.07,.065,.06]);return}
    // Bevelled body shell with rounded ends, raised bonnet and sloping glass cabin.
    const stations=[[-1.93,.78,.82],[-1.62,.98,.98],[1.42,.98,.96],[1.92,.81,.8]];
    const ring=([zz,w,h])=>[[-w*.8,.36],[-w,.5],[-w,.78],[-w*.82,h],[w*.82,h],[w,.78],[w,.5],[w*.8,.36]].map(([xx,yy])=>[x+xx,yy,z+zz]);
    for(let n=0;n<stations.length-1;n++){const a=ring(stations[n]),b=ring(stations[n+1]);for(let j=0;j<8;j++)this.quad(mesh('solid'),[a[j],a[(j+1)%8],b[(j+1)%8],b[j]],color.map(v=>v*([3,4].includes(j)?1.12:.85)))}
    for(let n of [0,3]){const a=ring(stations[n]);for(let j=1;j<7;j++)this.quad(mesh('solid'),[a[0],a[j],a[j+1],a[0]],color)}
    this.quad(mesh('solid'),[[x-.7,1.49,z-.35],[x+.7,1.49,z-.35],[x+.73,1.49,z+.65],[x-.73,1.49,z+.65]],color);
    this.quad(mesh('carGlass'),[[x-.82,1.01,z-1.07],[x+.82,1.01,z-1.07],[x+.68,1.47,z-.36],[x-.68,1.47,z-.36]]);
    this.quad(mesh('carGlass'),[[x-.73,1.47,z+.65],[x+.73,1.47,z+.65],[x+.82,1.0,z+1.23],[x-.82,1.0,z+1.23]]);
    for(let side of [-1,1]){const xx=x+side*.81;this.quad(mesh('carGlass'),[[xx,1.01,z-.99],[xx,1.01,z+.08],[x+side*.69,1.46,z+.08],[x+side*.69,1.46,z-.34]]);this.quad(mesh('carGlass'),[[xx,1.01,z+.18],[xx,1.01,z+1.14],[x+side*.71,1.46,z+.64],[x+side*.69,1.46,z+.18]]);this.box(mesh('solid'),x+side*.96-.08,.72,z-.72,x+side*.96+.08,.8,z-.43,[.65,.69,.71]);
      for(let zz of [-1.25,1.23]){const out=x+side*1.015,inside=x+side*.79;this.cylinder(mesh('solid'),[inside,.43,z+zz],[out,.43,z+zz],.39,.39,[.04,.045,.05],24);this.cylinder(mesh('solid'),[out,.43,z+zz],[out+side*.018,.43,z+zz],.24,.24,[.55,.59,.63],20);for(let n=0;n<5;n++){const a=n*2*Math.PI/5;this.cylinder(mesh('solid'),[out+side*.025,.43,z+zz],[out+side*.025,.43+Math.cos(a)*.2,z+zz+Math.sin(a)*.2],.025,.025,[.8,.82,.84],5)}}
      this.box(mesh('solid'),x+side*.96-.006,.44,z+.11,x+side*.96+.006,.97,z+.13,[.04,.06,.08]);this.box(mesh('solid'),x+side*.89-.015,.86,z+.34,x+side*.89+.015,.9,z+.56,[.7,.73,.76]);
    }
    this.box(mesh('solid'),x-.78,.43,z-1.94,x+.78,.55,z-1.91,[.07,.08,.09]);this.box(mesh('solid'),x-.36,.62,z-1.94,x+.36,.8,z-1.92,[.04,.05,.055]);
    for(let side of [-1,1]){this.box(mesh('solid'),x+side*.55-.17,.65,z-1.92,x+side*.55+.17,.81,z-1.89,[.95,.93,.8]);this.box(mesh('solid'),x+side*.55-.18,.61,z+1.9,x+side*.55+.18,.82,z+1.94,[.65,.025,.025])}
    this.box(mesh('solid'),x-.22,.48,z+1.941,x+.22,.57,z+1.95,[.9,.9,.79]);
  }
  cone(mesh,x,y,z,r,h,color){for(let n=0;n<12;n++){let a=n*Math.PI/6,b=(n+1)*Math.PI/6;for(let v of [[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x,y+h,z]])mesh.push(...v,0,0,...color)}}
  quad(out,points,tint=[1,1,1],repeat=1){const uv=[[0,0],[1,0],[1,repeat],[0,repeat]];for(let i of [0,1,2,0,2,3])out.push(...points[i],...uv[i],...tint)}
  texture(source,repeat=false){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);return t}
  async load(sprites){const load=url=>new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Unable to load '+url));img.src=url});let [atlas,stone]=await Promise.all([load('assets/infernal-atlas.png'),load('assets/basalt.png')]);
    let surface=document.createElement('canvas');surface.width=surface.height=1024;const g=surface.getContext('2d');g.fillStyle='#c1c9cb';g.fillRect(0,0,1024,1024);for(let y=0;y<1024;y+=256){g.fillStyle='#9da8af';g.fillRect(0,y,1024,4);for(let x=0;x<1024;x+=256)g.fillRect(x,y,3,256)}g.fillStyle='#315a69';g.fillRect(0,720,1024,95);g.fillStyle='#e1e5e6';g.fillRect(0,820,1024,12);this.stone=this.texture(surface,true);
    for(let i=0;i<6;i++){let c=document.createElement('canvas');c.width=512;c.height=512;let g=c.getContext('2d');const split=atlas.height*.543;g.drawImage(atlas,(i%3)*atlas.width/3,i<3?0:split,atlas.width/3,i<3?split:atlas.height-split,0,0,512,512);if(i<3)this.textures[i]=this.texture(c);else if(i<5)this.weapons.push(c);else this.textures.fire=this.texture(c)}
    {const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.strokeStyle='#bd663ca0';g.lineWidth=2;g.beginPath();g.moveTo(20,7);g.lineTo(27,22);g.lineTo(23,35);g.lineTo(35,45);g.lineTo(30,58);g.moveTo(23,35);g.lineTo(45,28);g.stroke();this.textures.crack=this.texture(c)}
    for(let kind of ['blood','bloodstain']){let c=document.createElement('canvas');c.width=c.height=64;let g=c.getContext('2d');g.fillStyle=kind==='blood'?'#a6160e':'#610b08';g.beginPath();for(let i=0;i<24;i++){let a=i*Math.PI/12,r=kind==='blood'?12+Math.random()*15:14+Math.random()*16;let x=32+Math.cos(a)*r,y=32+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.fill();g.fillStyle='#da302333';g.beginPath();g.ellipse(27,26,8,6,0,0,7);g.fill();this.textures[kind]=this.texture(c)}
    const [heavy,gate]=await Promise.all([load('assets/heavy-machine-gun.png'),load('assets/demon-gate.png')]);this.weapons.push(heavy);this.textures.heavy=this.texture(heavy);this.textures.portal=this.texture(gate);{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),fog=g.createRadialGradient(64,85,3,64,64,88);fog.addColorStop(0,'#3b0a03');fog.addColorStop(.55,'#100201');fog.addColorStop(1,'#000000');g.fillStyle=fog;g.fillRect(0,0,128,128);for(let i=0;i<45;i++){g.fillStyle=i%2?'#8d240a':'#d44a12';g.fillRect(Math.random()*128,Math.random()*128,1,2)}this.textures.gateVoid=this.texture(c)}
    for(let [kind,source]of Object.entries(sprites))if(!this.textures[kind])this.textures[kind]=this.texture(source);
    const sheets=await Promise.all(['zombie','scientist','mutant','director'].map(name=>load('assets/'+name+'.png')));
    for(let type=0;type<4;type++)for(let direction=0;direction<4;direction++)for(let frame=0;frame<2;frame++){
      const image=sheets[type],c=document.createElement('canvas');c.width=256;c.height=384;const g=c.getContext('2d');
      g.drawImage(image,direction*image.width/4,frame*image.height/2,image.width/4,image.height/2,0,0,256,384);
      this.textures['enemy'+type+'_'+direction+'_'+frame]=this.texture(c);
    }
    const arsenal=await load('assets/weaponAtlas.png');
    for(let i=0;i<4;i++){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');const bounds=[[0,.247],[.257,.484],[.498,.711],[.733,1]],lo=bounds[i][0],hi=bounds[i][1];g.drawImage(arsenal,lo*arsenal.width,0,(hi-lo)*arsenal.width,arsenal.height,0,0,512,512);this.weapons.push(c);this.textures['pickup'+['chainsaw','rocket','plasma','bfg'][i]]=this.texture(c)}
    // Layered procedural fire, soot, sparks and flying bodywork for vehicle blasts.
    for(const kind of ['carfire','carsmoke','carspark','cardebris']){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
      if(kind==='cardebris'){g.fillStyle='#232b30';g.beginPath();g.moveTo(22,18);g.lineTo(107,36);g.lineTo(91,102);g.lineTo(35,110);g.closePath();g.fill();g.strokeStyle='#6b6c64';g.lineWidth=5;g.stroke()}
      else if(kind==='carspark'){const glow=g.createRadialGradient(64,64,0,64,64,62);glow.addColorStop(0,'#fffbe9');glow.addColorStop(.15,'#ffdc73');glow.addColorStop(.4,'#f7752490');glow.addColorStop(1,'#e83b0000');g.fillStyle=glow;g.fillRect(0,0,128,128)}
      else if(kind==='carfire'){const pixels=g.createImageData(128,128),hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v)},noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,a=u*u*(3-2*u),b=v*v*(3-2*v);return (hash(ix,iy)*(1-a)+hash(ix+1,iy)*a)*(1-b)+(hash(ix,iy+1)*(1-a)+hash(ix+1,iy+1)*a)*b};for(let y=0;y<128;y++)for(let x=0;x<128;x++){const n=noise(x/19,y/19)*.55+noise(x/8,y/8)*.3+noise(x/3,y/3)*.15,r=Math.hypot((x-64)/58,(y-64)/58)+(n-.5)*.65,core=Math.max(0,1-r),j=(y*128+x)*4;pixels.data[j]=230+25*core;pixels.data[j+1]=55+180*core*core;pixels.data[j+2]=10+135*core**4;pixels.data[j+3]=255*Math.max(0,Math.min(1,(1-r)*2.8))*(.55+n*.45)}g.putImageData(pixels,0,0)}
      else for(let i=0;i<16;i++){const a=i*2.399,rad=12+(i%5)*5,x=64+Math.cos(a)*(i%4)*10,y=64+Math.sin(a)*(i%4)*10,glow=g.createRadialGradient(x,y,0,x,y,rad);if(kind==='carfire'){glow.addColorStop(0,'#fff3c9e0');glow.addColorStop(.25,'#ffc04ed0');glow.addColorStop(.6,'#e95318a0');glow.addColorStop(1,'#77250000')}else{glow.addColorStop(0,'#343332b0');glow.addColorStop(.5,'#4a46438a');glow.addColorStop(1,'#302e2d00')}g.fillStyle=glow;g.fillRect(x-rad,y-rad,rad*2,rad*2)}this.textures[kind]=this.texture(c);
    }
    const materials={stairwall:'#b5c2c9',floor:'#9aa6ad',ceiling:'#d6e0e3',grass:'#356e39',pavement:'#adb4b5',asphalt:'#353f4b',facade:'#c4c5bc',roof:'#859096',wall:'#c1c9cb',fence:'#6b7972',window:'#355a75',carGlass:'#233c50',bark:'#78624b',foliage:'#426f2d',solid:'#ffffff'};
    for(let [kind,color]of Object.entries(materials)){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,256,256);
      if(kind==='grass'||kind==='asphalt'){for(let i=0;i<3000;i++){g.fillStyle=i%2?'#ffffff13':'#00000018';g.fillRect((i*83)%256,(i*47+Math.floor(i/256)*31)%256,kind==='grass'?2:1,kind==='grass'?7:1)}}
      if(['floor','pavement','facade','wall'].includes(kind)){g.strokeStyle='#33445035';g.lineWidth=2;g.strokeRect(1,1,254,254)}
      if(kind==='wall'){g.fillStyle='#315a69';g.fillRect(0,170,256,28);g.fillStyle='#eef5f3';g.fillRect(0,200,256,3)}
      if(kind==='bark'){for(let i=0;i<45;i++){g.fillStyle=i%2?'#35261650':'#b4986740';g.fillRect(i*7%256,0,2+i%3,256)}}
      if(kind==='foliage'){g.clearRect(0,0,256,256);for(let i=0;i<35;i++){g.fillStyle=['#386724','#5d8636','#294b20','#769744'][i%4];g.beginPath();g.ellipse((i*67)%256,(i*97)%256,16,30,i*.7,0,Math.PI*2);g.fill()}}
      if(kind==='carGlass'){const sky=g.createLinearGradient(0,0,0,256);sky.addColorStop(0,'#7293a5');sky.addColorStop(.45,'#263b50');sky.addColorStop(1,'#182a37');g.fillStyle=sky;g.fillRect(0,0,256,256);g.fillStyle='#a5d2e53a';g.fillRect(20,0,18,256)}
      if(kind==='window'){g.fillStyle='#a2c5d66a';g.beginPath();g.moveTo(20,0);g.lineTo(100,0);g.lineTo(240,256);g.lineTo(160,256);g.fill();g.fillStyle='#b6bfbe';g.fillRect(123,0,8,256);g.fillRect(0,124,256,7)}
      this.textures[kind]=this.texture(c,true);
    }
    for(let kind of ['impact','scorch','energyburn','scratch']){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');let glow=g.createRadialGradient(64,64,2,64,64,58);glow.addColorStop(0,kind==='energyburn'?'#174d64':'#060707');glow.addColorStop(.45,'#141718e0');glow.addColorStop(1,'#1a1c1e00');g.fillStyle=glow;g.fillRect(0,0,128,128);g.strokeStyle=kind==='impact'?'#bac0bd':'#323b3b';g.lineWidth=2;for(let i=0;i<8;i++){let a=i*2.399;g.beginPath();g.moveTo(64+Math.cos(a)*12,64+Math.sin(a)*12);g.lineTo(64+Math.cos(a)*40,64+Math.sin(a)*40);g.stroke()}if(kind==='scratch'){g.strokeStyle='#8b9295';g.lineWidth=4;g.beginPath();g.moveTo(28,100);g.lineTo(98,20);g.stroke()}this.textures[kind]=this.texture(c)}
    const ending=await load('assets/ending-characters.png');{const c=document.createElement('canvas');c.width=768;c.height=256;const g=c.getContext('2d');g.drawImage(ending,0,ending.height*.34,ending.width*.672,ending.height*.63,0,0,768,256);this.textures.fallenDirector=this.texture(c)}
    this.initSky();this.ready=true;
  }
  initSky(){
    const gl=this.gl,compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
    const vs='attribute vec2 point;varying vec2 coord;void main(){coord=point;gl_Position=vec4(point,1.,1.);}';
    const fs=`precision highp float;varying vec2 coord;uniform float yaw;uniform float pitch;uniform float aspect;
    void main(){float cp=cos(pitch),sp=sin(pitch),c=cos(yaw),s=sin(yaw);vec3 ray=normalize(vec3(c*cp,sp,s*cp)+vec3(-s,0.,c)*coord.x*aspect*.57735+vec3(-c*sp,cp,-s*sp)*coord.y*.57735);float h=max(0.,ray.y);vec3 sky=mix(vec3(.68,.79,.88),vec3(.15,.38,.68),pow(h,.45));float sun=pow(max(0.,dot(ray,normalize(vec3(-.7,.35,.5)))),220.);sky+=vec3(1.,.81,.46)*sun;vec2 uv=ray.xz/max(.13,ray.y);float cloud=sin(uv.x*.55+sin(uv.y*.4))*sin(uv.y*.43+cos(uv.x*.31));cloud=smoothstep(.18,.65,cloud)*smoothstep(.015,.18,h)*.72;sky=mix(sky,vec3(.92,.94,.96),cloud);gl_FragColor=vec4(sky,1.);}`;
    this.skyProgram=gl.createProgram();gl.attachShader(this.skyProgram,compile(gl.VERTEX_SHADER,vs));gl.attachShader(this.skyProgram,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(this.skyProgram);if(!gl.getProgramParameter(this.skyProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.skyProgram));
    this.skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  }
  drawSky(p){const gl=this.gl;gl.useProgram(this.skyProgram);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(false);gl.bindBuffer(gl.ARRAY_BUFFER,this.skyBuffer);for(let loc of Object.values(this.attributes))gl.disableVertexAttribArray(loc);const a=gl.getAttribLocation(this.skyProgram,'point');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,8,0);for(let [key,value]of [['yaw',p.a],['pitch',p.pitch],['aspect',this.canvas.width/this.canvas.height]])gl.uniform1f(gl.getUniformLocation(this.skyProgram,key),value);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(a);gl.enable(gl.DEPTH_TEST);gl.depthMask(true)}
  bind(buffer){let gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let [name,size,offset]of [['position',3,0],['uv',2,12],['color',3,20]]){let a=this.attributes[name];gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset)}}
  furnitureMesh(f){
    if(f.mesh&&f.meshRevision===f.revision)return f.mesh;const out=[],x=f.x,y=f.z,z=f.y,damaged=f.hp<f.maxHp*.55;
    const box=(a,b,c,d,e,g,color)=>this.box(out,x+a,y+b,z+c,x+d,y+e,z+g,color);
    const wood=[.42,.29,.17],edge=[.65,.49,.29],metal=[.18,.22,.25];
    if(!f.hp){for(let i=0;i<7;i++){const a=i*2.399+f.id,xx=Math.cos(a)*(.3+i*.08),zz=Math.sin(a)*(.2+i*.06);box(xx-.25,.025,zz-.13,xx+.25,.07+(i%3)*.035,zz+.13,i%2?wood:metal)}box(-.7,.04,-.3,.65,.09,.25,wood);}
    else if(f.type==='desk'){
      box(-1.1,.77,-.525,1.1,.85,.525,edge);box(-1.06,.73,-.5,1.06,.78,.5,wood);
      for(let a of [-.98,.9])for(let b of [-.42,.34])box(a,0,b,a+.08,.76,b+.08,metal);
      box(-1,.08,-.4,-.48,.72,.44,[.29,.32,.34]);for(let n=0;n<3;n++){box(-1.015,.11+n*.2,-.42,-.475,.28+n*.2,-.395,damaged&&n===1?[.05,.06,.065]:[.42,.44,.43]);box(-.83,.18+n*.2,-.44,-.65,.2+n*.2,-.424,[.73,.75,.7]);}
      if(!damaged){box(-.15,.87,.11,.14,1.03,.18,metal);box(-.53,1.02,.13,.53,1.54,.2,[.035,.04,.05]);box(-.48,1.08,.118,.48,1.48,.13,[.025,.24,.27]);for(let n=0;n<5;n++)box(-.42,1.12+n*.065,.115,.15+(n%2)*.2,1.13+n*.065,.12,[.08,.66,.54]);}
      else{box(-.5,.855,.05,.4,.91,.32,[.035,.04,.05]);box(.53,.856,-.22,.8,.895,.1,[.08,.09,.09]);}
      box(-.42,.852,-.39,.4,.89,-.13,[.095,.12,.14]);for(let n=0;n<24;n++){const xx=-.38+(n%8)*.09,zz=-.36+Math.floor(n/8)*.065;box(xx,.891,zz,xx+.06,.902,zz+.04,[.53,.55,.54]);}
      this.ellipsoid(out,x+.64,y+.89,z-.27,.085,.045,.12,[.2,.23,.25]);box(.62,.856,.23,1,.86,.45,[.79,.79,.71]);
      // Upholstered rolling office chair beside the workstation.
      box(-.28,.44,.93,.28,.54,1.5,[.07,.105,.13]);box(-.3,.54,1.43,.3,1.25,1.51,[.08,.12,.15]);this.cylinder(out,[x,y+.08,z+1.24],[x,y+.44,z+1.24],.045,.045,[.48,.51,.5]);for(let n=0;n<5;n++){const a=n*Math.PI*.4;this.cylinder(out,[x,y+.12,z+1.24],[x+Math.cos(a)*.4,y+.07,z+1.24+Math.sin(a)*.4],.028,.028,metal)}
    }else{
      box(-.625,0,-.325,.625,.1,.325,metal);box(-.62,.1,.23,.62,2.35,.325,[.45,.37,.25]);box(-.625,.1,-.32,-.57,2.35,.24,wood);box(.57,.1,-.32,.625,2.35,.24,wood);box(-.625,2.3,-.325,.625,2.35,.325,edge);
      for(let n=0;n<4;n++){box(-.57,.46+n*.49,-.29,.57,.5+n*.49,.24,edge);for(let i=0;i<6;i++)box(-.5+i*.17,.5+n*.49,.01,-.37+i*.17,.8+n*.49,.22,[[.26,.41,.46],[.46,.31,.25],[.4,.43,.28]][(i+n)%3]);}
      if(!damaged){for(let a of [-.56,.02]){box(a,.14,-.335,a+.54,2.29,-.3,[.58,.52,.42]);box(a+.06,.3,-.342,a+.48,2.11,-.335,[.43,.39,.32]);}box(-.08,1.03,-.365,-.045,1.22,-.34,[.75,.76,.72]);box(.045,1.03,-.365,.08,1.22,-.34,[.75,.76,.72]);}
      else{box(-.57,.14,-.37,-.05,1.04,-.325,[.39,.34,.26]);box(.1,.03,-.7,.59,.07,-.1,edge);}
    }
    f.mesh=out;f.meshRevision=f.revision;return out;
  }
  drawFurniture(){const gl=this.gl;this.bind(this.dynamicBuffer);gl.bindTexture(gl.TEXTURE_2D,this.textures.solid);for(let f of furniture){const mesh=this.furnitureMesh(f);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,mesh.length/8)}}
  drawDoors(){const gl=this.gl;this.bind(this.dynamicBuffer);gl.bindTexture(gl.TEXTURE_2D,this.textures.door);for(let d of officeDoors){if(d.progress>=1)continue;const mesh=[],shift=d.progress*d.width,z=floorAt(d.x,d.y+.5);if(d.axis==='x')this.box(mesh,d.x+.42,z,d.y+shift,d.x+.58,z+3.25,d.y+d.width+shift);else this.box(mesh,d.x+shift,z,d.y+.42,d.x+d.width+shift,z+3.25,d.y+.58);if(d.boss){this.box(mesh,d.x+.32,z,d.y+shift,d.x+.68,z+3.65,d.y+d.width+shift,[.22,.12,.32]);for(let yy of [.12,d.width/2,d.width-.12])this.box(mesh,d.x+.29,z+.1,d.y+yy+shift,d.x+.71,z+3.55,d.y+yy+.09+shift,[.85,.65,.28]);for(let h of [.18,3.45])this.box(mesh,d.x+.28,z+h,d.y+shift,d.x+.72,z+h+.12,d.y+d.width+shift,[.85,.65,.28])}gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,mesh.length/8)} }
  draw(player,objects,clock){if(!this.ready)return;let gl=this.gl;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);this.drawSky(player);gl.useProgram(this.program);gl.uniform3f(this.uniforms.camera,player.x,(player.eyeZ??player.z??0)+1.05,player.y);gl.uniform1f(this.uniforms.yaw,player.a);gl.uniform1f(this.uniforms.pitch,player.pitch);gl.uniform1f(this.uniforms.aspect,this.canvas.width/this.canvas.height);gl.uniform1f(this.uniforms.clock,clock);gl.uniform1i(this.uniforms.image,0);gl.uniform1f(this.uniforms.glow,0);gl.uniform1f(this.uniforms.opacity,1);gl.uniform1f(this.uniforms.gateCut,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.stone);gl.disable(gl.BLEND);gl.depthMask(true);for(let b of this.staticBatches){gl.bindTexture(gl.TEXTURE_2D,this.textures[b.kind]);this.bind(b.buffer);gl.drawArrays(gl.TRIANGLES,0,b.count)}this.drawDoors();this.drawFurniture();
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.bind(this.dynamicBuffer);const rx=-Math.sin(player.a),rz=Math.cos(player.a);
    objects.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
    for(let o of objects){let h=o.height??1.5,w=o.width??h*(o.kind==='portal'?.8:1),base=o.base??0;if(o.kind==='fire'){h=w=.32}if(o.kind==='portal'&&o.progress>.001){const voidMesh=[],left=-w*.2,right=w*.2,low=base+h*.03,high=base+h*.68;this.quad(voidMesh,[[o.x+rx*left,low,o.y+rz*left],[o.x+rx*right,low,o.y+rz*right],[o.x+rx*right,high,o.y+rz*right],[o.x+rx*left,high,o.y+rz*left]]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(voidMesh),gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,this.textures.gateVoid);gl.uniform1f(this.uniforms.gateCut,0);gl.uniform1f(this.uniforms.opacity,1);gl.uniform1f(this.uniforms.glow,.6);gl.drawArrays(gl.TRIANGLES,0,6)}let mesh=[];if(o.decal){const r=w/2;if(o.nz){this.quad(mesh,[[o.x-r,o.z,o.y-r],[o.x+r,o.z,o.y-r],[o.x+r,o.z,o.y+r],[o.x-r,o.z,o.y+r]])}else if(o.nx){this.quad(mesh,[[o.x,o.z-r,o.y-r],[o.x,o.z-r,o.y+r],[o.x,o.z+r,o.y+r],[o.x,o.z+r,o.y-r]])}else{this.quad(mesh,[[o.x-r,o.z-r,o.y],[o.x+r,o.z-r,o.y],[o.x+r,o.z+r,o.y],[o.x-r,o.z+r,o.y]])}}else if(o.wallDecal){w=.45;this.quad(mesh,[[o.x,base,o.y-w/2],[o.x,base,o.y+w/2],[o.x,base+h,o.y+w/2],[o.x,base+h,o.y-w/2]])}else if(o.ground){w=o.size;const depth=o.depth??w;this.quad(mesh,[[o.x-w/2,base,o.y-depth/2],[o.x+w/2,base,o.y-depth/2],[o.x+w/2,base,o.y+depth/2],[o.x-w/2,base,o.y+depth/2]])}else this.quad(mesh,[[o.x-rx*w/2,base,o.y-rz*w/2],[o.x+rx*w/2,base,o.y+rz*w/2],[o.x+rx*w/2,base+h,o.y+rz*w/2],[o.x-rx*w/2,base+h,o.y-rz*w/2]],o.hit>0?[1.9,.5,.4]:[1,1,1]);if(o.rotation){const center=base+h*.5;for(let i=0;i<mesh.length;i+=8){const horizontal=(mesh[i]-o.x)*rx+(mesh[i+2]-o.y)*rz,vertical=mesh[i+1]-center,hh=horizontal*Math.cos(o.rotation)-vertical*Math.sin(o.rotation),vv=horizontal*Math.sin(o.rotation)+vertical*Math.cos(o.rotation);mesh[i]=o.x+rx*hh;mesh[i+2]=o.y+rz*hh;mesh[i+1]=center+vv}}
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,this.textures[o.kind]);gl.uniform1f(this.uniforms.opacity,o.opacity??1);gl.uniform1f(this.uniforms.glow,['fire','plasma','bfg','blast','carfire','carspark'].includes(o.kind)?.9:o.kind==='seal'?(o.active?.9:0):o.kind==='portal'?(o.active?.55:0):o.kind==='heavy'?.12:0);gl.uniform1f(this.uniforms.gateCut,o.kind==='portal'&&o.progress>.001?1:0);gl.drawArrays(gl.TRIANGLES,0,6);
      if(o.kind==='portal'&&o.progress>.001){
        gl.uniform1f(this.uniforms.gateCut,0);
        for(let side of [-1,1]){
          const u1=side===-1?.30:.50,u2=side===-1?.50:.70,shift=side*o.progress*.9,left=(u1-.5)*w+shift,right=(u2-.5)*w+shift,low=base+h*.03,high=base+h*.68;
          const points=[[o.x+rx*left,low,o.y+rz*left],[o.x+rx*right,low,o.y+rz*right],[o.x+rx*right,high,o.y+rz*right],[o.x+rx*left,high,o.y+rz*left]],uvs=[[u1,.03],[u2,.03],[u2,.68],[u1,.68]],panel=[];
          for(let i of [0,1,2,0,2,3])panel.push(...points[i],...uvs[i],1,1,1);
          gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(panel),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);
        }
      }
    }gl.depthMask(true);
  }
}
