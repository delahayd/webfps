"""Original 160 BPM, 32-bar instrumental metal loop. Requires numpy; no Doom music samples."""
import wave
import numpy as np
RATE=32000;BPM=160;BEAT=60/BPM;BARS=32;DURATION=BARS*4*BEAT;N=int(DURATION*RATE)
rng=np.random.default_rng(731);guitars=np.zeros((N,2));drums=np.zeros((N,2));bass=np.zeros((N,2));lead=np.zeros((N,2))
def add(target,samples,start,pan=0,gain=1):
 pos=int(start*RATE);indices=(pos+np.arange(len(samples)))%N
 target[indices,0]+=samples*gain*(1-pan)*.707;target[indices,1]+=samples*gain*(1+pan)*.707
def string(freq,duration,muted=True,detune=1):
 t=np.arange(int(duration*RATE))/RATE
 env=(1-np.exp(-t*1800))*np.exp(-t*(21 if muted else 3.5))
 raw=np.zeros(len(t))
 for f,gain in [(freq,1),(freq*1.5,.58),(freq*2,.42)]:
  phase=t*f*detune;raw+=gain*(2*(phase%1)-1)
 pick=rng.normal(0,.08,len(t))*np.exp(-t*180)
 return np.tanh((raw*.42+pick)*4.5)*env
# Four original riffs, with rests, chromatic turns and syncopated low-D chugs.
riffs=[[0,0,None,0,7,0,0,3,0,None,10,8,0,0,5,3],
       [0,None,0,0,3,5,0,None,0,0,7,6,0,0,3,None],
       [0,0,12,None,10,0,7,0,0,None,3,0,5,3,0,0],
       [0,0,None,0,8,7,0,0,3,None,5,6,0,0,7,None]]
for bar in range(BARS):
 riff=riffs[(bar//4)%4]
 for step,note in enumerate(riff):
  if note is None:continue
  start=(bar*4+step*.25)*BEAT;freq=73.416*2**(note/12);muted=step%4!=2;duration=.17 if muted else .35
  for pan,detune,offset in [(-.78,.998,0),(.78,1.003,.005)]:add(guitars,string(freq,duration,muted,detune),start+offset,pan,.31)
  t=np.arange(int(.19*RATE))/RATE;fund=freq/2
  b=(np.sin(2*np.pi*fund*t)+.25*np.sin(2*np.pi*fund*2*t))*np.exp(-t*12)*(1-np.exp(-t*600));add(bass,b,start,0,.2)
 # Double kicks, snare backbeats and eighth-note cymbals.
 for beat in [0,.75,1.5,2,2.75,3.5]:
  t=np.arange(int(.24*RATE))/RATE;phase=2*np.pi*(48*t+65*(1-np.exp(-t*45))/45)
  kick=np.sin(phase)*np.exp(-t*20)+rng.normal(0,.2,len(t))*np.exp(-t*280);add(drums,kick,(bar*4+beat)*BEAT,0,.38)
 for beat in [1,3]:
  t=np.arange(int(.24*RATE))/RATE;n=rng.normal(0,1,len(t));noise=n-np.concatenate(([0],n[:-1]))*.45
  snare=(noise*.28+np.sin(t*2*np.pi*185)*.35)*np.exp(-t*21)*(1-np.exp(-t*2000));add(drums,snare,(bar*4+beat)*BEAT,-.07,.5)
 for step in range(8):
  t=np.arange(int(.10*RATE))/RATE;n=rng.normal(0,1,len(t));noise=n-np.concatenate(([0],n[:-1]));hat=noise*np.exp(-t*65);add(drums,hat,(bar*4+step*.5)*BEAT,.24,.045 if step%2 else .07)
 if bar%8==0:
  t=np.arange(int(1.6*RATE))/RATE;n=rng.normal(0,1,len(t));crash=(n-np.concatenate(([0],n[:-1])))*np.exp(-t*3);add(drums,crash,bar*4*BEAT,.35,.08)
 if 16<=bar<24:
  for beat,note in [(0,12),(1.5,15),(2,14),(3,10)]:
   freq=293.665*2**(note/12);t=np.arange(int(.30*RATE))/RATE
   l=np.tanh((np.sin(2*np.pi*freq*t+.028*np.sin(2*np.pi*5*t))+np.sin(2*np.pi*freq*2*t)*.35)*2)*np.exp(-t*6)
   add(lead,l,(bar*4+beat)*BEAT,.12,.09)
# Cabinet response removes synth fizz, adds low-mid body and keeps the double tracks separate.
f=np.fft.rfftfreq(N,1/RATE);cabinet=(1-np.exp(-(f/80)**2))/(1+(f/3300)**6)
cabinet*=1-.4*np.exp(-((f-900)/280)**2)
for channel in range(2):guitars[:,channel]=np.fft.irfft(np.fft.rfft(guitars[:,channel])*cabinet,N)
track=guitars+bass+drums+lead
# Short room reflections are circular, preserving the loop's continuity.
for delay,gain in [(0.044,.10),(.089,.06)]:track+=np.roll(drums+lead,int(delay*RATE),axis=0)*gain
track=np.tanh(track*1.6);track*=.88/np.max(np.abs(track))
with wave.open('/tmp/inferno-metal.wav','wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((track*32767).astype('<i2').tobytes())
print(f'Original metal loop: {BPM} BPM, {BARS} bars, {DURATION:.2f}s, RMS {np.sqrt(np.mean(track**2)):.3f}')
