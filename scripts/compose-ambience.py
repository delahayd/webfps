"""Compose a seamless, original 64-second dark ambient loop (requires numpy)."""
import numpy as np, wave
from pathlib import Path
RATE=24000; DURATION=64; n=RATE*DURATION
t=np.arange(n,dtype=np.float64)/RATE
rng=np.random.default_rng(741)
track=np.zeros((n,2),dtype=np.float64)
# D-minor drone with detuned harmonic layers and slowly evolving suspended tones.
for freq,gain in [(36.708,.21),(73.416,.10),(110,.055),(146.832,.045),(174.614,.037),(220,.029)]:
 for channel in range(2):
  f=round((freq+(channel-.5)*.065)*DURATION)/DURATION
  phase=channel*.45+freq*.04
  swell=.7+.3*np.cos(2*np.pi*t/32+phase)
  track[:,channel]+=gain*swell*np.sin(2*np.pi*f*t+phase+.09*np.sin(2*np.pi*t/16))
# Slow dissonant swells that recede again rather than resolving brightly.
for freq,gain,phase in [(155.563,.07,0),(207.652,.045,1.3),(293.665,.025,2.5)]:
 f=round(freq*DURATION)/DURATION;env=(.5+.5*np.sin(2*np.pi*t/64+phase))**3
 track[:,0]+=gain*env*np.sin(2*np.pi*f*t)
 track[:,1]+=gain*env*np.sin(2*np.pi*f*t+.8)
# A low double heartbeat every two seconds; exact periodic phase keeps the seam clean.
for offset,gain in [(0,.26),(.24,.14)]:
 beat=(t-offset)%2;phase=2*np.pi*(41*beat+18*(1-np.exp(-beat*22))/22)
 kick=np.sin(phase)*np.exp(-beat*12)*(1-np.exp(-beat*200))
 track+=gain*kick[:,None]
# Sparse distant metallic notes; each note's reverberant tail wraps around the loop.
for start,freq,pan in [(4,293.665,-.4),(20,220,.4),(36,311.127,-.3),(52,261.626,.3)]:
 dt=(t-start)%DURATION;env=np.exp(-dt*.42)*(1-np.exp(-dt*18))
 bell=np.zeros(n)
 for harmonic,gain in [(1,.045),(2.76,.012),(4.07,.006)]:
  f=round(freq*harmonic*DURATION)/DURATION
  bell+=gain*np.sin(2*np.pi*f*dt)*env
 track[:,0]+=bell*(1-pan);track[:,1]+=bell*(1+pan)
# Seamless band-limited cavern air, generated in the frequency domain.
f=np.fft.rfftfreq(n,1/RATE);shape=np.zeros_like(f);mask=(f>45)&(f<2200)
shape[mask]=(1/np.sqrt(f[mask]))*(1-np.exp(-(f[mask]-45)/120))*np.exp(-f[mask]/1100)
for ch in range(2):
 spectrum=shape*np.exp(1j*rng.uniform(0,2*np.pi,len(f)))
 air=np.fft.irfft(spectrum,n);air/=max(1e-9,np.std(air))
 track[:,ch]+=air*.013*(.7+.3*np.cos(2*np.pi*t/16+ch))
track=np.tanh(track*1.12);track*=.75/np.max(np.abs(track))
path=Path('/tmp/inferno-ambience.wav')
with wave.open(str(path),'wb') as wav:
 wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes((track*32767).astype('<i2').tobytes())
print(f'{path}: {DURATION}s, peak={np.max(np.abs(track)):.3f}, RMS={np.sqrt(np.mean(track**2)):.3f}, seam jump={np.max(np.abs(track[-1]-track[0])):.4f}')
