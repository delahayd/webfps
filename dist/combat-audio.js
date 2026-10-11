'use strict';
// Local, layered weapon samples: muzzle blast, low-frequency body, mechanisms and room reflections.
class CombatAudio {
  constructor(){this.context=null;this.voices=[];this.voice=null;this.muted=false;this.variant=0;this.voiceEnabled=true;this.musicEnabled=true;this.gameplayActive=false;this.musicSource=null;this.musicBuffer=null;}
  init(context){if(this.context||!context)return;this.context=context;const c=context;this.master=c.createGain();this.master.gain.value=this.muted?0:.8;this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-8;this.limiter.knee.value=5;this.limiter.ratio.value=8;this.limiter.attack.value=.002;this.limiter.release.value=.12;this.limiter.connect(this.master);this.master.connect(c.destination);
    this.samples=[0,1].map(type=>Array.from({length:3},()=>this.weaponSample(type)));
    this.room=c.createConvolver();const impulse=c.createBuffer(2,c.sampleRate*.85,c.sampleRate);for(let ch=0;ch<2;ch++){let data=impulse.getChannelData(ch),smooth=0;for(let i=0;i<data.length;i++){const t=i/c.sampleRate;smooth=.62*smooth+.38*(Math.random()*2-1);data[i]=smooth*Math.exp(-t*8)*.3*(t>.025?1:0)}}this.room.buffer=impulse;let wet=c.createGain();wet.gain.value=.17;this.room.connect(wet);wet.connect(this.limiter);
    this.voiceReady=Promise.all([0,1,2,3].map(async i=>{try{const response=await fetch(`assets/voice/kill-forceful-${i}.wav`);if(!response.ok)throw Error('Voice sample');this.voices[i]=await c.decodeAudioData(await response.arrayBuffer())}catch{this.voices[i]=null}}));
    this.musicGain=c.createGain();this.musicGain.gain.value=0;this.musicGain.connect(this.master);
    this.musicReady=(async()=>{try{const response=await fetch('assets/music/fortress.ogg');if(!response.ok)throw Error('Music sample');this.musicBuffer=await c.decodeAudioData(await response.arrayBuffer());this.startMusic()}catch{this.musicBuffer=null}})();
  }
  startMusic(){if(!this.context||!this.musicBuffer||this.musicSource||!this.gameplayActive)return;const source=this.context.createBufferSource();source.buffer=this.musicBuffer;source.loop=true;source.connect(this.musicGain);this.musicSource=source;source.start();this.updateMusicVolume()}
  updateMusicVolume(){if(!this.musicGain)return;const audible=this.gameplayActive&&this.musicEnabled&&!this.muted;const level=audible?(this.voice?.065:.24):0;this.musicGain.gain.cancelScheduledValues(this.context.currentTime);this.musicGain.gain.setTargetAtTime(level,this.context.currentTime,this.voice?.06:.35)}
  setGameplayActive(active){this.gameplayActive=active;this.startMusic();this.updateMusicVolume()}
  setMusicEnabled(enabled){this.musicEnabled=enabled;this.startMusic();this.updateMusicVolume()}
  setVoiceEnabled(enabled){this.voiceEnabled=enabled;if(!enabled)this.stopVoice()}
  weaponSample(type){const c=this.context,rate=c.sampleRate,duration=type?.92:.58,buffer=c.createBuffer(1,Math.ceil(rate*duration),rate),data=buffer.getChannelData(0);let low=0,previous=0;const bass=type?61:105;
    for(let i=0;i<data.length;i++){let t=i/rate,n=Math.random()*2-1;low=low*.87+n*.13;const sharp=n-previous;previous=n;let attack=Math.min(1,t/.0007),crack=sharp*Math.exp(-t/(type?.022:.012))*.57,blast=low*Math.exp(-t/(type?.105:.052))*2.4,body=Math.sin(2*Math.PI*(bass*t+14*(1-Math.exp(-t*25))/25))*Math.exp(-t/(type?.13:.055))*.48;
      data[i]=(crack+blast+body)*attack;
      // Metallic hammer/cylinder, followed by pump rack for the shotgun.
      for(let delay of type?[.24,.34]:[.12]){let s=t-delay;if(s>0&&s<.08)data[i]+=(n*.23+Math.sin(s*2*Math.PI*1900)*.075)*Math.exp(-s*65)}
    }
    const dry=new Float32Array(data);for(let i=0;i<data.length;i++)for(let [delay,gain]of [[.062,.18],[.128,.085],[.207,.035]]){let index=i-Math.floor(delay*rate);if(index>=0)data[i]+=dry[index]*gain}
    let peak=0;for(let v of data)peak=Math.max(peak,Math.abs(v));for(let i=0;i<data.length;i++)data[i]*=.86/Math.max(.86,peak);return buffer;
  }
  shot(type){if(this.muted||!this.context)return;let s=this.context.createBufferSource();s.buffer=this.samples[type][this.variant++%3];s.playbackRate.value=.97+Math.random()*.06;s.connect(this.limiter);s.connect(this.room);s.start();}
  stoneDoor(){if(this.muted||!this.context)return;const c=this.context,b=c.createBuffer(1,c.sampleRate*.8,c.sampleRate),data=b.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){const t=i/c.sampleRate;low=low*.92+(Math.random()*2-1)*.08;data[i]=(low*.9+Math.sin(t*2*Math.PI*47)*.035)*Math.sin(Math.PI*i/data.length)}let source=c.createBufferSource();source.buffer=b;source.connect(this.limiter);source.connect(this.room);source.start()}
  impact(){if(this.muted||!this.context)return;const c=this.context,b=c.createBuffer(1,Math.floor(c.sampleRate*.09),c.sampleRate),data=b.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){low=low*.72+(Math.random()*2-1)*.28;data[i]=low*Math.exp(-i/c.sampleRate*45)*.5}let source=c.createBufferSource();source.buffer=b;source.connect(this.limiter);source.start();}
  say(index){if(this.muted||!this.voiceEnabled||!this.context)return;this.stopVoice();this.playClip(index)}
  playClip(index){if(this.muted||!this.voiceEnabled||!this.context||!this.voices[index])return;let source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.voices[index];gain.gain.value=.9;source.connect(gain);gain.connect(this.limiter);this.voice=source;this.updateMusicVolume();source.onended=()=>{if(this.voice===source){this.voice=null;this.updateMusicVolume()}};source.start(this.context.currentTime+.10)}
  stopVoice(){const voice=this.voice;this.voice=null;if(voice){try{voice.stop()}catch{}}this.updateMusicVolume()}
  setMuted(muted){this.muted=muted;if(this.master)this.master.gain.setTargetAtTime(muted?0:.8,this.context.currentTime,.015);if(muted)this.stopVoice();this.updateMusicVolume()}
}
