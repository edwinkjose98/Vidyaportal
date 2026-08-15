$cssPath = "c:\Users\Netcom\Vidyaportal\style.css"
$content = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)

# Root vars in style.css
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--pink:\s*#[0-9a-fA-F]+', '--pink: #E91E8C')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--pink-light:\s*#[0-9a-fA-F]+', '--pink-light: #FFF0F8')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--pink-mid:\s*#[0-9a-fA-F]+', '--pink-mid: #FCE4F3')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--orange:\s*#[0-9a-fA-F]+', '--orange: #FF6B2C')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--orange-light:\s*#[0-9a-fA-F]+', '--orange-light: #FFF4EE')

# Hex replacements back to pink
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#0284c7', '#E91E8C', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#0ea5e9', '#FF4081', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#0369a1', '#C7285A', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#38bdf8', '#FF6B2C', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#f0f9ff', '#FFF0F8', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#e0f2fe', '#FCE4F3', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#bae6fd', '#FCE4F3', 'IgnoreCase')

# RGBA replacements back to pink
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*2\s*,\s*132\s*,\s*199', 'rgba(233, 30, 140', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*3\s*,\s*105\s*,\s*161', 'rgba(199, 40, 90', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*224\s*,\s*242\s*,\s*254', 'rgba(252, 228, 243', 'IgnoreCase')

[System.IO.File]::WriteAllText($cssPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "style.css reverted to pink successfully"
