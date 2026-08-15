# fix_modals_and_footer.ps1
$path = "c:\Users\Netcom\Vidyaportal\index.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# 1. Close buttons
$content = [regex]::Replace($content, 'cursor:pointer;color:#9CA3AF;">[^<]+</button>', 'cursor:pointer;color:#9CA3AF;font-size:1.5rem;font-weight:bold;">&times;</button>')
$content = [regex]::Replace($content, 'cursor:pointer;">[^<]+</button>', 'cursor:pointer;font-size:1.5rem;font-weight:bold;color:#6b7280;">&times;</button>')

# 2. Category cards
$content = $content.Replace('B.Tech Ãƒâ€šÃ‚Â· AI Ãƒâ€šÃ‚Â· CSE Ãƒâ€šÃ‚Â· Core Branches', 'B.Tech &middot; AI &middot; CSE &middot; Core Branches')
$content = $content.Replace('Clinical Training Ãƒâ€šÃ‚Â· Verified Degrees', 'Clinical Training &middot; Verified Degrees')

# 3. Modal badges and icons
$content = [regex]::Replace($content, '<span style="background:var\(--pink\);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">[^<]+</span>', '<span style="background:var(--pink);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;"><i class="fa-solid fa-circle-info"></i></span>', 1)
$content = [regex]::Replace($content, '<span style="background:var\(--pink\);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">[^<]+</span>', '<span style="background:var(--pink);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;"><i class="fa-solid fa-bullseye"></i></span>', 1)

# 4. Stray text in About modal
$content = $content.Replace('<div style="font-size:0.8rem; font-weight:800; color:var(--pink); text-transform:uppercase; letter-spacing:0.15em; margin-bottom:1rem;" class="reveal">&#10022; Premiere Institutions</div>' + "`r`n", '')
$content = $content.Replace('<div style="font-size:0.8rem; font-weight:800; color:var(--pink); text-transform:uppercase; letter-spacing:0.15em; margin-bottom:1rem;" class="reveal">&#10022; Premiere Institutions</div>' + "`n", '')

# 5. Mission modal and footer rupee/dashes
$content = [regex]::Replace($content, 'Lowest Fees \([^)]+\)', 'Lowest Fees (&#8377;0 Donation)')
$content = [regex]::Replace($content, 'fees\s*[\x80-\xFF\s]+saving lakhs', 'fees &mdash; saving lakhs')
$content = [regex]::Replace($content, 'with\s*[\x80-\xFF\s]+0 donation', 'with &#8377;0 donation')

# 6. Any other remaining non-ascii sequences
$content = [regex]::Replace($content, '[\xC0-\xFF]{2,}', '')

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Modals and footer fixed!"
