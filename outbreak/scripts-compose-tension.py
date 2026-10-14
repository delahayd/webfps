"""Original 20-second tension score: drones, slow minor chords and heartbeat pulses."""
import math, wave, struct
from pathlib import Path
rate=22050; duration=20
notes=[(55,65.406,82.407),(51.913,65.406,77.782),(49,61.735,73.416),(51.913,65.406,77.782)]
out=Path(__file__).parent/'dist/assets/music/containment-tension.wav'
with wave.open(str(out),'wb') as f:
 f.setparams((1,2,rate,0,'NONE','not compressed'))
 data=bytearray()
 for i in range(rate*duration):
  t=i/rate; chord=notes[int(t//5)%4]; phase=(t%5)/5
  blend=.5-.5*math.cos(2*math.pi*phase)
  drone=sum(math.sin(2*math.pi*n*t)+.18*math.sin(2*math.pi*(n*2+.3)*t) for n in chord)*.035
  pulse=t%1.25
  heartbeat=math.sin(2*math.pi*43*t)*math.exp(-pulse*17)*.11
  heartbeat+=math.sin(2*math.pi*38*t)*math.exp(-max(0,pulse-.23)*25)*.065*(pulse>=.23)
  shimmer=(math.sin(2*math.pi*chord[1]*8*t)+math.sin(2*math.pi*(chord[1]*8+1.3)*t))*.008*(.3+.7*blend)
  suspense=math.sin(2*math.pi*110*t+math.sin(t*.35)*3)*.014
  fade=min(1,t/.5,(duration-t)/.5)
  value=max(-.9,min(.9,(drone+heartbeat+shimmer+suspense)*fade))
  data.extend(struct.pack('<h',int(value*32767)))
 f.writeframes(data)
print(out)
