const fs = require('fs');
let css = fs.readFileSync('c:/Users/ABHINAND THAYYIL/Downloads/unicircle/style.css', 'utf8');

const regex = /\/\*\s+â”€â”€ LEFT PANE[\s\S]*?(?=\.social-btn:hover)/;
css = css.replace(regex, '');

fs.writeFileSync('c:/Users/ABHINAND THAYYIL/Downloads/unicircle/style.css', css);
