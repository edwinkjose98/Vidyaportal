$files = @(
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\style.css",
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\index.html"
)

# Tailwind classes replacement
$tailwindReplacements = @{
    "(?i)\s+text-pink-([1-9]00)" = " text-violet-`$1"
    "(?i)\s+bg-pink-([1-9]00)" = " bg-violet-`$1"
    "(?i)\s+border-pink-([1-9]00)" = " border-violet-`$1"
    "(?i)\s+ring-pink-([1-9]00)" = " ring-violet-`$1"
    "(?i)\s+hover:bg-pink-([1-9]00)" = " hover:bg-violet-`$1"
    "(?i)\s+hover:text-pink-([1-9]00)" = " hover:text-violet-`$1"
    "(?i)\s+text-rose-([1-9]00)" = " text-violet-`$1"
    "(?i)\s+bg-rose-([1-9]00)" = " bg-violet-`$1"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding utf8
        
        foreach ($pattern in $tailwindReplacements.Keys) {
            $content = [regex]::Replace($content, $pattern, $tailwindReplacements[$pattern])
        }
        
        # Additional cleanup for meta tags
        $content = $content -replace '#8B5CF6', '#9000FF'
        
        Set-Content $file $content -Encoding utf8
        Write-Host "Tailwind Cleaned $file"
    }
}
