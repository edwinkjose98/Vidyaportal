$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Fix-File {
    param ([string]$filePath)
    
    # Read raw bytes so we don't mess up existing UTF-8 characters
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)

    # Base64 encoded find/replace to avoid script syntax errors with weird bytes
    # Key: Base64 of string to find. Value: Base64 of string to replace with.
    $replacements = @{
        "w6Ligqw="       = "4oK1"              # Ã¢â€šÂ¹ -> ₹
        "w6LiipI="       = "4oK1"              # Ã¢â€šÂ -> ₹
        "w6LigrzigJ0="   = "4oCU"              # Ã¢â‚¬â€œ -> —
        "w6LigrzigJk="   = "Jw=="              # Ã¢â‚¬â„¢ -> '
        "w6LigrzipoY="   = "4oCm"              # Ã¢â‚¬Â¦ -> …
        "w4XigJzihKI="   = "4pyF"              # Ã¢Å“â€¦ -> ✅
        "w4XigJzihZc="   = "4pyT"              # Ã¢Å“â€œ -> ✓
        "w4bigLjigJjihLo=" = "8J+Riwo="          # Ã°Å¸â€˜â€¹ -> 👋 (trailing \n issue? wait, "8J+Riwo=" decodes to wave+newline? I'll re-do this)
    }

    # Instead of Base64 pair dictionary which is tedious, we can define byte arrays for find and replace
    # To replace a byte sequence, let's use string replace on the UTF8 string.
    # The string parsing error occurred strictly because of unescaped quotes in the emojis and powershell.
    # We can encode everything via [char]!
}
