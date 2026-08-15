// fix_encoding.js - Run with: node fix_encoding.js
const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Fix double-encoded UTF-8 mojibake
// These are common UTF-8 characters that got double-encoded

const replacements = [
  // Rupee sign ₹ (U+20B9) → double encoded as â‚¹
  ['â‚¹', '₹'],
  ['Ã¢â€šÂ¹', '₹'],
  // Em dash — (U+2014)
  ['â€"', '—'],
  ['Ã¢â‚¬â€"', '—'],
  ['Ã¢â‚¬â€', '—'],
  ['Ã¢â‚¬â€œ', '\u201C'],
  // En dash –
  ['â€"', '–'],
  // Right single quote '
  ['â€™', '\u2019'],
  ['Ã¢â‚¬â„¢', '\u2019'],
  // Left single quote '
  ['â€˜', '\u2018'],
  // Bullet •
  ['â€¢', '\u2022'],
  ['Ã¢â‚¬Â¢', '\u2022'],
  // Ellipsis …
  ['â€¦', '\u2026'],
  // Left arrow ←
  ['Ã¢â€ Â ', '\u2190 '],
  ['â†', '\u2190'],
  // Middle dot ·
  ['Ã‚Â·', '\u00B7'],
  ['Â·', '\u00B7'],
  // Check mark ✓
  ['Ã¢Å"Â¦', '\u2714'],
  ['Ã¢Å"Â"', '\u2713'],
  // Plus/minus
  ['Ã‚Â±', '\u00B1'],
  // Registered trademark ®
  ['Ã‚Â®', '\u00AE'],
  // Copyright ©
  ['Ã‚Â©', '\u00A9'],
  // Non-breaking space
  ['Ã‚Â\u00A0', '\u00A0'],
  // Indian flag emoji (encoded as surrogate pairs in mojibake)
  ['Ã°Å¸â€¡Â®Ã°Å¸â€¡Â³', '🇮🇳'],
  ['Ã°Å¸â€¦Â®Ã°Å¸â€¦Â¹Ã³', '🇮🇳'],
  // Pan-India dash fix
  ['Ã¢â‚¬â€', '—'],
  // Double quote "
  ['Ã¢â‚¬Å"', '\u201C'],
  ['Ã¢â‚¬', '\u201D'],
  // nbsp
  ['Ã\u00C2\u00A0', '\u00A0'],
];

for (const [from, to] of replacements) {
  html = html.split(from).join(to);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Encoding fixed!');
