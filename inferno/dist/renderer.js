'use strict';
// A perspective WebGL renderer. World axes: x / elevation / map-y.
class HellRenderer {
  constructor(canvas,level,floorAt=()=>0,ceilingAt=()=>3.5){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true});
    if(!this.gl)throw new Error('This version requires WebGL.');
    this.level=level;this.textures={};this.weapons=[];this.ready=false;
    const gl=this.gl,compile=(type,source)=>{let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
    const vs=`attribute vec3 position;attribute vec2 uv;attribute vec3 color;uniform vec3 camera;uniform float yaw;uniform float pitch;uniform float aspect;varying vec2 texcoord;varying vec3 tint;varying vec3 world;varying float depth;
    void main(){vec3 delta=position-camera;float c=cos(yaw),s=sin(yaw),cp=cos(pitch),sp=sin(pitch);vec3 right=vec3(-s,0.,c);vec3 up=vec3(-c*sp,cp,-s*sp);vec3 forward=vec3(c*cp,sp,s*cp);float z=dot(delta,forward);float tangent=.57735;gl_Position=vec4(dot(delta,right)/(aspect*tangent),dot(delta,up)/tangent,1.002*z-.08008,z);texcoord=uv;tint=color;world=position;depth=length(delta);}`;
    const fs=`precision mediump float;uniform sampler2D image;uniform float sprite;uniform float clock;uniform float glow;uniform float opacity;uniform float gateCut;varying vec2 texcoord;varying vec3 tint;varying vec3 world;varying float depth;
    void main(){if(gateCut>.5&&texcoord.x>.30&&texcoord.x<.70&&texcoord.y>.03&&texcoord.y<.68)discard;vec4 sampleColor=texture2D(image,texcoord);if(sampleColor.a<.18)discard;float pulse=.93+.07*sin(clock*3.1);float l1=2.4/(1.+distance(world,vec3(13.,1.1,21.))*distance(world,vec3(13.,1.1,21.))*.5);float l2=2.4/(1.+distance(world,vec3(21.,1.1,21.))*distance(world,vec3(21.,1.1,21.))*.5);float l3=3.2/(1.+pow(distance(world,vec3(18.,3.6,4.)),2.)*.24);float l4=3.2/(1.+pow(distance(world,vec3(39.,-.5,29.)),2.)*.24);vec3 light=vec3(.38,.31,.27)+vec3(.63,.19,.045)*(l1+l2+l3+l4)*pulse+vec3(.5)/(1.+depth*.2);vec3 rgb=sampleColor.rgb*tint*light;rgb+=sampleColor.rgb*glow;float fog=1.-exp(-depth*.055);rgb=mix(rgb,vec3(.055,.027,.022),fog);gl_FragColor=vec4(rgb,sampleColor.a*opacity);}`;
    let program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));this.program=program;gl.useProgram(program);
    this.attributes={};for(let a of ['position','uv','color'])this.attributes[a]=gl.getAttribLocation(program,a);
    this.uniforms={};for(let a of ['camera','yaw','pitch','aspect','image','sprite','clock','glow','opacity','gateCut'])this.uniforms[a]=gl.getUniformLocation(program,a);
    this.staticBuffer=gl.createBuffer();this.dynamicBuffer=gl.createBuffer();this.rebuildWorld(level,floorAt,ceilingAt);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.035,.02,.015,1);gl.disable(gl.CULL_FACE);
  }
  rebuildWorld(level,floorAt=()=>0,ceilingAt=()=>3.5){
    this.level=level;const gl=this.gl,mesh=[],solid=(x,y)=>(level[y]?.[x]??'#')==='#';
    for(let y=0;y<level.length;y++)for(let x=0;x<level[y].length;x++){
      if(solid(x,y))continue;const floor=floorAt(x,y),ceiling=ceilingAt(x+.5,y+.5);
      this.quad(mesh,[[x,floor,y],[x+1,floor,y],[x+1,floor,y+1],[x,floor,y+1]],[.66,.61,.55]);
      this.quad(mesh,[[x,ceiling,y],[x,ceiling,y+1],[x+1,ceiling,y+1],[x+1,ceiling,y]],[.42,.39,.37]);
      for(let [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nx=x+dx,ny=y+dy,isWall=solid(nx,ny),otherFloor=floorAt(nx,ny),otherCeiling=ceilingAt(nx+.5,ny+.5);
        const sidePoints=(low,high)=>dx===-1?[[x,low,y],[x,low,y+1],[x,high,y+1],[x,high,y]]:dx===1?[[x+1,low,y+1],[x+1,low,y],[x+1,high,y],[x+1,high,y+1]]:dy===-1?[[x+1,low,y],[x,low,y],[x,high,y],[x+1,high,y]]:[[x,low,y+1],[x+1,low,y+1],[x+1,high,y+1],[x,high,y+1]];
        const tint=dx?[.82,.78,.71]:[1,.95,.86];
        if(isWall)this.quad(mesh,sidePoints(floor,ceiling),tint,ceiling-floor);
        else{
          if(otherFloor>floor+.01)this.quad(mesh,sidePoints(floor,otherFloor),[.85,.72,.53],otherFloor-floor);
          if(otherCeiling<ceiling-.01)this.quad(mesh,sidePoints(otherCeiling,ceiling),tint,ceiling-otherCeiling);
        }
      }
    }
    this.staticCount=mesh.length/8;gl.bindBuffer(gl.ARRAY_BUFFER,this.staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);
  }
  quad(out,points,tint=[1,1,1],repeat=1){const uv=[[0,0],[1,0],[1,repeat],[0,repeat]];for(let i of [0,1,2,0,2,3])out.push(...points[i],...uv[i],...tint)}
  texture(source,repeat=false){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);return t}
  async load(sprites){const load=url=>new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Unable to load '+url));img.src=url});let [atlas,stone]=await Promise.all([load('assets/infernal-atlas.png'),load('assets/basalt.png')]);
    let surface=document.createElement('canvas');surface.width=surface.height=1024;surface.getContext('2d').drawImage(stone,0,0,1024,1024);this.stone=this.texture(surface,true);
    for(let i=0;i<6;i++){let c=document.createElement('canvas');c.width=512;c.height=512;let g=c.getContext('2d');const split=atlas.height*.543;g.drawImage(atlas,(i%3)*atlas.width/3,i<3?0:split,atlas.width/3,i<3?split:atlas.height-split,0,0,512,512);if(i<3)this.textures[i]=this.texture(c);else if(i<5)this.weapons.push(c);else this.textures.fire=this.texture(c)}
    {const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.strokeStyle='#bd663ca0';g.lineWidth=2;g.beginPath();g.moveTo(20,7);g.lineTo(27,22);g.lineTo(23,35);g.lineTo(35,45);g.lineTo(30,58);g.moveTo(23,35);g.lineTo(45,28);g.stroke();this.textures.crack=this.texture(c)}
    for(let kind of ['blood','bloodstain']){let c=document.createElement('canvas');c.width=c.height=64;let g=c.getContext('2d');g.fillStyle=kind==='blood'?'#a6160e':'#610b08';g.beginPath();for(let i=0;i<24;i++){let a=i*Math.PI/12,r=kind==='blood'?12+Math.random()*15:14+Math.random()*16;let x=32+Math.cos(a)*r,y=32+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.fill();g.fillStyle='#da302333';g.beginPath();g.ellipse(27,26,8,6,0,0,7);g.fill();this.textures[kind]=this.texture(c)}
    const [heavy,gate]=await Promise.all([load('assets/heavy-machine-gun.png'),load('assets/demon-gate.png')]);this.weapons.push(heavy);this.textures.heavy=this.texture(heavy);this.textures.portal=this.texture(gate);{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),fog=g.createRadialGradient(64,85,3,64,64,88);fog.addColorStop(0,'#3b0a03');fog.addColorStop(.55,'#100201');fog.addColorStop(1,'#000000');g.fillStyle=fog;g.fillRect(0,0,128,128);for(let i=0;i<45;i++){g.fillStyle=i%2?'#8d240a':'#d44a12';g.fillRect(Math.random()*128,Math.random()*128,1,2)}this.textures.gateVoid=this.texture(c)}
    for(let [kind,source]of Object.entries(sprites))if(!this.textures[kind])this.textures[kind]=this.texture(source);
    this.ready=true;
  }
  bind(buffer){let gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let [name,size,offset]of [['position',3,0],['uv',2,12],['color',3,20]]){let a=this.attributes[name];gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset)}}
  draw(player,objects,clock){if(!this.ready)return;let gl=this.gl;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.uniform3f(this.uniforms.camera,player.x,(player.eyeZ??player.z??0)+1.05,player.y);gl.uniform1f(this.uniforms.yaw,player.a);gl.uniform1f(this.uniforms.pitch,player.pitch);gl.uniform1f(this.uniforms.aspect,this.canvas.width/this.canvas.height);gl.uniform1f(this.uniforms.clock,clock);gl.uniform1i(this.uniforms.image,0);gl.uniform1f(this.uniforms.glow,0);gl.uniform1f(this.uniforms.opacity,1);gl.uniform1f(this.uniforms.gateCut,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.stone);gl.disable(gl.BLEND);gl.depthMask(true);this.bind(this.staticBuffer);gl.drawArrays(gl.TRIANGLES,0,this.staticCount);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.bind(this.dynamicBuffer);const rx=-Math.sin(player.a),rz=Math.cos(player.a);
    objects.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
    for(let o of objects){let h=o.height??1.5,w=o.width??h*(o.kind==='portal'?.8:1),base=o.base??0;if(o.kind==='fire'){h=w=.32}if(o.kind==='portal'&&o.progress>.001){const voidMesh=[],left=-w*.2,right=w*.2,low=base+h*.03,high=base+h*.68;this.quad(voidMesh,[[o.x+rx*left,low,o.y+rz*left],[o.x+rx*right,low,o.y+rz*right],[o.x+rx*right,high,o.y+rz*right],[o.x+rx*left,high,o.y+rz*left]]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(voidMesh),gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,this.textures.gateVoid);gl.uniform1f(this.uniforms.gateCut,0);gl.uniform1f(this.uniforms.opacity,1);gl.uniform1f(this.uniforms.glow,.6);gl.drawArrays(gl.TRIANGLES,0,6)}let mesh=[];if(o.wallDecal){w=.45;this.quad(mesh,[[o.x,base,o.y-w/2],[o.x,base,o.y+w/2],[o.x,base+h,o.y+w/2],[o.x,base+h,o.y-w/2]])}else if(o.ground){w=o.size;this.quad(mesh,[[o.x-w/2,base,o.y-w/2],[o.x+w/2,base,o.y-w/2],[o.x+w/2,base,o.y+w/2],[o.x-w/2,base,o.y+w/2]])}else this.quad(mesh,[[o.x-rx*w/2,base,o.y-rz*w/2],[o.x+rx*w/2,base,o.y+rz*w/2],[o.x+rx*w/2,base+h,o.y+rz*w/2],[o.x-rx*w/2,base+h,o.y-rz*w/2]],o.hit>0?[1.9,.5,.4]:[1,1,1]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,this.textures[o.kind]);gl.uniform1f(this.uniforms.opacity,o.opacity??1);gl.uniform1f(this.uniforms.glow,o.kind==='fire'?.9:o.kind==='seal'?(o.active?.9:0):o.kind==='portal'?(o.active?.55:0):o.kind==='heavy'?.12:0);gl.uniform1f(this.uniforms.gateCut,o.kind==='portal'&&o.progress>.001?1:0);gl.drawArrays(gl.TRIANGLES,0,6);
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
