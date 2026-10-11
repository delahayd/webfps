"""Generate the four local voice clips with Kokoro ONNX; model files stay outside the site."""
from pathlib import Path
import argparse, wave
import numpy as np
from kokoro_onnx import Kokoro
parser=argparse.ArgumentParser();parser.add_argument('--model-dir',required=True);args=parser.parse_args()
root=Path(args.model_dir)
engine=Kokoro(str(root/'kokoro-v1.0.onnx'),str(root/'voices-v1.0.bin'))
print('Available male voices:',[v for v in engine.get_voices() if v.startswith('am_')],flush=True)
lines=['Back to hell.', 'One less demon.', 'Your ticket to hell.', 'Not today, demon.']
# A calm, low male voice, retaining natural intonation rather than crushing it with a radio filter.
for i,text in enumerate(lines):
 samples,rate=engine.create(text,voice='am_fenrir',speed=.94,lang='en-us')
 samples=np.asarray(samples,dtype=np.float64)
 indices=np.flatnonzero(np.abs(samples)>.008)
 if len(indices):samples=samples[max(0,indices[0]-int(rate*.025)):min(len(samples),indices[-1]+int(rate*.09))]
 peak=np.max(np.abs(samples));samples*=.78/max(.01,peak)
 fade=min(int(rate*.008),len(samples)//2);samples[:fade]*=np.linspace(0,1,fade);samples[-fade:]*=np.linspace(1,0,fade)
 path=Path('dist/assets/voice')/f'kill-neural-{i}.wav'
 with wave.open(str(path),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((samples*32767).astype('<i2').tobytes())
 print(f'{text}: {len(samples)/rate:.2f}s, {rate}Hz, peak={np.max(np.abs(samples)):.2f}',flush=True)
