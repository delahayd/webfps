"""Prepare heavyweight one-shots from the credited Tabasco/Vincent Sevedge recordings."""
import wave
from pathlib import Path
import numpy as np
RATE=48000
for kind,source,duration,bass_freq,bass_gain in [('revolver','cz',.64,58,.34),('shotgun','shotty',.85,43,.55),('heavy','sks',.35,48,.46)]:
 with wave.open(f'/tmp/inferno-firearms/{source}.wav') as w:data=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
 # Locate the first strong transient, retaining a 2 ms lead-in for the crack.
 envelope=np.max(np.abs(data[:len(data)//240*240].reshape(-1,240)),axis=1)
 groups=np.flatnonzero(envelope>np.max(envelope)*.65);frame=int(groups[0]) if len(groups) else 0
 local=frame*240+int(np.argmax(np.abs(data[frame*240:(frame+1)*240])))
 start=max(0,local-int(RATE*.002));count=int(RATE*duration);clip=np.zeros(count);take=data[start:start+count];clip[:len(take)]=take
 clip-=np.mean(clip);clip*=.8/max(.01,np.max(np.abs(clip)))
 t=np.arange(count)/RATE;tail=np.exp(-np.maximum(0,t-.08)/(duration*.28));clip*=tail
 body=np.sin(2*np.pi*(bass_freq*t+16*(1-np.exp(-t*35))/35))*np.exp(-t/(.18 if kind=='shotgun' else .095))*(1-np.exp(-t*1200))
 clip=np.tanh((clip+body*bass_gain)*1.25)
 dry=clip.copy()
 for delay,gain in [(.065,.15),(.13,.07)]:
  shift=int(delay*RATE);clip[shift:]+=dry[:-shift]*gain
 clip[-int(RATE*.035):]*=np.linspace(1,0,int(RATE*.035));clip*=.92/max(.92,np.max(np.abs(clip)))
 path=Path('dist/assets/sfx')/f'{kind}-heavy.wav'
 with wave.open(str(path),'wb')as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((clip*32767).astype('<i2').tobytes())
 print(f'{kind}: source {source}, onset {start/RATE:.3f}s, {duration}s, RMS {np.sqrt(np.mean(clip**2)):.3f}')
