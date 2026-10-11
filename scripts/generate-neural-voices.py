"""Generate the four local voice clips with Kokoro ONNX; model files stay outside the site."""
from pathlib import Path
import argparse, wave, subprocess
import numpy as np
from kokoro_onnx import Kokoro
parser=argparse.ArgumentParser();parser.add_argument('--model-dir',required=True);args=parser.parse_args()
root=Path(args.model_dir)
engine=Kokoro(str(root/'kokoro-v1.0.onnx'),str(root/'voices-v1.0.bin'))
print('Available male voices:',[v for v in engine.get_voices() if v.startswith('am_')],flush=True)
lines=['Back to hell!', 'Stay down, demon!', 'That’s what you get!', 'Burn in hell!']
# Blend a deep male voice with a sharper voice and use short, emphatic lines.
style=.75*engine.get_voice_style('am_onyx')+.25*engine.get_voice_style('am_fenrir')
for i,text in enumerate(lines):
 samples,rate=engine.create(text,voice=style,speed=1.08,lang='en-us')
 samples=np.asarray(samples,dtype=np.float64)
 indices=np.flatnonzero(np.abs(samples)>.008)
 if len(indices):samples=samples[max(0,indices[0]-int(rate*.025)):min(len(samples),indices[-1]+int(rate*.09))]
 peak=np.max(np.abs(samples));samples*=.78/max(.01,peak)
 fade=min(int(rate*.008),len(samples)//2);samples[:fade]*=np.linspace(0,1,fade);samples[-fade:]*=np.linspace(1,0,fade)
 path=Path('/tmp')/f'kill-forceful-raw-{i}.wav'
 with wave.open(str(path),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((samples*32767).astype('<i2').tobytes())
 print(f'{text}: {len(samples)/rate:.2f}s, {rate}Hz, peak={np.max(np.abs(samples)):.2f}',flush=True)

for i in range(4):
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',f'/tmp/kill-forceful-raw-{i}.wav','-af','asetrate=20750,aresample=24000,atempo=1.1566265,highpass=f=65,equalizer=f=150:t=q:w=0.8:g=2,equalizer=f=2400:t=q:w=1:g=1,acompressor=threshold=0.18:ratio=2.5:attack=3:release=60,volume=1.18,alimiter=limit=0.85','-ar','24000',f'dist/assets/voice/kill-forceful-{i}.wav'],check=True)
