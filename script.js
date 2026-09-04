/**
 * THE COMIC GOAT BROTHER • CR7 SUPERHERO EDITION
 * Pure Cristiano Ronaldo SIUUU sound engine, comic toggle & visual FX.
 */

const audioEl = document.getElementById('siuuAudio');
const tapOverlay = document.getElementById('tapOverlay');
const openSiuuBtn = document.getElementById('openSiuuBtn');
const mainSiuuBtn = document.getElementById('mainSiuuBtn');
const headerSiuuBtn = document.getElementById('headerSiuuBtn');
const heroStage = document.getElementById('heroStage');
const siuuCountBadge = document.getElementById('siuuCountBadge');
const siuuBanner = document.getElementById('siuuBanner');
const comicToggleBtn = document.getElementById('comicToggleBtn');
const toggleText = document.getElementById('toggleText');

let siuuCount = 0;
let hasStarted = false;
let isComicMode = true;

/**
 * Plays the pure, authentic Cristiano Ronaldo SIUUUU shout!
 * No background music, no other sounds.
 */
function playExactRonaldoSiuuu() {
  if (audioEl) {
    try {
      audioEl.currentTime = 0;
      audioEl.volume = 1.0;
      const p = audioEl.play();
      if (p !== undefined) {
        p.catch((err) => console.log('Audio autoplay policy:', err));
      }
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  // Increment counter
  siuuCount++;
  if (siuuCountBadge) {
    siuuCountBadge.textContent = siuuCount;
  }

  // Celebratory FX
  launchConfetti();
  triggerScreenShake();
  showSiuuBanner();
  spawnComicBurst();
}

/**
 * Comic Mode Toggle (Toggles comic filters vs original photos)
 */
if (comicToggleBtn) {
  comicToggleBtn.addEventListener('click', () => {
    isComicMode = !isComicMode;
    if (isComicMode) {
      document.body.classList.add('comic-mode');
      if (toggleText) toggleText.textContent = 'COMIC: ON';
    } else {
      document.body.classList.remove('comic-mode');
      if (toggleText) toggleText.textContent = 'COMIC: OFF';
    }
    playExactRonaldoSiuuu();
  });
}

/**
 * Spawns floating comic action bursts on screen (BAM!, SIUUU!, GOAL!)
 */
const comicWords = ['💥 SIUUUU!', '⚡ CR7!', '⚽ GOLAZO!', '🐐 GOAT!', '🔥 BOOM!'];
function spawnComicBurst() {
  const burst = document.createElement('div');
  burst.textContent = comicWords[Math.floor(Math.random() * comicWords.length)];
  burst.style.position = 'fixed';
  burst.style.left = `${Math.random() * (window.innerWidth - 160) + 40}px`;
  burst.style.top = `${Math.random() * (window.innerHeight - 200) + 80}px`;
  burst.style.fontFamily = "'Bebas Neue', 'Impact', sans-serif";
  burst.style.fontSize = `${Math.random() * 1.5 + 2.2}rem`;
  burst.style.color = '#ffd700';
  burst.style.textShadow = '3px 3px 0 #000, 0 0 20px rgba(228, 0, 43, 0.9)';
  burst.style.pointerEvents = 'none';
  burst.style.zIndex = '99999';
  burst.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg) scale(0.5)`;
  burst.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  document.body.appendChild(burst);

  requestAnimationFrame(() => {
    burst.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg) scale(1.3) translateY(-40px)`;
    burst.style.opacity = '1';
  });

  setTimeout(() => {
    burst.style.opacity = '0';
    burst.style.transform += ' translateY(-70px) scale(0.8)';
    setTimeout(() => burst.remove(), 400);
  }, 900);
}

/**
 * Confetti Canvas System
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
    const colors = ['#ffd700', '#e4002b', '#ffffff', '#ff1a43', '#00874d'];
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
  for (let i = 0; i < 70; i++) {
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
 * Play on direct interaction or auto-trigger
 */
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

if (heroStage) {
  heroStage.addEventListener('click', () => {
    playExactRonaldoSiuuu();
  });
}

// Spacebar shortcut
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    playExactRonaldoSiuuu();
  }
});

// Automatic play on load or on very first touch/click anywhere
function triggerFirstPlay() {
  if (!hasStarted) {
    hasStarted = true;
    playExactRonaldoSiuuu();
  }
  window.removeEventListener('pointerdown', triggerFirstPlay);
  window.removeEventListener('touchstart', triggerFirstPlay);
  window.removeEventListener('click', triggerFirstPlay);
}

window.addEventListener('DOMContentLoaded', () => {
  if (audioEl) {
    audioEl.play().then(() => {
      hasStarted = true;
      siuuCount = 1;
      if (siuuCountBadge) siuuCountBadge.textContent = '1';
      launchConfetti();
      showSiuuBanner();
    }).catch(() => {
      // Browser autoplay policy requires user gesture: play on very first touch/click anywhere!
      window.addEventListener('pointerdown', triggerFirstPlay, { once: true });
      window.addEventListener('touchstart', triggerFirstPlay, { once: true });
      window.addEventListener('click', triggerFirstPlay, { once: true });
    });
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.log('SW registration note:', err);
  });
}
