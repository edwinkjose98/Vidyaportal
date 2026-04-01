$files = @(
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\style.css",
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\index.html",
    "c:\Users\ABHINAND THAYYIL\Downloads\unicircle\script.js"
)

$deepPinks = @(
    "#e91e8c", "#E91E8C",
    "#c7285a", "#C7285A",
    "#d93b6e", "#D93B6E",
    "#c63b6e", "#C63B6E",
    "#b13f64", "#B13F64",
    "#ae1346", "#AE1346",
    "#9a0e3f", "#9A0E3F",
    "#d0187a", "#D0187A",
    "#ec4899", "#EC4899",
    "#e31671", "#E31671",
    "#f472b6", "#F472B6",
    "#ff6baf", "#FF6BAF",
    "#bc2b60", "#BC2B60",
    "#8f1e4a", "#8F1E4A",
    "#e91e63", "#E91E63",
    "#c75b81", "#C75B81",
    "#be2d5a", "#BE2D5A",
    "#b95078", "#B95078",
    "#a53f62", "#A53F62",
    "#d4187f", "#D4187F",
    "#FF6B9D", "#ff6b9d"
)

$lightPinks = @(
    "#f3d2df", "#F3D2DF",
    "#fff2f7", "#FFF2F7",
    "#fffbfd", "#FFFBFD",
    "#f0c8d6", "#F0C8D6",
    "#e7bacb", "#E7BACB",
    "#ffb3c6", "#FFB3C6",
    "#fecdd3", "#FECDD3",
    "#fffafb", "#FFFAFB",
    "#fff5f8", "#FFF5F8",
    "#ffe4ef", "#FFE4EF",
    "#fff0f4", "#FFF0F4",
    "#fff0f8", "#FFF0F8",
    "#fdf2f8", "#FDF2F8"
)

$mutedPinks = @(
    "#822f4e", "#822F4E",
    "#8e4462", "#8E4462",
    "#8e7381", "#8E7381",
    "#6b4d5a", "#6B4D5A",
    "#8c5a6e", "#8C5A6E",
    "#9b1d4e", "#9B1D4E",
    "#b42850", "#B42850",
    "#b95078", "#B95078",
    "#cdadbb", "#CDADBB",
    "#c57f9a", "#C57F9A"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding utf8
        
        # Deep Pinks to Electric Violet
        foreach ($p in $deepPinks) {
            $content = $content -replace [regex]::Escape($p), "#9000FF"
        }
        
        # Light Pinks to Pale Violet
        foreach ($p in $lightPinks) {
            $content = $content -replace [regex]::Escape($p), "#F5E6FF"
        }
        
        # Muted/Dark Pinks to Deep Violet/Indigo
        foreach ($p in $mutedPinks) {
            $content = $content -replace [regex]::Escape($p), "#4C1D95"
        }
        
        # RGBA Replacements
        $content = $content -replace "rgba\(233, 30, 140, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(199, 40, 90, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(244, 114, 182, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(180, 40, 80, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(170, 30, 70, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(192, 35, 80, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(217, 59, 110, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        $content = $content -replace "rgba\(255, 240, 248, ([\d\.]+)\)", 'rgba(245, 230, 255, $1)'
        $content = $content -replace "rgba\(139, 92, 246, ([\d\.]+)\)", 'rgba(144, 0, 255, $1)'
        
        Set-Content $file $content -Encoding utf8
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file"
    }
}
