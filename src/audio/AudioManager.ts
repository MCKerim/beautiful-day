export class AudioManager {
  private ctx: AudioContext | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.buildTapeHiss();
  }

  suspend() { this.ctx?.suspend(); }
  resume()  { this.ctx?.resume();  }

  private loopedNoise(seconds: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const n   = Math.ceil(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    src.start();
    return src;
  }

  private buildTapeHiss() {
    const ctx  = this.ctx!;
    const src  = this.loopedNoise(2);

    // Bandpass shape: highpass to remove rumble, lowpass to cut harsh top
    const hp = ctx.createBiquadFilter();
    hp.type            = 'highpass';
    hp.frequency.value = 1200;

    const lp = ctx.createBiquadFilter();
    lp.type            = 'lowpass';
    lp.frequency.value = 4000;

    const gain         = ctx.createGain();
    gain.gain.value    = 0.012;

    src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
  }

  footstep(sprinting: boolean) {
    if (!this.ctx) return;
    // Soft ground thud
    this.burst(0.06, 160, 0.7, sprinting ? 0.28 : 0.16);
    // Grass swish
    this.burst(0.10, 2600, 2.0, sprinting ? 0.10 : 0.06);
  }

  private burst(dur: number, freq: number, q: number, vol: number) {
    const ctx = this.ctx!;
    const n   = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.25));

    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const filter = ctx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value         = q;
    const gain         = ctx.createGain();
    gain.gain.value    = vol;

    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
  }
}
