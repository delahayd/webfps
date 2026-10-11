'use strict';
// A perspective WebGL renderer. World axes: x / elevation / map-y.
class HellRenderer {
  constructor(canvas,level){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true});
    if(!this.gl)throw new Error('WebGL est nécessaire pour cette version.');
    this.level=level;this.textures={};this.weapons=[];this.ready=false;
    const gl=this.gl,compile=(type,source)=>{let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
    const vs=`attribute vec3 position;attribute vec2 uv;attribute vec3 color;uniform vec3 camera;uniform float yaw;uniform float pitch;uniform float aspect;varying vec2 texcoord;varying vec3 tint;varying vec3 world;varying float depth;
    void main(){vec3 delta=position-camera;float c=cos(yaw),s=sin(yaw),cp=cos(pitch),sp=sin(pitch);vec3 right=vec3(-s,0.,c);vec3 up=vec3(-c*sp,cp,-s*sp);vec3 forward=vec3(c*cp,sp,s*cp);float z=dot(delta,forward);float tangent=.57735;gl_Position=vec4(dot(delta,right)/(aspect*tangent),dot(delta,up)/tangent,1.002*z-.08008,z);texcoord=uv;tint=color;world=position;depth=length(delta);}`;
    const fs=`precision mediump float;uniform sampler2D image;uniform float sprite;uniform float clock;uniform float glow;uniform float opacity;varying vec2 texcoord;varying vec3 tint;varying vec3 world;varying float depth;
    void main(){vec4 sampleColor=texture2D(image,texcoord);if(sampleColor.a<.18)discard;float pulse=.93+.07*sin(clock*3.1);float l1=2.4/(1.+distance(world,vec3(9.,1.1,9.))*distance(world,vec3(9.,1.1,9.))*.5);float l2=2.4/(1.+distance(world,vec3(17.,1.1,9.))*distance(world,vec3(17.,1.1,9.))*.5);vec3 light=vec3(.42,.35,.31)+vec3(.63,.19,.045)*(l1+l2)*pulse+vec3(.5)/(1.+depth*.2);vec3 rgb=sampleColor.rgb*tint*light;rgb+=sampleColor.rgb*glow;float fog=1.-exp(-depth*.055);rgb=mix(rgb,vec3(.055,.027,.022),fog);gl_FragColor=vec4(rgb,sampleColor.a*opacity);}`;
    let program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));this.program=program;gl.useProgram(program);
    this.attributes={};for(let a of ['position','uv','color'])this.attributes[a]=gl.getAttribLocation(program,a);
    this.uniforms={};for(let a of ['camera','yaw','pitch','aspect','image','sprite','clock','glow','opacity'])this.uniforms[a]=gl.getUniformLocation(program,a);
    this.staticBuffer=gl.createBuffer();this.dynamicBuffer=gl.createBuffer();let mesh=[];
    const solid=(x,y)=>(level[y]?.[x]??'#')==='#';
    for(let y=0;y<level.length;y++)for(let x=0;x<level[y].length;x++){
      if(solid(x,y))continue;
      this.quad(mesh,[[x,0,y],[x+1,0,y],[x+1,0,y+1],[x,0,y+1]],[.63,.58,.52]);
      this.quad(mesh,[[x,2.8,y],[x,2.8,y+1],[x+1,2.8,y+1],[x+1,2.8,y]],[.45,.42,.4]);
      if(solid(x-1,y))this.quad(mesh,[[x,0,y],[x,0,y+1],[x,2.8,y+1],[x,2.8,y]],[.8,.76,.7],2.8);
      if(solid(x+1,y))this.quad(mesh,[[x+1,0,y+1],[x+1,0,y],[x+1,2.8,y],[x+1,2.8,y+1]],[.8,.76,.7],2.8);
      if(solid(x,y-1))this.quad(mesh,[[x+1,0,y],[x,0,y],[x,2.8,y],[x+1,2.8,y]],[1,.94,.85],2.8);
      if(solid(x,y+1))this.quad(mesh,[[x,0,y+1],[x+1,0,y+1],[x+1,2.8,y+1],[x,2.8,y+1]],[1,.94,.85],2.8);
    }
    this.staticCount=mesh.length/8;gl.bindBuffer(gl.ARRAY_BUFFER,this.staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.035,.02,.015,1);gl.disable(gl.CULL_FACE);
  }
  quad(out,points,tint=[1,1,1],repeat=1){const uv=[[0,0],[1,0],[1,repeat],[0,repeat]];for(let i of [0,1,2,0,2,3])out.push(...points[i],...uv[i],...tint)}
  texture(source,repeat=false){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);return t}
  async load(sprites){const load=url=>new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Impossible de charger '+url));img.src=url});let [atlas,stone]=await Promise.all([load('assets/infernal-atlas.png'),load('assets/basalt.png')]);
    let surface=document.createElement('canvas');surface.width=surface.height=1024;surface.getContext('2d').drawImage(stone,0,0,1024,1024);this.stone=this.texture(surface,true);
    for(let i=0;i<6;i++){let c=document.createElement('canvas');c.width=512;c.height=512;let g=c.getContext('2d');const split=atlas.height*.543;g.drawImage(atlas,(i%3)*atlas.width/3,i<3?0:split,atlas.width/3,i<3?split:atlas.height-split,0,0,512,512);if(i<3)this.textures[i]=this.texture(c);else if(i<5)this.weapons.push(c);else this.textures.fire=this.texture(c)}
    for(let kind of ['blood','bloodstain']){let c=document.createElement('canvas');c.width=c.height=64;let g=c.getContext('2d');g.fillStyle=kind==='blood'?'#a6160e':'#610b08';g.beginPath();for(let i=0;i<24;i++){let a=i*Math.PI/12,r=kind==='blood'?12+Math.random()*15:14+Math.random()*16;let x=32+Math.cos(a)*r,y=32+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.fill();g.fillStyle='#da302333';g.beginPath();g.ellipse(27,26,8,6,0,0,7);g.fill();this.textures[kind]=this.texture(c)}
    for(let [kind,source]of Object.entries(sprites))if(!this.textures[kind])this.textures[kind]=this.texture(source);
    this.ready=true;
  }
  bind(buffer){let gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let [name,size,offset]of [['position',3,0],['uv',2,12],['color',3,20]]){let a=this.attributes[name];gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset)}}
  draw(player,objects,clock){if(!this.ready)return;let gl=this.gl;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.uniform3f(this.uniforms.camera,player.x,1.05,player.y);gl.uniform1f(this.uniforms.yaw,player.a);gl.uniform1f(this.uniforms.pitch,player.pitch);gl.uniform1f(this.uniforms.aspect,this.canvas.width/this.canvas.height);gl.uniform1f(this.uniforms.clock,clock);gl.uniform1i(this.uniforms.image,0);gl.uniform1f(this.uniforms.glow,0);gl.uniform1f(this.uniforms.opacity,1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.stone);gl.disable(gl.BLEND);gl.depthMask(true);this.bind(this.staticBuffer);gl.drawArrays(gl.TRIANGLES,0,this.staticCount);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.bind(this.dynamicBuffer);const rx=-Math.sin(player.a),rz=Math.cos(player.a);
    objects.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
    for(let o of objects){let h=o.height??1.5,w=h*(o.kind==='portal'?.72:1),base=o.base??0;if(o.kind==='seal'){base=.85+Math.sin(clock*2)*.08;h=.6;w=.6}if(o.kind==='fire'){base=.95;h=w=.32}let mesh=[];if(o.ground){w=o.size;this.quad(mesh,[[o.x-w/2,.012,o.y-w/2],[o.x+w/2,.012,o.y-w/2],[o.x+w/2,.012,o.y+w/2],[o.x-w/2,.012,o.y+w/2]])}else this.quad(mesh,[[o.x-rx*w/2,base,o.y-rz*w/2],[o.x+rx*w/2,base,o.y+rz*w/2],[o.x+rx*w/2,base+h,o.y+rz*w/2],[o.x-rx*w/2,base+h,o.y-rz*w/2]],o.hit>0?[1.9,.5,.4]:[1,1,1]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,this.textures[o.kind]);gl.uniform1f(this.uniforms.opacity,o.opacity??1);gl.uniform1f(this.uniforms.glow,['seal','fire'].includes(o.kind)?.9:o.kind==='portal'?(o.active?.9:.05):0);gl.drawArrays(gl.TRIANGLES,0,6)}gl.depthMask(true);
  }
}
