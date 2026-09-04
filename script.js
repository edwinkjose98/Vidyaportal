/**
 * THE GOAT BROTHER • CR7 EDITION
 * Fast, pure Ronaldo SIUUU sound playback & simple celebration engine.
 */

const audioEl = document.getElementById('siuuAudio');
const tapOverlay = document.getElementById('tapOverlay');
const openSiuuBtn = document.getElementById('openSiuuBtn');
const mainSiuuBtn = document.getElementById('mainSiuuBtn');
const headerSiuuBtn = document.getElementById('headerSiuuBtn');
const heroPhotoBox = document.getElementById('heroPhotoBox');
const siuuCountBadge = document.getElementById('siuuCountBadge');
const siuuBanner = document.getElementById('siuuBanner');

let siuuCount = 0;
let hasStarted = false;

/**
 * Plays the pure, exact Cristiano Ronaldo SIUUUU sound!
 * No other background music, no other sounds.
 */
function playExactRonaldoSiuuu() {
  if (!audioEl) return;

  try {
    // Reset to start for instant rapid-fire SIUUU
    audioEl.currentTime = 0;
    audioEl.volume = 1.0;
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log('Audio playback prevented:', err);
      });
    }
  } catch (e) {
    console.error('Audio error:', e);
  }

  // Increment counter
  siuuCount++;
  if (siuuCountBadge) {
    siuuCountBadge.textContent = siuuCount;
  }

  // Visual celebrations
  launchConfetti();
  triggerScreenShake();
  showSiuuBanner();
}

/**
 * Confetti Canvas Animation
 */
const canvas = document.getElementById('confettiCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let confettiParticles = [];

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class ConfettiPiece {
  constructor(x, y) {
    this.x = x || (canvas ? canvas.width / 2 : 200);
    this.y = y || (canvas ? canvas.height * 0.35 : 200);
    this.size = Math.random() * 12 + 6;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 16 + 8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 6;
    this.gravity = 0.35;
    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 14;
    const colors = ['#ffd700', '#e4002b', '#ffffff', '#ff4757', '#00ff88'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = 1;
    this.decay = Math.random() * 0.018 + 0.012;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.rotation += this.rotSpeed;
    this.opacity -= this.decay;
  }
  draw() {
    if (!ctx || this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    ctx.restore();
  }
}

function launchConfetti() {
  if (!canvas) return;
  for (let i = 0; i < 65; i++) {
    confettiParticles.push(new ConfettiPiece());
  }
}

function renderConfettiLoop() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      confettiParticles[i].update();
      confettiParticles[i].draw();
      if (confettiParticles[i].opacity <= 0) {
        confettiParticles.splice(i, 1);
      }
    }
  }
  requestAnimationFrame(renderConfettiLoop);
}
renderConfettiLoop();

function triggerScreenShake() {
  document.body.classList.add('screen-shake');
  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  }, 400);
}

function showSiuuBanner() {
  if (!siuuBanner) return;
  siuuBanner.classList.add('active');
  clearTimeout(siuuBanner._timer);
  siuuBanner._timer = setTimeout(() => {
    siuuBanner.classList.remove('active');
  }, 2000);
}

/**
 * Unlock and start surprise
 */
function startSurprise() {
  if (tapOverlay) {
    tapOverlay.classList.add('dismissed');
  }
  playExactRonaldoSiuuu();
  hasStarted = true;
}

if (tapOverlay) {
  tapOverlay.addEventListener('click', () => {
    startSurprise();
  });
}

if (openSiuuBtn) {
  openSiuuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startSurprise();
  });
}

if (mainSiuuBtn) {
  mainSiuuBtn.addEventListener('click', () => {
    playExactRonaldoSiuuu();
  });
}

if (headerSiuuBtn) {
  headerSiuuBtn.addEventListener('click', () => {
    playExactRonaldoSiuuu();
  });
}

if (heroPhotoBox) {
  heroPhotoBox.addEventListener('click', () => {
    playExactRonaldoSiuuu();
  });
}

// Spacebar shortcut
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!hasStarted) {
      startSurprise();
    } else {
      playExactRonaldoSiuuu();
    }
  }
});

// Try autoplay on load (if browser allows it, dismiss overlay immediately)
window.addEventListener('DOMContentLoaded', () => {
  if (audioEl) {
    audioEl.play().then(() => {
      // Browser allowed autoplay!
      if (tapOverlay) tapOverlay.classList.add('dismissed');
      hasStarted = true;
      siuuCount = 1;
      if (siuuCountBadge) siuuCountBadge.textContent = '1';
      launchConfetti();
      showSiuuBanner();
    }).catch(() => {
      // Browser requires user interaction, tap overlay is ready and waiting for 1 tap!
    });
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.log('SW registration note:', err);
  });
}
