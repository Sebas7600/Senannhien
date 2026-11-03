"""Original 32-second pentatonic instrumental, generated locally with no sampled recordings."""
from pathlib import Path
import numpy as np
from scipy.io.wavfile import write
rate=16000
length=32
music=np.zeros(rate*length,dtype=np.float64)
t=np.arange(len(music))/rate
# Very soft D/A drone, fully faded at the loop boundary.
fade=np.minimum(1,np.minimum(t/1.5,(length-t)/1.5))
music+=(.035*np.sin(2*np.pi*146.832*t)+.022*np.sin(2*np.pi*220*t))*fade
# Breathy sine flute timbre, D major pentatonic; slow 4-second phrases.
for i,freq in enumerate([293.665,369.994,329.628,440,369.994,329.628,246.942,293.665]):
 start=i*4
 a=np.arange(int(rate*3.8))/rate
 env=np.minimum(1,a/.65)*np.minimum(1,(3.8-a)/1.1)
 phase=2*np.pi*freq*a+.003*np.sin(2*np.pi*4.2*a)
 note=(np.sin(phase)+.12*np.sin(2*phase)+.025*np.sin(3*phase))*.10*env
 offset=start*rate
 music[offset:offset+len(note)]+=note
 # Soft delayed reflection, never louder than the direct note.
 delay=int(.23*rate);end=min(len(music),offset+len(note)+delay)
 music[offset+delay:end]+=note[:end-offset-delay]*.16
music*=.8
out=Path(__file__).resolve().parents[1]/'public/audio/truc-lam-pentatonic.wav'
write(out,rate,(np.clip(music,-1,1)*32767).astype(np.int16))
print(out, out.stat().st_size)
