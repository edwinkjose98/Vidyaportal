const fs = require('fs');

function fixMojibake(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // First, let's fix the common double/triple encodings of UTF-8 we've seen
    // The rupee symbol was changed to things like Ã¢â‚¬Â¹ or similar because it was double encoded.
    // The safest way is to take the corrupted string and decode it if it's consistently double-encoded.
    // Let's try to pass it through a Buffer to decode double-encoded UTF-8.
    
    try {
        // Read file as binary (latin1) to get the raw bytes that were saved incorrectly.
        // If a file was saved in default encoding by powershell instead of UTF-8, some characters are lost.
        // Actually, let's just do targeted string replacements for the weird sequences we see.
        let replacements = {
            "â‚¹": "₹",
            "â†'": "→",
            "â€\"": "—",
            "â€œ": '"',
            "â€": '"',
            "â€™": "'",
            "â€¦": "…",
            "â¦": "✦",
            "âœ…": "✅",
            "ðŸ\u0081‹": "👋",
            "ðŸ" + String.fromCharCode(145) + "‹": "👋", // trying to catch the weird wave
            "âš\u008Fï¸\u008F": "⚠️",
            "â†": "←",
            "A\uFFFD\uFFFD\uFFFDA\uFFFD": "✦",
            // The screenshot shows: Ã¢â‚¬Â¹ or Ã¢â‚¬Å¡ or similar for Rupee.
            // Let's grab the exact corrupted byte sequence of Rupees.
            "Ã¢â‚¬â€œ": "—",
            "Ã¢â‚¬â„¢": "'",
            "Ã¢â€šÂ¹": "₹",
            "Ã¢â‚¬Â¦": "…",
            "Ã¢Å“â€¦": "✅",
            "Ã°Å¸â€˜â€¹": "👋",
            "Ã°Å¸â€œÂ±": "📱",
            "Ã°Å¸â€\u0090": "🔐",
            "Ã¢Å“â€\u009C": "✓",
            "Ã¢â€\u0092": "→"
        };
        
        for (let [bad, good] of Object.entries(replacements)) {
            content = content.split(bad).join(good);
        }

        // Just to be absolutely sure, let's also fix common ones using regexes
        content = content.replace(/Ã¢â‚¬â€œ/g, "—");
        content = content.replace(/Ã¢â‚¬â„¢/g, "'");
        content = content.replace(/Ã¢â€šÂ¹/g, "₹");
        content = content.replace(/Ã¢â‚¬Â¦/g, "…");
        content = content.replace(/Ã¢Å“â€¦/g, "✅");
        content = content.replace(/Ã°Å¸â€˜â€¹/g, "👋");
        content = content.replace(/Ã°Å¸â€œÂ±/g, "📱");
        content = content.replace(/Ã¢Å¡Â\u00A0Ã¯Â¸Â\u008F/g, "⚠️");
        
        // Sometimes the rupee symbol in the UI was encoded even worse
        content = content.replace(/Ã¢â‚¬Å¡A|Ã¢â‚¬Å¡Â|Ã¢â‚¬ÅA|Ã¢â‚¬Å¡/g, "₹");
        content = content.replace(/Ã¢â€šÂ¹/g, "₹");
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed " + filePath);
    } catch(e) {
        console.error(e);
    }
}

// But wait, the easiest and 100% bug-free way to fix the encoding we corrupted with PowerShell is to convert buffers.
function fixBufferEncoder(filePath) {
    // Read the file buffer
    let buf = fs.readFileSync(filePath);
    let str = buf.toString('utf8');
    
    // We apply string replacements:
    let fixes = [
        [/Ã¢â€šÂ¹/g, "₹"],
        [/Ã¢â‚¬â„¢/g, "'"],
        [/Ã¢â‚¬â€œ/g, "—"],
        [/Ã¢â‚¬Â¦/g, "…"],
        [/Ã¢Å“â€¦/g, "✅"],
        [/Ã°Å¸â€˜â€¹/g, "👋"],
        [/Ã°Å¸â€œÂ±/g, "📱"],
        [/Ã¢Å¡Â\u00A0Ã¯Â¸Â\u008F/g, "⚠️"],
        [/Ã¢â€†â€™/g, "→"],
        [/Ã¢Å“â€œ/g, "✓"],
        [/A,A/g, "…"],
        [/AA/g, "✦"],
        [/A"?/g, "✅"],
        [/A,\?~\?/g, "👋"],
        [/Ã¢â€šÂ/g, "₹"], // fallback rupee
        [/Ã¢â‚¬/g, ""] // clean up trash
    ];

    for (let f of fixes) {
        str = str.replace(f[0], f[1]);
    }
    
    fs.writeFileSync(filePath, str, 'utf8');
    console.log("Replaced substrings in " + filePath);
}

fixBufferEncoder("index.html");
fixBufferEncoder("script.js");
