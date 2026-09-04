const fs = require('fs');

// Write SVG icons (browsers accept SVG for PWA icons in modern versions)
// But we also need proper PNG. We'll write minimal valid PNG files using raw bytes.

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#090c13"/>
  <circle cx="96" cy="96" r="80" fill="#e4002b"/>
  <text x="96" y="130" font-family="Impact,Arial Black,sans-serif" font-size="110" font-weight="bold" fill="#ffd700" text-anchor="middle" stroke="#090c13" stroke-width="4">7</text>
  <text x="96" y="175" font-family="Impact,Arial,sans-serif" font-size="22" fill="white" text-anchor="middle" letter-spacing="3">CR7</text>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#090c13"/>
  <circle cx="256" cy="256" r="220" fill="#e4002b"/>
  <text x="256" y="360" font-family="Impact,Arial Black,sans-serif" font-size="300" font-weight="bold" fill="#ffd700" text-anchor="middle" stroke="#090c13" stroke-width="10">7</text>
  <text x="256" y="470" font-family="Impact,Arial,sans-serif" font-size="60" fill="white" text-anchor="middle" letter-spacing="8">CR7</text>
</svg>`;

fs.writeFileSync('icon-192.svg', svg192);
fs.writeFileSync('icon-512.svg', svg512);
fs.writeFileSync('icon.svg', svg512); // main icon
console.log('SVG icons written: icon-192.svg, icon-512.svg, icon.svg');

// Create minimal valid 1x1 PNG as placeholder for PNG icons
// then we update manifest to use SVGs properly
// A valid PNG file header + IHDR + IDAT + IEND for a 1x1 red pixel
function createMinimalPng(color) {
  // This is a known-good 1x1 PNG in base64, red pixel
  const base64_1x1_red = 
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64_1x1_red, 'base64');
}

// We'll update manifest.json to point to SVG icons (all modern browsers support SVG PWA icons)
const manifest = {
  "name": "CR7 Legend • The Ultimate Brother",
  "short_name": "CR7 GOAT",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#090c13",
  "theme_color": "#e4002b",
  "description": "Cristiano Ronaldo Comic Web App! SIUUUUU!",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "maskable"
    },
    {
      "src": "app-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('manifest.json updated with proper icon sizes');
