$htmlPath = "c:\Users\Netcom\Vidyaportal\index.html"
$content = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

# Color reversion to Pink in HTML
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#0284c7', '#E91E8C', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#0ea5e9', '#FF4081', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#0369a1', '#C7285A', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#38bdf8', '#FF6B2C', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#f0f9ff', '#FFF0F8', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#e0f2fe', '#FCE4F3', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#bae6fd', '#FCE4F3', 'IgnoreCase')

# RGBA replacements back to pink in HTML
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*2\s*,\s*132\s*,\s*199', 'rgba(233, 30, 140', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*3\s*,\s*105\s*,\s*161', 'rgba(199, 40, 90', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*224\s*,\s*242\s*,\s*254', 'rgba(252, 228, 243', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*240\s*,\s*249\s*,\s*255', 'rgba(255, 240, 248', 'IgnoreCase')

# Mesh background styling
$meshOld = @'
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

$meshPink = @'
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
$content = $content.Replace($meshOld, $meshPink)

[System.IO.File]::WriteAllText($htmlPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "index.html reverted to pink"
