# clean_all_text.ps1
$path = "c:\Users\Netcom\Vidyaportal\index.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Replace broken characters using Regex on unicode ranges or exact character patterns
# Any sequence of non-ASCII characters that was part of a mangled symbol:
# 1. Rupee patterns
$content = [regex]::Replace($content, "[\x80-\xFF]{2,8}0\s*Donation", "&#8377;0 Donation")
$content = [regex]::Replace($content, "[\x80-\xFF]{2,8}0\s*Upfront", "&#8377;0 Upfront")
$content = [regex]::Replace($content, "[\x80-\xFF]{2,8}0\s*donation", "&#8377;0 donation")

# 2. Section eyebrows and badges
$content = [regex]::Replace($content, 'class="sec-eyebrow rev"[^>]*>[\x80-\xFF\s]+YOUR CAREER', 'class="sec-eyebrow rev" style="display:inline-block;">&#10003; YOUR CAREER')
$content = [regex]::Replace($content, 'class="sec-eyebrow rev"[^>]*>[\x80-\xFF\s]+Student Stories', 'class="sec-eyebrow rev">&#10003; Student Stories')
$content = [regex]::Replace($content, 'letter-spacing:0.15em; margin-bottom:1rem;" class="reveal">[\x80-\xFF\s]+Premiere Institutions', 'letter-spacing:0.15em; margin-bottom:1rem;" class="reveal">&#10022; Premiere Institutions')

# 3. Bullets in list items
$content = [regex]::Replace($content, '<li>[\x80-\xFF\s]+<strong>', '<li>&bull; <strong>')

# 4. Separators in badges and lines
$content = [regex]::Replace($content, '100% PAPERLESS FINANCING\s*[\x80-\xFF\s]+\s*0% INTEREST EMI', '100% PAPERLESS FINANCING &bull; 0% INTEREST EMI')
$content = [regex]::Replace($content, 'Nationalized Bank Networks</span>\s*[\x80-\xFF\s]+\s*<span>Leading', 'Nationalized Bank Networks</span> &bull; <span>Leading')
$content = [regex]::Replace($content, 'Leading Scheduled Banks</span>\s*[\x80-\xFF\s]+\s*<span>Digital', 'Leading Scheduled Banks</span> &bull; <span>Digital')

# 5. Buttons and loading text
$content = [regex]::Replace($content, 'Loading colleges[\x80-\xFF\s]+', 'Loading colleges...')
$content = [regex]::Replace($content, 'View All Colleges & Courses\s*[\x80-\xFF\s]+</button>', 'View All Colleges & Courses &rarr;</button>')
$content = [regex]::Replace($content, 'Visit VidyaLakshmi Portal\s*[\x80-\xFF\s]+</a>', 'Visit VidyaLakshmi Portal &rarr;</a>')

# 6. Testimonials separators and text
$content = [regex]::Replace($content, 'B\.Tech CSE\s*[\x80-\xFF\s]+\s*RV College', 'B.Tech CSE &middot; RV College')
$content = [regex]::Replace($content, 'MBA\s*[\x80-\xFF\s]+\s*MS Ramaiah', 'MBA &middot; MS Ramaiah')
$content = [regex]::Replace($content, "B\.Sc Nursing\s*[\x80-\xFF\s]+\s*St\. John's", "B.Sc Nursing &middot; St. John's")
$content = [regex]::Replace($content, 'BCA / Cloud Tech\s*[\x80-\xFF\s]+\s*Christ University', 'BCA / Cloud Tech &middot; Christ University')
$content = [regex]::Replace($content, 'B\.Tech AI & DS\s*[\x80-\xFF\s]+\s*BMS Institute', 'B.Tech AI & DS &middot; BMS Institute')

# 7. Testimonial avatars (replace garbled bytes with clean avatar initials)
$content = [regex]::Replace($content, '<div class="tav"[^>]*>[\x80-\xFF\s]+</div>', '<div class="tav" style="background:linear-gradient(135deg,#F0F7E8,#D4EDBA); font-weight:800; color:#1C3A0E; display:flex; align-items:center; justify-content:center;">&#127891;</div>')

# 8. Remaining stray characters in admin/modal labels
$content = [regex]::Replace($content, '1[\x80-\xFF\s]+9 for top 9', '1-9 for top 9')
$content = [regex]::Replace($content, 'within 2[\x80-\xFF\s]+3 business days', 'within 2-3 business days')
$content = [regex]::Replace($content, 'Submit Application\s*[\x80-\xFF\s]+', 'Submit Application &rarr;')

# 9. All remaining non-ascii in JSON-LD FAQ section
$content = [regex]::Replace($content, 'lowest tuition fees with\s*[\x80-\xFF\s]+0 donation', 'lowest tuition fees with &#8377;0 donation')
$content = [regex]::Replace($content, 'Indian states and union territories\s*[\x80-\xFF\s]+including', 'Indian states and union territories &mdash; including')
$content = [regex]::Replace($content, 'lowest fees with\s*[\x80-\xFF\s]+0 donation', 'lowest fees with &#8377;0 donation')

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "All corrupted text replaced cleanly with standard HTML entities!"
