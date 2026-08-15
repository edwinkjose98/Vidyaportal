$cssPath = "c:\Users\Netcom\Vidyaportal\style.css"
$content = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)

# Root vars
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--pink:\s*#[0-9a-fA-F]+', '--pink: #0284c7')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--pink-light:\s*#[0-9a-fA-F]+', '--pink-light: #f0f9ff')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--pink-mid:\s*#[0-9a-fA-F]+', '--pink-mid: #e0f2fe')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--orange:\s*#[0-9a-fA-F]+', '--orange: #0ea5e9')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '--orange-light:\s*#[0-9a-fA-F]+', '--orange-light: #f0f9ff')

# Hex replacements
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#E91E8C', '#0284c7', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#c7285a', '#0284c7', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#e91e63', '#0ea5e9', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#d93b6e', '#0369a1', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#b0174c', '#0369a1', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#D4187F', '#0284c7', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#FFF0F8', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fff0f5', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fdf2f8', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fff7fa', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fffafb', '#f0f9ff', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#FCE4F3', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#f3d2df', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fbcfe8', '#e0f2fe', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '#fce7f3', '#e0f2fe', 'IgnoreCase')

# RGBA replacements
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*233\s*,\s*30\s*,\s*140', 'rgba(2, 132, 199', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*199\s*,\s*40\s*,\s*90', 'rgba(2, 132, 199', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*217\s*,\s*59\s*,\s*110', 'rgba(3, 105, 161', 'IgnoreCase')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'rgba\(\s*251\s*,\s*207\s*,\s*232', 'rgba(224, 242, 254', 'IgnoreCase')

[System.IO.File]::WriteAllText($cssPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "style.css updated successfully"
