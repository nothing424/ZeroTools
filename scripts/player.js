/* ============================================================
   ZeroSozoo — scripts/player.js
   Liquid Music Player: Audio Engine + Visualizer + UI
   ============================================================ */

export class MusicPlayer {
  constructor() {
    this.audio       = null;
    this.audioCtx    = null;
    this.analyser    = null;
    this.source      = null;
    this.animFrame   = null;
    this.isPlaying   = false;
    this.currentTime = 0;
    this.duration    = 0;
    this.isSeeking   = false;
    this.queue       = [];
    this.currentIdx  = 0;

    this.ui = {
      canvas:    null,
      progress:  null,
      playBtn:   null,
      timeEl:    null,
      titleEl:   null,
      artistEl:  null,
      thumb:     null,
    };

    this.render = this.render.bind(this);
  }

  /* ─── Init ─────────────────────────────────────────────── */
  init(containerEl) {
    containerEl.innerHTML = this.buildHTML();
    this.cacheUI(containerEl);
    this.bindEvents();
    this.renderVisualizer(); // idle loop
  }

  buildHTML() {
    return `
      <div class="player-wrapper glass card" style="position:relative;overflow:hidden;">
        <div class="player-glow"></div>

        <!-- Track Info -->
        <div class="player-track flex items-center gap-md" style="margin-bottom:20px;">
          <div class="player-thumb glass" id="playerThumb">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="rgba(165,180,252,0.4)" stroke-width="1.5"/>
              <circle cx="16" cy="16" r="4"  fill="rgba(165,180,252,0.6)"/>
            </svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div id="playerTitle" style="font-family:var(--font-display);font-size:1rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              No Track Loaded
            </div>
            <div id="playerArtist" style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">
              Upload an audio file below
            </div>
          </div>
          <label class="btn btn-glass btn-sm" style="cursor:pointer;">
            <span>📁</span>
            <input type="file" accept="audio/*" id="playerFileInput" style="display:none;">
          </label>
        </div>

        <!-- Visualizer Canvas -->
        <canvas id="playerCanvas" style="width:100%;height:64px;border-radius:10px;background:rgba(0,0,0,0.2);display:block;margin-bottom:16px;"></canvas>

        <!-- Progress Bar -->
        <div class="player-progress-wrap" style="margin-bottom:12px;">
          <div id="playerProgress" style="
            height:4px;
            background:rgba(255,255,255,0.08);
            border-radius:2px;
            cursor:pointer;
            position:relative;
            overflow:visible;
          ">
            <div id="playerProgressFill" style="
              height:100%;
              width:0%;
              background:linear-gradient(90deg,var(--accent-indigo),var(--accent-violet));
              border-radius:2px;
              transition:width 0.1s linear;
              position:relative;
            ">
              <div style="
                position:absolute;
                right:-5px;
                top:50%;
                transform:translateY(-50%);
                width:10px;
                height:10px;
                border-radius:50%;
                background:var(--accent-ice);
                box-shadow:0 0 8px rgba(165,180,252,0.7);
              "></div>
            </div>
          </div>
        </div>

        <!-- Time + Controls -->
        <div class="flex items-center justify-between">
          <span id="playerTime" style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-tertiary);">0:00 / 0:00</span>

          <div class="flex items-center gap-md">
            <button id="playerPrev" class="btn btn-glass btn-icon" title="Previous">⏮</button>
            <button id="playerPlay" class="btn btn-primary btn-icon" title="Play/Pause">▶</button>
            <button id="playerNext" class="btn btn-glass btn-icon" title="Next">⏭</button>
          </div>

          <div class="flex items-center gap-sm">
            <span style="font-size:12px;color:var(--text-tertiary);">🔊</span>
            <input type="range" id="playerVol" min="0" max="1" step="0.01" value="0.8"
              style="width:70px;accent-color:var(--accent-indigo);">
          </div>
        </div>
      </div>
    `;
  }

  cacheUI(el) {
    this.ui.canvas   = el.querySelector('#playerCanvas');
    this.ui.progress = el.querySelector('#playerProgress');
    this.ui.fill     = el.querySelector('#playerProgressFill');
    this.ui.playBtn  = el.querySelector('#playerPlay');
    this.ui.prevBtn  = el.querySelector('#playerPrev');
    this.ui.nextBtn  = el.querySelector('#playerNext');
    this.ui.timeEl   = el.querySelector('#playerTime');
    this.ui.titleEl  = el.querySelector('#playerTitle');
    this.ui.artistEl = el.querySelector('#playerArtist');
    this.ui.fileInput= el.querySelector('#playerFileInput');
    this.ui.volSlider= el.querySelector('#playerVol');

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = this.ui.canvas.getBoundingClientRect();
    this.ui.canvas.width  = (rect.width  || 720) * dpr;
    this.ui.canvas.height = 64 * dpr;
    this.ctx = this.ui.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    this.ui.playBtn.addEventListener('click', () => this.togglePlay());
    this.ui.prevBtn.addEventListener('click', () => this.prev());
    this.ui.nextBtn.addEventListener('click', () => this.next());
    this.ui.fileInput.addEventListener('change', (e) => this.loadFile(e.target.files[0]));
    this.ui.progress.addEventListener('click', (e) => this.seek(e));
    this.ui.volSlider.addEventListener('input', (e) => {
      if (this.audio) this.audio.volume = e.target.value;
    });
  }

  /* ─── Audio Engine ──────────────────────────────────────── */
  loadFile(file) {
    if (!file) return;
    if (this.audio) { this.audio.pause(); this.audio = null; }

    const url = URL.createObjectURL(file);
    this.audio = new Audio(url);
    this.audio.volume = parseFloat(this.ui.volSlider.value);

    // Web Audio API
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.source) this.source.disconnect();
    this.source   = this.audioCtx.createMediaElementSource(this.audio);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 128;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // Metadata
    const name = file.name.replace(/\.[^.]+$/, '');
    this.ui.titleEl.textContent  = name || 'Unknown Track';
    this.ui.artistEl.textContent = 'Local File · ' + this.formatSize(file.size);

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration;
      this.updateTime();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.isSeeking) this.updateTime();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.ui.playBtn.textContent = '▶';
    });

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.ui.playBtn.textContent = '⏸';
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }).catch(() => {});
  }

  togglePlay() {
    if (!this.audio) return;
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.ui.playBtn.textContent = '▶';
    } else {
      this.audio.play();
      this.isPlaying = true;
      this.ui.playBtn.textContent = '⏸';
      if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
    }
  }

  seek(e) {
    if (!this.audio || !this.duration) return;
    const rect = this.ui.progress.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.audio.currentTime = pct * this.duration;
    this.updateTime();
  }

  prev() { /* queue logic placeholder */ }
  next() { /* queue logic placeholder */ }

  updateTime() {
    const cur = this.audio?.currentTime || 0;
    const dur = this.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    this.ui.fill.style.width = `${pct}%`;
    this.ui.timeEl.textContent = `${this.formatTime(cur)} / ${this.formatTime(dur)}`;
  }

  /* ─── Visualizer ────────────────────────────────────────── */
  renderVisualizer() {
    const W  = this.ui.canvas.width  / (window.devicePixelRatio || 1);
    const H  = this.ui.canvas.height / (window.devicePixelRatio || 1);
    const cx = this.ctx;

    cx.clearRect(0, 0, W, H);

    if (this.analyser && this.isPlaying) {
      const bufLen = this.analyser.frequencyBinCount;
      const data   = new Uint8Array(bufLen);
      this.analyser.getByteFrequencyData(data);

      const barW  = (W / bufLen) * 2.2;
      const gap   = 2;
      let x = 0;

      for (let i = 0; i < bufLen; i++) {
        const barH = (data[i] / 255) * (H - 8);
        const hue  = 230 + (i / bufLen) * 60; // indigo → violet
        const alpha= 0.5 + (data[i] / 255) * 0.5;

        cx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;

        // Rounded bar
        const bx = x;
        const by = H - barH - 2;
        const bh = Math.max(barH, 2);
        const br = Math.min(barW / 2, 3);

        cx.beginPath();
        cx.roundRect
          ? cx.roundRect(bx, by, barW - gap, bh, br)
          : cx.rect(bx, by, barW - gap, bh);
        cx.fill();

        x += barW;
        if (x > W) break;
      }
    } else {
      // Idle wave animation
      const t = Date.now() / 1000;
      cx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      cx.lineWidth   = 1.5;
      cx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin((x / W) * Math.PI * 6 + t * 2) * 6
                        + Math.sin((x / W) * Math.PI * 3 + t)      * 3;
        x === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
      }
      cx.stroke();
    }

    this.animFrame = requestAnimationFrame(() => this.renderVisualizer());
  }

  render() { this.renderVisualizer(); }

  /* ─── Helpers ───────────────────────────────────────────── */
  formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  formatSize(bytes) {
    const mb = bytes / 1024 / 1024;
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes/1024).toFixed(0)} KB`;
  }

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.audio?.pause();
    this.audioCtx?.close();
  }
  }
