# fix_mojibake.ps1 - Fix double-encoded UTF-8 in index.html
$path = "c:\Users\Netcom\Vidyaportal\index.html"
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Pattern-based replacements using simple string replace
# Note: Using double-quotes for special chars, single-quotes for literals

# ₹ (Rupee sign) - appears as various mojibake forms  
$text = $text.Replace("$([char]0x00C3)$([char]0x00A2)$([char]0x20AC)$([char]0x0161)$([char]0x00C2)$([char]0x00B9)", [char]0x20B9)
# fallback simpler
$text = $text.Replace("$([char]0xC3)$([char]0xA2)$([char]0xE2)$([char]0x82AC)$([char]0xC5)$([char]0xA1)$([char]0xC2)$([char]0xB9)", "$([char]0x20B9)")

# Try line-by-line approach for known problematic lines
$lines = $text -split "`r`n"

for ($i = 0; $i -lt $lines.Length; $i++) {
    $ln = $lines[$i]
    
    # Fix specific known mojibake patterns by their rendered output
    # "â€"" → em-dash  
    $ln = $ln -replace [regex]::Escape("$([char]0xC3)$([char]0x00A2)$([char]0xE2)$([char]0x201A)$([char]0xC2)$([char]0xAC)$([char]0xE2)$([char]0x20AC)"), [string][char]0x2014
    
    # Simple targeted line fixes based on line numbers from the scan above
    if ($i -eq 6) { # line 7 - title
        $ln = $ln -replace 'A.{1,10}100% Job Guarantee', '&#8212; 100% Job Guarantee'
    }
}

$text = $lines -join "`r`n"
[System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
Write-Host "Done"
