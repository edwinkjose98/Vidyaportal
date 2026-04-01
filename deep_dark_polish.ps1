$files = @(
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\style.css",
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\index.html"
)

# Comprehensive Dark Mode Mapping
$replacements = @{
    # Backgrounds
    "(?i)background:\s*#(fff|ffffff|white|fafafa|f9fafb|f1f5f9)" = "background: var(--surface, #0F1117)"
    "(?i)background-color:\s*#(fff|ffffff|white|fafafa|f9fafb|f1f5f9)" = "background-color: var(--surface, #0F1117)"
    "(?i)rgba\(255,\s*255,\s*255,\s*([\d\.]+)\)" = 'rgba(15, 17, 23, $1)'
    
    # Borders
    "(?i)border:?[\d\.\spx]+solid\s*#(ddd|eee|f3f4f6|e5e7eb|e2e8f0|f1f5f9)" = "border: 1px solid rgba(144, 0, 255, 0.15)"
    "(?i)border-(top|bottom|left|right):?[\d\.\spx]+solid\s*#(ddd|eee|f3f4f6|e5e7eb|f1f5f9)" = 'border-$1: 1px solid rgba(144, 0, 255, 0.1)'
    
    # Text
    "(?i)color:\s*#(1a1523|111827|374151|4b5563|1f2937|111|000|000000)" = "color: var(--dark, #F9FAFB)"
    "(?i)color:\s*#(6b7280|9ca3af|8e7381|64748b)" = "color: #D1D5DB"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding utf8
        
        foreach ($pattern in $replacements.Keys) {
            $content = [regex]::Replace($content, $pattern, $replacements[$pattern])
        }
        
        # Gradient Polish - fading to dark instead of white
        $content = $content -replace "(?i)(linear-gradient\([^)]+),\s*(#fff|#ffffff|white)\s*(\)|,|[0-9%])", '$1, #05070A$3'
        
        Set-Content $file $content -Encoding utf8
        Write-Host "Polished $file"
    }
}
