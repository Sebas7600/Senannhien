let ctx: AudioContext | null = null;
let ambient: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
export function setAmbient(enabled: boolean) {
  if (!enabled) { ambient?.source.stop(); ambient = null; return; }
  ctx ??= new AudioContext(); void ctx.resume();
  if (ambient) return;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
  const samples = buffer.getChannelData(0); let last = 0;
  for (let i = 0; i < samples.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02; samples[i] = last * 2.5; }
  const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650;
  const gain = ctx.createGain(); gain.gain.value = 0.14;
  source.connect(filter).connect(gain).connect(ctx.destination); source.start(); ambient = { source, gain };
}
export function playBell() {
  if (!useSound()) return;
  ctx ??= new AudioContext(); void ctx.resume();
  for (const [frequency, volume] of [[220, .2], [440.7, .08], [661, .04], [887, .02]]) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 7);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 7);
  }
}
let useSound = () => false;
export function bindSound(check: () => boolean) { useSound = check; }
export function playWood() {
  if (!useSound()) return;
  ctx ??= new AudioContext(); void ctx.resume();
  for (const frequency of [520, 870, 1280]) {
    const osc=ctx.createOscillator(), gain=ctx.createGain(); osc.frequency.value=frequency;osc.type='sine';
    gain.gain.setValueAtTime(.09,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.23);
    osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.25);
  }
}
