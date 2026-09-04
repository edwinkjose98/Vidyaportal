const fs = require('fs');

const imgBase64 = fs.readFileSync('brother1.jpg').toString('base64');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e4002b"/>
      <stop offset="60%" stop-color="#850017"/>
      <stop offset="100%" stop-color="#090c13"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3a1"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
    <clipPath id="photoCircle">
      <circle cx="256" cy="225" r="165"/>
    </clipPath>
    <filter id="comicDrop">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Background Shield with Portugal & Gold Theme -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)"/>
  <rect x="14" y="14" width="484" height="484" rx="98" fill="none" stroke="url(#goldGrad)" stroke-width="12"/>

  <!-- Comic Halftone / Star Accents -->
  <circle cx="256" cy="225" r="185" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-dasharray="14, 10"/>

  <!-- Brother Photo Embedded inside Circle -->
  <image href="data:image/jpeg;base64,${imgBase64}" x="76" y="45" width="360" height="360" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoCircle)"/>

  <!-- Golden Ring -->
  <circle cx="256" cy="225" r="165" fill="none" stroke="url(#goldGrad)" stroke-width="8"/>

  <!-- #7 Badge Top Right -->
  <g filter="url(#comicDrop)">
    <circle cx="395" cy="105" r="42" fill="#e4002b" stroke="url(#goldGrad)" stroke-width="6"/>
    <text x="395" y="122" font-family="'Impact', 'Arial Black', sans-serif" font-size="50" font-weight="bold" fill="#ffd700" text-anchor="middle">7</text>
  </g>

  <!-- GOAT Crown Top Left -->
  <g filter="url(#comicDrop)">
    <circle cx="115" cy="105" r="42" fill="#121824" stroke="url(#goldGrad)" stroke-width="6"/>
    <text x="115" y="120" font-size="44" text-anchor="middle">👑</text>
  </g>

  <!-- Golden CR7 Banner at Bottom -->
  <g filter="url(#comicDrop)">
    <path d="M 70 405 L 442 405 L 410 478 L 102 478 Z" fill="#e4002b" stroke="url(#goldGrad)" stroke-width="6"/>
    <text x="256" y="457" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" font-weight="bold" fill="#ffd700" text-anchor="middle" letter-spacing="3">CR7 • BROTHER</text>
  </g>
</svg>`;

fs.writeFileSync('icon.svg', svg);
console.log('icon.svg created successfully! Size:', fs.statSync('icon.svg').size);

// Also copy brother1.jpg to app-icon.jpg and app-icon.png for PWA compatibility
fs.copyFileSync('brother1.jpg', 'app-icon.jpg');
fs.copyFileSync('brother1.jpg', 'app-icon.png');
console.log('App icons copied successfully!');
