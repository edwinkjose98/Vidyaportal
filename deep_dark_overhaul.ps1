$files = @(
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\style.css",
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\index.html"
)

# Invert Backgrounds
$bgReplacements = @{
    "(?i)background:\s*#(fff|ffffff|white)" = "background: var(--surface, #0F1117)"
    "(?i)background-color:\s*#(fff|ffffff|white)" = "background-color: var(--surface, #0F1117)"
    "(?i)background:\s*#(FAFAFA|F9FAFB|f9fafb)" = "background: var(--black-bg, #05070A)"
    "(?i)background:\s*#(FFF0F8|fff5f8|ffe4ef)" = "background: rgba(144, 0, 255, 0.05)"
}

# Invert Text Colors (Roughly targeting dark text on now-dark backgrounds)
$textReplacements = @{
    "(?i)color:\s*#(1a1523|111827|374151|4B5563|111|000|000000)" = "color: var(--dark, #F9FAFB)"
    "(?i)color:\s*#(8e7381|6B7280|6b4d5a|8c5a6e|9b1d4e)" = "color: #9CA3AF"
}

# Update Borders - Using single quotes for replacement to avoid variable interpretation
$borderReplacements = @{
    '(?i)border:?[\d\.\spx]+solid\s*#(ddd|E5E7EB|F3F4F6|eee|f3d2df|E5E7EB)' = 'border: 1px solid rgba(144, 0, 255, 0.15)'
    '(?i)border-(top|bottom|left|right):?[\d\.\spx]+solid\s*#(F3F4F6|f9fafb|E5E7EB|f3d2df)' = 'border-$1: 1px solid rgba(144, 0, 255, 0.1)'
}

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding utf8
        
        foreach ($pattern in $bgReplacements.Keys) {
            $content = [regex]::Replace($content, $pattern, $bgReplacements[$pattern])
        }
        
        foreach ($pattern in $textReplacements.Keys) {
            $content = [regex]::Replace($content, $pattern, $textReplacements[$pattern])
        }
        
        foreach ($pattern in $borderReplacements.Keys) {
            $content = [regex]::Replace($content, $pattern, $borderReplacements[$pattern])
        }
        
        # Specific cleanup for gradients fading to white
        $content = $content -replace "(?i)(linear-gradient\([^)]+),?\s*(#fff|#ffffff|white)\s*\)", '$1, #05070A)'
        $content = $content -replace "(?i)(linear-gradient\([^)]+),?\s*(#fff|#ffffff|white)\s*([0-9%]+)\)", '$1, #05070A $3)'
        
        Set-Content $file $content -Encoding utf8
        Write-Host "Darkened $file"
    }
}
