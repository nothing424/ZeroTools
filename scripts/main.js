/* ============================================================
   ZeroSozoo — scripts/main.js
   App Entry Point: Init · Tab Router · Toast · Global Utils
   ============================================================ */

import { MusicPlayer }          from './player.js';
import {
  initQRStudio,
  initTikTokDownloader,
  initYouTubeDownloader,
  initFileUpload,
  initChatAI,
  initDeploySimulator,
} from './tools.js';

/* ─── Tab Registry ───────────────────────────────────────── */
const TABS = [
  { id: 'player',  label: 'Player',  icon: '🎵', init: initPlayerModule },
  { id: 'qr',      label: 'QR',      icon: '▦',  init: (el) => initQRStudio(el) },
  { id: 'tiktok',  label: 'TikTok',  icon: '📱',  init: (el) => initTikTokDownloader(el) },
  { id: 'youtube', label: 'YouTube', icon: '▶',  init: (el) => initYouTubeDownloader(el) },
  { id: 'chat',    label: 'Chat AI', icon: '💬',  init: (el) => initChatAI(el) },
  { id: 'upload',  label: 'Upload',  icon: '📤',  init: (el) => initFileUpload(el) },
  { id: 'deploy',  label: 'Deploy',  icon: '🚀',  init: (el) => initDeploySimulator(el) },
];

/* ─── State ──────────────────────────────────────────────── */
let activeTab       = 'player';
let initialized     = {};
let playerInstance  = null;

/* ─── Boot ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildLayout();
  navigateTo('player');
});

/* ─── Layout Builder ─────────────────────────────────────── */
function buildLayout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <!-- Mesh Background -->
    <div class="mesh-bg" aria-hidden="true"></div>

    <!-- Header -->
    <header class="app-header">
      <a href="#" class="header-logo" onclick="return false;">
        <img src="https://files.catbox.moe/nae4ol.png" alt="ZeroSozoo Logo" />
        <span class="header-logo-text">Zero<span>Sozoo</span></span>
      </a>
      <div class="header-right">
        <div class="status-dot"></div>
        <span class="label" style="color:var(--text-tertiary);">All Systems Live</span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content" id="mainContent">
      ${TABS.map(tab => `
        <section
          id="panel-${tab.id}"
          class="module-panel"
          role="tabpanel"
          aria-labelledby="nav-${tab.id}"
        ></section>
      `).join('')}
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
      <div class="bottom-nav-inner" id="bottomNav">
        ${TABS.map(tab => `
          <button
            id="nav-${tab.id}"
            class="nav-item"
            role="tab"
            aria-selected="false"
            aria-controls="panel-${tab.id}"
            data-tab="${tab.id}"
            title="${tab.label}"
          >
            <span class="nav-icon" aria-hidden="true">${tab.icon}</span>
            <span class="nav-label">${tab.label}</span>
          </button>
        `).join('')}
      </div>
    </nav>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>
  `;

  // Bind nav clicks
  document.getElementById('bottomNav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (btn) navigateTo(btn.dataset.tab);
  });
}

/* ─── Tab Router ─────────────────────────────────────────── */
function navigateTo(tabId) {
  if (tabId === activeTab && initialized[tabId]) return;

  // Deactivate current panel
  const currentPanel = document.getElementById(`panel-${activeTab}`);
  const currentNav   = document.getElementById(`nav-${activeTab}`);

  if (currentPanel) {
    currentPanel.classList.remove('active');
    currentPanel.classList.add('module-exit');
    setTimeout(() => currentPanel.classList.remove('module-exit'), 200);
  }
  if (currentNav) {
    currentNav.classList.remove('active');
    currentNav.setAttribute('aria-selected', 'false');
  }

  // Activate new panel
  activeTab = tabId;
  const panel = document.getElementById(`panel-${tabId}`);
  const navBtn = document.getElementById(`nav-${tabId}`);

  if (navBtn) {
    navBtn.classList.add('active');
    navBtn.setAttribute('aria-selected', 'true');
  }

  if (panel) {
    // Lazy init — only run module init once
    if (!initialized[tabId]) {
      const tab = TABS.find(t => t.id === tabId);
      if (tab) {
        tab.init(panel);
        initialized[tabId] = true;
      }
    }
    panel.classList.add('active');
  }

  // Scroll to top
  const mainContent = document.getElementById('mainContent');
  if (mainContent) mainContent.scrollTop = 0;
}

/* ─── Player Module Init ─────────────────────────────────── */
function initPlayerModule(el) {
  el.innerHTML = `
    <div class="module-header">
      <h2>Liquid Music Player</h2>
      <p>Upload any audio file for a Liquid Glass listening experience.</p>
    </div>
    <div id="playerMount"></div>
  `;

  const mount = el.querySelector('#playerMount');
  playerInstance = new MusicPlayer();
  playerInstance.init(mount);

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    const canvas = mount.querySelector('#playerCanvas');
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width * dpr;
    canvas.height = 64 * dpr;
    if (playerInstance.ctx) playerInstance.ctx.scale(dpr, dpr);
  });
}

/* ─── Toast Notification System ─────────────────────────── */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(10px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ─── Global Error Handler ───────────────────────────────── */
window.addEventListener('unhandledrejection', (e) => {
  console.error('ZeroSozoo error:', e.reason);
});
