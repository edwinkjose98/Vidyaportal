$htmlPath = "c:\Users\Netcom\Vidyaportal\index.html"
$content = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

# Brand Replacements in HTML
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'Kerala Vidya Portal', 'Bsecure', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'Kerala Vidya', 'Bsecure', 'IgnoreCase')

# Mesh background
$oldMesh = @'
        .mesh-bg {
            background-color: #fffafb !important;
            background-image:
                radial-gradient(at 0% 0%, hsla(330, 100%, 96%, 0.8) 0px, transparent 50%),
                radial-gradient(at 100% 0%, hsla(339, 100%, 94%, 0.8) 0px, transparent 50%),
                radial-gradient(at 100% 100%, hsla(320, 100%, 96%, 0.7) 0px, transparent 50%),
                radial-gradient(at 0% 100%, hsla(340, 100%, 95%, 0.7) 0px, transparent 50%) !important;
            background-size: 100% 100% !important;
            background-attachment: fixed !important;
        }
'@

$newMesh = @'
        .mesh-bg {
            background-color: #f8fafc !important;
            background-image:
                radial-gradient(at 0% 0%, hsla(200, 100%, 94%, 0.8) 0px, transparent 50%),
                radial-gradient(at 100% 0%, hsla(190, 100%, 92%, 0.8) 0px, transparent 50%),
                radial-gradient(at 100% 100%, hsla(210, 100%, 95%, 0.7) 0px, transparent 50%),
                radial-gradient(at 0% 100%, hsla(195, 100%, 94%, 0.7) 0px, transparent 50%) !important;
            background-size: 100% 100% !important;
            background-attachment: fixed !important;
        }
'@
$content = $content.Replace($oldMesh, $newMesh)

# Hex color replacements in index.html
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#E91E8C', '#0284c7', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#c7285a', '#0284c7', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#e91e63', '#0284c7', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#d93b6e', '#0369a1', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#b0174c', '#0369a1', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#822f4e', '#0369a1', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#FFF0F8', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fff0f5', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fdf2f8', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fff7fa', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fffafb', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#FCE4F3', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#f3d2df', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fbcfe8', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fce7f3', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fecdd3', '#bae6fd', 'IgnoreCase')

# RGBA color replacements in index.html
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*233\s*,\s*30\s*,\s*140', 'rgba(2, 132, 199', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*199\s*,\s*40\s*,\s*90', 'rgba(2, 132, 199', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*217\s*,\s*59\s*,\s*110', 'rgba(3, 105, 161', 'IgnoreCase')

[System.IO.File]::WriteAllText($htmlPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "index.html updated successfully"

# Update script.js branding
$jsPath = "c:\Users\Netcom\Vidyaportal\script.js"
$jsContent = [System.IO.File]::ReadAllText($jsPath, [System.Text.Encoding]::UTF8)
$jsContent = [System.Text.RegularExpressions.Regex]::Replace($jsContent, 'Kerala Vidya Portal', 'Bsecure', 'IgnoreCase')
$jsContent = [System.Text.RegularExpressions.Regex]::Replace($jsContent, 'Kerala Vidya', 'Bsecure', 'IgnoreCase')

# Theme color replacements in script.js (if any toast/UI badges use colors)
$jsContent = [System.Text.RegularExpressions.Regex]::Replace($jsContent, '#E91E8C', '#0284c7', 'IgnoreCase')
$jsContent = [System.Text.RegularExpressions.Regex]::Replace($jsContent, '#c7285a', '#0284c7', 'IgnoreCase')
$jsContent = [System.Text.RegularExpressions.Regex]::Replace($jsContent, '#e91e63', '#0284c7', 'IgnoreCase')

[System.IO.File]::WriteAllText($jsPath, $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "script.js updated successfully"
