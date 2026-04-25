/* ============================================================
   ZeroSozoo — scripts/tools.js
   QR Studio · TikTok DL · YouTube DL · File Upload
   Chat AI UI · Web Deploy Simulator
   ============================================================ */

import { showToast } from './main.js';

/* ═══════════════════════════════════════════════════════════
   1. QR CODE STUDIO
   ══════════════════════════════════════════════════════════ */
export function initQRStudio(containerEl) {
  containerEl.innerHTML = `
    <div class="module-header">
      <h2>QR Code Studio</h2>
      <p>Generate QR codes in real-time. Download as PNG.</p>
    </div>

    <div class="glass card stack">
      <div class="input-group">
        <input id="qrInput" type="text" class="input" placeholder="Enter text, URL, or any content…" />
        <button id="qrDownload" class="btn btn-primary" disabled>⬇ PNG</button>
      </div>

      <div id="qrPreview" style="
        display:flex;align-items:center;justify-content:center;
        min-height:220px;border-radius:var(--radius-md);
        background:rgba(0,0,0,0.2);border:1px dashed rgba(255,255,255,0.08);
        transition:var(--transition-base);
      ">
        <div style="text-align:center;color:var(--text-tertiary);">
          <div style="font-size:40px;margin-bottom:8px;">▦</div>
          <div class="label">Start typing to generate</div>
        </div>
      </div>

      <div class="flex items-center gap-md" style="flex-wrap:wrap;">
        <label class="label">Size</label>
        <input type="range" id="qrSize" min="128" max="400" value="256" step="8" style="flex:1;accent-color:var(--accent-indigo);">
        <span id="qrSizeLabel" style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-secondary);min-width:60px;">256 px</span>

        <label class="label">Error Correction</label>
        <select id="qrEC" class="input" style="width:auto;padding:8px 12px;">
          <option value="L">L (Low)</option>
          <option value="M" selected>M (Medium)</option>
          <option value="H">H (High)</option>
        </select>
      </div>
    </div>
  `;

  const input   = containerEl.querySelector('#qrInput');
  const preview = containerEl.querySelector('#qrPreview');
  const dlBtn   = containerEl.querySelector('#qrDownload');
  const sizeEl  = containerEl.querySelector('#qrSize');
  const sizeLabel = containerEl.querySelector('#qrSizeLabel');
  const ecEl    = containerEl.querySelector('#qrEC');

  let debounceTimer = null;

  function generate() {
    const text = input.value.trim();
    if (!text) {
      preview.innerHTML = `<div style="text-align:center;color:var(--text-tertiary);"><div style="font-size:40px;margin-bottom:8px;">▦</div><div class="label">Start typing to generate</div></div>`;
      dlBtn.disabled = true;
      return;
    }

    const size = parseInt(sizeEl.value);
    const ec   = ecEl.value;
    const encoded = encodeURIComponent(text);
    const src  = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&ecc=${ec}&bgcolor=0a0b0f&color=a5b4fc&format=png`;

    preview.innerHTML = `
      <div style="position:relative;">
        <img src="${src}" alt="QR Code" id="qrImg"
          style="border-radius:12px;display:block;max-width:100%;box-shadow:0 0 30px rgba(99,102,241,0.3);"
          onload="this.style.opacity=1"
          style="opacity:0;transition:opacity 0.3s ease;"
        />
      </div>`;
    dlBtn.disabled = false;
    dlBtn.onclick = () => downloadQR(src, text);
  }

  function downloadQR(src, text) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `qr-${text.slice(0,20).replace(/[^a-z0-9]/gi,'_')}.png`;
    a.click();
    showToast('QR Code downloaded!', 'success');
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generate, 300);
  });

  sizeEl.addEventListener('input', () => {
    sizeLabel.textContent = sizeEl.value + ' px';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generate, 400);
  });

  ecEl.addEventListener('change', generate);
}

/* ═══════════════════════════════════════════════════════════
   2. TIKTOK DOWNLOADER
   ══════════════════════════════════════════════════════════ */
export function initTikTokDownloader(containerEl) {
  containerEl.innerHTML = `
    <div class="module-header">
      <h2>TikTok Downloader</h2>
      <p>Paste a TikTok URL to fetch video — No Watermark, With Watermark, or MP3.</p>
    </div>

    <div class="stack">
      <div class="glass card">
        <div class="input-group">
          <input id="ttInput" type="text" class="input" placeholder="https://www.tiktok.com/@user/video/…" />
          <button id="ttFetch" class="btn btn-primary">Fetch</button>
        </div>
      </div>

      <div id="ttResult"></div>
    </div>
  `;

  const input  = containerEl.querySelector('#ttInput');
  const btn    = containerEl.querySelector('#ttFetch');
  const result = containerEl.querySelector('#ttResult');

  btn.addEventListener('click', async () => {
    const url = input.value.trim();
    if (!url || !url.includes('tiktok.com')) {
      showToast('Enter a valid TikTok URL', 'error'); return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    result.innerHTML = '';

    try {
      // Using tikwm.com public API (no key needed, respects ToS for personal use)
      const api = `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
      const res = await fetch(api);
      const data = await res.json();

      if (data.code !== 0 || !data.data) throw new Error(data.msg || 'Failed to fetch');

      const d = data.data;
      result.innerHTML = `
        <div class="result-card glass">
          <div class="flex gap-md" style="margin-bottom:16px;flex-wrap:wrap;">
            <img src="${d.cover}" alt="Thumbnail" style="
              width:120px;height:160px;object-fit:cover;
              border-radius:var(--radius-md);flex-shrink:0;
              box-shadow:var(--shadow-glass);
            " onerror="this.style.display='none'"/>
            <div style="flex:1;min-width:140px;">
              <div style="font-weight:500;font-size:0.9rem;margin-bottom:6px;line-height:1.4;">
                ${d.title || 'TikTok Video'}
              </div>
              <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">
                👤 ${d.author?.nickname || 'Unknown'}
              </div>
              <div style="font-size:0.78rem;color:var(--text-tertiary);">
                ❤️ ${formatNum(d.digg_count)} · 💬 ${formatNum(d.comment_count)} · 🔁 ${formatNum(d.share_count)}
              </div>
              <div class="flex gap-sm" style="margin-top:10px;flex-wrap:wrap;">
                <span class="badge badge-silver">HD ${d.hdplay ? '✓' : '×'}</span>
                <span class="badge badge-indigo">${d.duration}s</span>
              </div>
            </div>
          </div>
          <div class="download-row">
            <a href="${d.hdplay || d.play}" target="_blank" download class="download-btn primary-dl">
              🎬 No Watermark
            </a>
            <a href="${d.wmplay || d.play}" target="_blank" download class="download-btn">
              📱 With WM
            </a>
            <a href="${d.music_info?.play || d.music}" target="_blank" download class="download-btn">
              🎵 MP3
            </a>
          </div>
        </div>
      `;
    } catch (err) {
      result.innerHTML = `<div class="result-card glass" style="text-align:center;color:#f87171;">
        ⚠️ ${err.message || 'Could not fetch video. Try a different URL.'}
      </div>`;
    }

    btn.disabled = false;
    btn.textContent = 'Fetch';
  });
}

/* ═══════════════════════════════════════════════════════════
   3. YOUTUBE DOWNLOADER
   ══════════════════════════════════════════════════════════ */
export function initYouTubeDownloader(containerEl) {
  containerEl.innerHTML = `
    <div class="module-header">
      <h2>YouTube Downloader</h2>
      <p>Convert YouTube videos to MP3 or MP4. Paste URL below.</p>
    </div>

    <div class="stack">
      <div class="glass card">
        <div class="stack-sm">
          <div class="input-group">
            <input id="ytInput" type="text" class="input" placeholder="https://youtube.com/watch?v=…" />
            <button id="ytFetch" class="btn btn-primary">Analyze</button>
          </div>
          <div class="flex gap-sm" style="flex-wrap:wrap;">
            <label class="label" style="margin-right:4px;">Format:</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;">
              <input type="radio" name="ytFormat" value="mp3" checked style="accent-color:var(--accent-indigo);"> MP3 Audio
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;">
              <input type="radio" name="ytFormat" value="mp4" style="accent-color:var(--accent-indigo);"> MP4 Video
            </label>
          </div>
        </div>
      </div>

      <div id="ytResult"></div>
    </div>
  `;

  const input  = containerEl.querySelector('#ytInput');
  const btn    = containerEl.querySelector('#ytFetch');
  const result = containerEl.querySelector('#ytResult');

  btn.addEventListener('click', async () => {
    const url = input.value.trim();
    const fmt = containerEl.querySelector('input[name="ytFormat"]:checked').value;
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      showToast('Enter a valid YouTube URL', 'error'); return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    result.innerHTML = '';

    try {
      // Extract video ID
      const videoId = extractYTId(url);
      if (!videoId) throw new Error('Invalid YouTube URL');

      // Fetch metadata via oembed (no key needed)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`;
      const metaRes   = await fetch(oembedUrl);
      const meta      = await metaRes.json();

      // cobalt.tools is a privacy-friendly open-source YT downloader
      const cobaltUrl  = fmt === 'mp3'
        ? `https://cobalt.tools/?u=${encodeURIComponent(url)}&audioOnly=true`
        : `https://cobalt.tools/?u=${encodeURIComponent(url)}`;

      const y2mateUrl  = fmt === 'mp3'
        ? `https://y2mate.com/en89/youtube-mp3/${videoId}.html`
        : `https://y2mate.com/en89/youtube/${videoId}.html`;

      result.innerHTML = `
        <div class="result-card glass">
          <div class="flex gap-md" style="margin-bottom:16px;flex-wrap:wrap;">
            <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg"
              alt="Thumbnail"
              style="width:160px;height:90px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0;box-shadow:var(--shadow-glass);"
              onerror="this.style.display='none'"
            />
            <div style="flex:1;min-width:120px;">
              <div style="font-weight:500;font-size:0.9rem;margin-bottom:4px;line-height:1.4;">
                ${meta.title || 'YouTube Video'}
              </div>
              <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:8px;">
                📺 ${meta.author_name || 'YouTube'}
              </div>
              <div class="flex gap-sm">
                <span class="badge badge-indigo">${fmt.toUpperCase()}</span>
                <span class="badge badge-silver">ID: ${videoId}</span>
              </div>
            </div>
          </div>
          <div class="download-row">
            <a href="${cobaltUrl}" target="_blank" class="download-btn primary-dl">
              🌊 cobalt.tools
            </a>
            <a href="${y2mateUrl}" target="_blank" class="download-btn">
              ⬇ y2mate
            </a>
          </div>
          <p style="font-size:0.72rem;color:var(--text-tertiary);margin-top:12px;text-align:center;">
            Opens trusted third-party service. cobalt.tools is open-source & privacy-friendly.
          </p>
        </div>
      `;
    } catch (err) {
      result.innerHTML = `<div class="result-card glass" style="text-align:center;color:#f87171;">
        ⚠️ ${err.message || 'Could not process URL.'}
      </div>`;
    }

    btn.disabled = false;
    btn.textContent = 'Analyze';
  });
}

/* ═══════════════════════════════════════════════════════════
   4. FILE UPLOAD (Cloudinary)
   ══════════════════════════════════════════════════════════ */
export function initFileUpload(containerEl) {
  const CLOUD_NAME    = 'YOUR_CLOUD_NAME';   // ← Replace with your Cloudinary cloud name
  const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // ← Replace with unsigned upload preset

  containerEl.innerHTML = `
    <div class="module-header">
      <h2>File Upload</h2>
      <p>Drag & drop or click to upload. Powered by Cloudinary.</p>
    </div>

    <div class="glass card stack">
      <div id="dropzone" style="
        border:2px dashed rgba(255,255,255,0.12);
        border-radius:var(--radius-lg);
        padding:48px 24px;
        text-align:center;
        cursor:pointer;
        transition:var(--transition-base);
        position:relative;
      ">
        <div style="font-size:40px;margin-bottom:12px;">📤</div>
        <div style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:6px;">
          Drop files here
        </div>
        <div style="font-size:0.82rem;color:var(--text-tertiary);">
          or <span style="color:var(--accent-ice);cursor:pointer;" id="browseBtn">browse</span> · Max 10 MB
        </div>
        <input type="file" id="fileInput" style="display:none;" multiple accept="image/*,video/*,audio/*,.pdf,.zip">
      </div>

      <div id="uploadList" class="stack-sm"></div>
    </div>
  `;

  const dropzone   = containerEl.querySelector('#dropzone');
  const fileInput  = containerEl.querySelector('#fileInput');
  const browseBtn  = containerEl.querySelector('#browseBtn');
  const uploadList = containerEl.querySelector('#uploadList');

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFiles([...e.target.files]));

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-indigo)';
    dropzone.style.background  = 'rgba(99,102,241,0.06)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '';
    dropzone.style.background  = '';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    dropzone.style.background  = '';
    handleFiles([...e.dataTransfer.files]);
  });

  function handleFiles(files) {
    files.forEach(file => uploadFile(file));
  }

  async function uploadFile(file) {
    const itemId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item   = document.createElement('div');
    item.id      = itemId;
    item.className = 'result-card glass flex items-center gap-md';
    item.style.cssText = 'flex-wrap:wrap;';
    item.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.85rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${file.name}
        </div>
        <div style="font-size:0.75rem;color:var(--text-tertiary);">${formatSize(file.size)}</div>
        <div style="margin-top:8px;">
          <div style="height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">
            <div class="progress-bar-inner" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent-indigo),var(--accent-violet));transition:width 0.2s;border-radius:2px;"></div>
          </div>
        </div>
        <div class="upload-status" style="font-size:0.72rem;color:var(--text-secondary);margin-top:4px;">Preparing…</div>
      </div>
    `;
    uploadList.prepend(item);

    const bar    = item.querySelector('.progress-bar-inner');
    const status = item.querySelector('.upload-status');

    if (CLOUD_NAME === 'YOUR_CLOUD_NAME') {
      // Demo mode
      let prog = 0;
      const t = setInterval(() => {
        prog = Math.min(prog + Math.random() * 15, 100);
        bar.style.width = prog + '%';
        status.textContent = prog < 100 ? `Uploading… ${Math.round(prog)}%` : '✓ Upload complete (demo mode — set Cloudinary credentials)';
        if (prog >= 100) {
          clearInterval(t);
          status.style.color = '#4ade80';
        }
      }, 120);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          bar.style.width = pct + '%';
          status.textContent = `Uploading… ${Math.round(pct)}%`;
        }
      };

      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if (res.secure_url) {
          status.innerHTML = `✓ Done · <a href="${res.secure_url}" target="_blank" style="color:var(--accent-ice);">View ↗</a>`;
          status.style.color = '#4ade80';
          // Copy URL button
          const copy = document.createElement('button');
          copy.className = 'btn btn-glass btn-sm';
          copy.textContent = '📋 Copy URL';
          copy.onclick = () => { navigator.clipboard.writeText(res.secure_url); showToast('URL copied!', 'success'); };
          item.querySelector('div').appendChild(copy);
        } else {
          status.textContent = '✗ Upload failed';
          status.style.color = '#f87171';
        }
      };

      xhr.onerror = () => { status.textContent = '✗ Network error'; status.style.color = '#f87171'; };

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
      xhr.send(formData);
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.style.color = '#f87171';
    }
  }

  function formatSize(b) {
    return b > 1048576 ? (b/1048576).toFixed(1) + ' MB' : (b/1024).toFixed(0) + ' KB';
  }
}

/* ═══════════════════════════════════════════════════════════
   5. CHAT AI UI
   ══════════════════════════════════════════════════════════ */
export function initChatAI(containerEl) {
  const messages = [];

  containerEl.innerHTML = `
    <div class="module-header">
      <h2>Chat AI</h2>
      <p>Glassmorphic conversational interface.</p>
    </div>

    <div class="glass card" style="display:flex;flex-direction:column;height:480px;padding:0;overflow:hidden;">
      <!-- Chat header -->
      <div style="padding:16px 20px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;gap:10px;">
        <div class="status-dot"></div>
        <span style="font-size:0.85rem;font-weight:500;">ZeroAI Assistant</span>
        <span class="badge badge-indigo" style="margin-left:auto;">Demo Mode</span>
      </div>

      <!-- Messages -->
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px;">
        <div class="chat-msg ai">
          <div class="chat-bubble ai-bubble">
            👋 Hello! I'm ZeroAI. This is a demo UI — connect an API key in <code>tools.js</code> to activate real AI responses.
          </div>
          <div class="chat-time">ZeroAI · now</div>
        </div>
      </div>

      <!-- Input row -->
      <div style="padding:16px 20px;border-top:1px solid var(--glass-border);">
        <div class="flex gap-sm">
          <input id="chatInput" type="text" class="input" placeholder="Type a message…" style="flex:1;">
          <button id="chatSend" class="btn btn-primary btn-icon">↑</button>
        </div>
      </div>
    </div>

    <style>
      .chat-msg { display:flex; flex-direction:column; }
      .chat-msg.user { align-items:flex-end; }
      .chat-msg.ai   { align-items:flex-start; }
      .chat-bubble {
        max-width:80%;padding:10px 14px;border-radius:16px;
        font-size:0.88rem;line-height:1.55;
      }
      .ai-bubble {
        background:rgba(255,255,255,0.05);
        border:1px solid var(--glass-border);
        border-bottom-left-radius:4px;
        color:var(--text-primary);
      }
      .user-bubble {
        background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25));
        border:1px solid rgba(99,102,241,0.3);
        border-bottom-right-radius:4px;
        color:var(--text-primary);
      }
      .chat-time {
        font-size:0.65rem;color:var(--text-tertiary);
        margin-top:4px;padding:0 4px;
      }
      #chatMessages::-webkit-scrollbar { width:3px; }
    </style>
  `;

  const chatEl = containerEl.querySelector('#chatMessages');
  const input  = containerEl.querySelector('#chatInput');
  const sendBtn= containerEl.querySelector('#chatSend');

  const demoReplies = [
    "That's interesting! In a real deployment, I'd fetch a response from your AI backend here.",
    "This UI is fully functional — just wire up the API in tools.js to get real responses.",
    "ZeroSozoo is looking great! The Liquid Glass aesthetic really shines here.",
    "You can connect OpenAI, Anthropic, or any other LLM API to power this chat.",
    "The glassmorphism effect uses backdrop-filter: blur(25px) + layered transparency.",
  ];
  let replyIdx = 0;

  function addMessage(content, role) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;

    const now = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    div.innerHTML = `
      <div class="chat-bubble ${role}-bubble">${content}</div>
      <div class="chat-time">${role === 'ai' ? 'ZeroAI' : 'You'} · ${now}</div>
    `;
    chatEl.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    messages.push({ role, content });
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';

    // Simulate typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-msg ai';
    typing.innerHTML = `<div class="chat-bubble ai-bubble" style="display:flex;gap:4px;align-items:center;">
      <span style="animation:pulse 0.8s ease infinite 0s;font-size:18px;line-height:1;">·</span>
      <span style="animation:pulse 0.8s ease infinite 0.15s;font-size:18px;line-height:1;">·</span>
      <span style="animation:pulse 0.8s ease infinite 0.3s;font-size:18px;line-height:1;">·</span>
    </div>`;
    chatEl.appendChild(typing);
    typing.scrollIntoView({ behavior: 'smooth', block: 'end' });

    setTimeout(() => {
      chatEl.removeChild(typing);
      addMessage(demoReplies[replyIdx % demoReplies.length], 'ai');
      replyIdx++;
    }, 900 + Math.random() * 600);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); });
}

/* ═══════════════════════════════════════════════════════════
   6. WEB DEPLOY SIMULATOR
   ══════════════════════════════════════════════════════════ */
export function initDeploySimulator(containerEl) {
  const steps = [
    { msg: 'Cloning repository…',           delay: 600,  type: 'info' },
    { msg: '$ npm install',                  delay: 800,  type: 'cmd'  },
    { msg: 'Installing 847 packages…',       delay: 1200, type: 'info' },
    { msg: '$ npm run build',                delay: 500,  type: 'cmd'  },
    { msg: 'Bundling JavaScript modules…',   delay: 900,  type: 'info' },
    { msg: 'Optimizing assets…',             delay: 700,  type: 'info' },
    { msg: 'Generating static files…',       delay: 600,  type: 'info' },
    { msg: '✓ Build complete in 4.2s',       delay: 300,  type: 'success' },
    { msg: 'Deploying to edge network…',     delay: 800,  type: 'info' },
    { msg: 'Assigning domains…',             delay: 500,  type: 'info' },
    { msg: 'Propagating to 72 edge nodes…',  delay: 1000, type: 'info' },
    { msg: 'Running health checks…',         delay: 600,  type: 'info' },
    { msg: '✓ All checks passed',            delay: 300,  type: 'success' },
    { msg: '🚀 Deployed to zerosozoo.vercel.app', delay: 400, type: 'deploy' },
  ];

  containerEl.innerHTML = `
    <div class="module-header">
      <h2>Web Deploy Simulator</h2>
      <p>Simulate a Vercel / Netlify deployment workflow with terminal animation.</p>
    </div>

    <div class="glass card stack">
      <div class="flex items-center gap-md" style="flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;">
          <div class="label" style="margin-bottom:4px;">Project</div>
          <input type="text" id="deployProject" class="input" value="zerosozoo" placeholder="project-name">
        </div>
        <div>
          <div class="label" style="margin-bottom:4px;">Platform</div>
          <select id="deployPlatform" class="input" style="width:auto;padding:10px 16px;">
            <option value="vercel">▲ Vercel</option>
            <option value="netlify">◆ Netlify</option>
            <option value="cf">⚡ Cloudflare</option>
          </select>
        </div>
        <button id="deployBtn" class="btn btn-primary" style="margin-top:auto;">Deploy ↗</button>
      </div>

      <!-- Terminal -->
      <div id="terminal" style="
        background:#000;
        border-radius:var(--radius-md);
        padding:16px 20px;
        min-height:280px;
        font-family:var(--font-mono);
        font-size:0.8rem;
        overflow-y:auto;
        border:1px solid rgba(255,255,255,0.08);
        display:none;
      ">
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <div style="width:10px;height:10px;border-radius:50%;background:#ff5f57;"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#febc2e;"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#28c840;"></div>
          <span style="color:rgba(255,255,255,0.3);font-size:0.7rem;margin-left:auto;" id="termTitle">zerosozoo — deploy</span>
        </div>
        <div id="termLines"></div>
      </div>

      <div id="deployResult"></div>
    </div>
  `;

  const btn      = containerEl.querySelector('#deployBtn');
  const terminal = containerEl.querySelector('#terminal');
  const termLines= containerEl.querySelector('#termLines');
  const projInput= containerEl.querySelector('#deployProject');
  const platSel  = containerEl.querySelector('#deployPlatform');
  const termTitle= containerEl.querySelector('#termTitle');
  const result   = containerEl.querySelector('#deployResult');

  btn.addEventListener('click', runDeploy);

  async function runDeploy() {
    const project  = projInput.value.trim() || 'my-project';
    const platform = platSel.value;
    const domain   = `${project}.${platform === 'vercel' ? 'vercel.app' : platform === 'netlify' ? 'netlify.app' : 'pages.dev'}`;

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    terminal.style.display = 'block';
    termLines.innerHTML = '';
    result.innerHTML = '';
    termTitle.textContent = `${project} — deploy`;

    const deploySteps = steps.map((s, i) =>
      i === steps.length - 1
        ? { ...s, msg: `🚀 Deployed to https://${domain}` }
        : s
    );

    let totalDelay = 0;
    for (const step of deploySteps) {
      totalDelay += step.delay;
      await appendLine(step, totalDelay);
    }

    setTimeout(() => {
      result.innerHTML = `
        <div class="result-card glass flex items-center gap-md" style="flex-wrap:wrap;">
          <div class="status-dot"></div>
          <div style="flex:1;">
            <div style="font-weight:500;margin-bottom:2px;">Deployment successful!</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);">
              <a href="https://${domain}" target="_blank" style="color:var(--accent-ice);">
                https://${domain} ↗
              </a>
            </div>
          </div>
          <div class="flex gap-sm flex-wrap">
            <span class="badge badge-success">● Live</span>
            <span class="badge badge-silver">Build 4.2s</span>
          </div>
        </div>
      `;
      btn.disabled = false;
      btn.textContent = 'Deploy ↗';
    }, totalDelay + 300);
  }

  function appendLine(step, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.style.cssText = 'margin-bottom:4px;animation:fadeScaleIn 0.2s ease;';

        const colorMap = {
          cmd:     '#a5b4fc',
          success: '#4ade80',
          deploy:  '#fbbf24',
          info:    'rgba(255,255,255,0.5)',
        };
        line.style.color = colorMap[step.type] || colorMap.info;

        const prefix = step.type === 'cmd' ? '' : '  ';
        line.textContent = prefix + step.msg;

        termLines.appendChild(line);
        termLines.scrollTop = termLines.scrollHeight;
        resolve();
      }, delay);
    });
  }
}

/* ─── Shared Helpers ─────────────────────────────────────── */
function formatNum(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toString();
}

function extractYTId(url) {
  const patterns = [
    /(?:v=|youtu\.be\/|\/embed\/|\/v\/|shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
