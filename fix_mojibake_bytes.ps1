# fix_mojibake_bytes.ps1
# This script fixes double-encoded UTF-8 by working at the byte level.
# When UTF-8 text is misread as CP-1252 and re-encoded as UTF-8,
# each original byte B becomes the 2-3 byte UTF-8 encoding of codepoint B.
# We reverse this by reading as CP-1252 then treating result as raw bytes for UTF-8 decode.

$filePath = "c:\Users\Netcom\Vidyaportal\index.html"

# Read raw bytes
$bytes = [System.IO.File]::ReadAllBytes($filePath)

# Decode as UTF-8 to get the text with mojibake
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Now re-encode as CP-1252 to get the "original" bytes back
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

# Process line by line
$lines = $text -split "`r`n"
$fixedLines = @()

foreach ($line in $lines) {
    $original = $line
    
    # Check if line contains mojibake markers (chars in U+00C0..U+00FF range that look like Ã, Â etc.)
    if ($line -match '[\xC0-\xFF]{2}') {
        try {
            # Try to fix: encode back to CP-1252 bytes, then decode as UTF-8
            $lineBytes = $cp1252.GetBytes($line)
            $fixed = [System.Text.Encoding]::UTF8.GetString($lineBytes)
            
            # Validate: should not contain replacement chars and should be shorter
            if (-not $fixed.Contains([char]0xFFFD) -and $fixed.Length -le $line.Length) {
                $line = $fixed
            }
        } catch {
            # Keep original if conversion fails
        }
    }
    
    $fixedLines += $line
}

$result = $fixedLines -join "`r`n"
[System.IO.File]::WriteAllText($filePath, $result, [System.Text.Encoding]::UTF8)

# Verify
$check = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
$remaining = ([regex]::Matches($check, 'Ã')).Count
Write-Host "Done. Remaining 'A-tilde' markers: $remaining"
