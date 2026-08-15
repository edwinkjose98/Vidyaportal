# purge_non_ascii.ps1
$path = "c:\Users\Netcom\Vidyaportal\index.html"
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
$cleanLines = @()

foreach ($line in $lines) {
    $l = $line
    
    # Specific known fixes
    if ($l -match 'class="sec-eyebrow rev"') {
        $l = $l -replace '<div class="sec-eyebrow rev"[^>]*>.*YOUR CAREER.*</div>', '<div class="sec-eyebrow rev" style="display:inline-block;">&#10003; YOUR CAREER &amp; FINANCIAL ADVANTAGE</div>'
        $l = $l -replace '<div class="sec-eyebrow rev">.*Student Stories.*</div>', '<div class="sec-eyebrow rev">&#10003; Student Stories</div>'
    }
    
    if ($l -match 'Premiere Institutions') {
        $l = '<div style="font-size:0.8rem; font-weight:800; color:var(--pink); text-transform:uppercase; letter-spacing:0.15em; margin-bottom:1rem;" class="reveal">&#10022; Premiere Institutions</div>'
    }
    
    if ($l -match 'colleges-empty') {
        $l = '                        <p class="colleges-empty">Loading colleges...</p>'
    }
    
    if ($l -match 'showAllCollegesView') {
        $l = '                            onclick="showAllCollegesView()">View All Colleges &amp; Courses &rarr;</button>'
    }
    
    if ($l -match 'Lock In Unbeatable Lowest Fees') {
        $l = '                                <h3>Lock In Unbeatable Lowest Fees (&#8377;0 Donation)</h3>'
    }
    
    if ($l -match 'lowest conceivable tuition fee packages') {
        $l = '                                <p>We secure direct institutional allotment with the lowest conceivable tuition fee packages, &#8377;0 upfront donation, and zero middleman markups &mdash; saving you lakhs.</p>'
    }
    
    if ($l -match '100% job placement assurance and arranged my education loan') {
        $l = '                                <div class="tt">BVerified gave me 100% job placement assurance and arranged my education loan in just 48 hours completely paperless! I got admission at RVCE with &#8377;0 donation.</div>'
    }
    
    if ($l -match 'RV College of Engineering') {
        $l = '                                        <div class="tcoll">B.Tech CSE &middot; RV College of Engineering</div>'
    }
    
    if ($l -match 'MS Ramaiah Institute') {
        $l = '                                        <div class="tcoll">MBA &middot; MS Ramaiah Institute of Technology</div>'
    }
    
    if ($l -match "St. John's Partner Campus") {
        $l = '                                        <div class="tcoll">B.Sc Nursing &middot; St. John''s Partner Campus</div>'
    }
    
    if ($l -match 'Christ University Partner') {
        $l = '                                        <div class="tcoll">BCA / Cloud Tech &middot; Christ University Partner</div>'
    }
    
    if ($l -match 'BMS Institute') {
        $l = '                                        <div class="tcoll">B.Tech AI &amp; DS &middot; BMS Institute</div>'
    }
    
    if ($l -match '100% PAPERLESS FINANCING') {
        $l = '                                <i class="fa-solid fa-bolt"></i> 100% PAPERLESS FINANCING &bull; 0% INTEREST EMI'
    }
    
    if ($l -match 'PM-Vidyalaxmi') {
        $l = '                                Never let tuition fees become a hurdle. Access <strong style="color: #3E8B1A;">0% Interest Zero-Cost EMI</strong> plans and digital approvals via the government <strong style="color: #3E8B1A;">PM-Vidyalaxmi</strong> loan scheme &mdash; 100% paperless with zero hassle.'
    }
    
    if ($l -match 'Visit VidyaLakshmi Portal') {
        $l = '                                    <i class="fa-solid fa-graduation-cap"></i> Visit VidyaLakshmi Portal &rarr;'
    }
    
    if ($l -match 'Nationalized Bank Networks') {
        $l = '                                        <span>Nationalized Bank Networks</span> &bull; <span>Leading Scheduled Banks</span> &bull; <span>Digital NBFC Partners</span>'
    }
    
    if ($l -match 'lowest fees with' -and $l -match '500\+ verified partner campuses') {
        $l = '                                BVerified guarantees 100% Job Placement, Zero-Cost EMI Education Loans, and the lowest fees with &#8377;0 donation across 500+ verified partner campuses nationwide.'
    }
    
    if ($l -match '<li>' -and $l -match 'Bangalore Colleges:') { $l = '                                    <li>&bull; <strong>Bangalore Colleges:</strong> Engineering, Nursing &amp; MBA</li>' }
    if ($l -match '<li>' -and $l -match 'Chennai & Coimbatore:') { $l = '                                    <li>&bull; <strong>Chennai &amp; Coimbatore:</strong> Top Ranked Universities</li>' }
    if ($l -match '<li>' -and $l -match 'Delhi NCR & Mumbai:') { $l = '                                    <li>&bull; <strong>Delhi NCR &amp; Mumbai:</strong> Management &amp; Tech Hubs</li>' }
    if ($l -match '<li>' -and $l -match 'Hyderabad & Pune:') { $l = '                                    <li>&bull; <strong>Hyderabad &amp; Pune:</strong> AI, Data Science &amp; Healthcare</li>' }
    if ($l -match '<li>' -and $l -match 'Mangalore:') { $l = '                                    <li>&bull; <strong>Mangalore:</strong> Medical, Nursing &amp; Allied Health</li>' }
    if ($l -match '<li>' -and $l -match 'B.Sc Nursing & GNM:') { $l = '                                    <li>&bull; <strong>B.Sc Nursing &amp; GNM:</strong> 100% Hospital Placements</li>' }
    if ($l -match '<li>' -and $l -match 'B.Tech CSE & AI/DS:') { $l = '                                    <li>&bull; <strong>B.Tech CSE &amp; AI/DS:</strong> Top Corporate Recruiter Drives</li>' }
    if ($l -match '<li>' -and $l -match 'MBA / PGDM:') { $l = '                                    <li>&bull; <strong>MBA / PGDM:</strong> 0% Zero-Cost EMI Available</li>' }
    if ($l -match '<li>' -and $l -match 'Paramedical & BPT:') { $l = '                                    <li>&bull; <strong>Paramedical &amp; BPT:</strong> Clinical Lab &amp; Hospital Training</li>' }
    if ($l -match '<li>' -and $l -match 'BCA & Cyber Security:') { $l = '                                    <li>&bull; <strong>BCA &amp; Cyber Security:</strong> Verified Industry Tie-ups</li>' }
    if ($l -match '<li>' -and $l -match '100% Job Guarantee:') { $l = '                                    <li>&bull; <strong>100% Job Guarantee:</strong> Career placement support</li>' }
    if ($l -match '<li>' -and $l -match 'Upfront Donation:') { $l = '                                    <li>&bull; <strong>&#8377;0 Upfront Donation:</strong> Direct transparent fees</li>' }
    if ($l -match '<li>' -and $l -match '0% Interest Zero-Cost EMI:') { $l = '                                    <li>&bull; <strong>0% Interest Zero-Cost EMI:</strong> Monthly installment plans</li>' }
    if ($l -match '<li>' -and $l -match 'PM Vidya Lakshmi Portal:') { $l = '                                    <li>&bull; <strong>PM Vidya Lakshmi Portal:</strong> 100% Paperless approvals</li>' }
    if ($l -match '<li>' -and $l -match 'Anti-Scam Protection:') { $l = '                                    <li>&bull; <strong>Anti-Scam Protection:</strong> Verified institutions only</li>' }

    if ($l -match 'How does BVerified guarantee the lowest tuition fees') {
        $l = '            "name": "How does BVerified guarantee the lowest tuition fees with &#8377;0 donation?",'
    }
    
    if ($l -match 'BVerified serves students across all Indian states') {
        $l = '              "text": "Yes. BVerified serves students across all Indian states and union territories &mdash; including Kerala, Karnataka, Tamil Nadu, Andhra Pradesh, Telangana, Maharashtra, Delhi NCR, West Bengal, Bihar, and North East states."'
    }

    if ($l -match 'Priority \(lower = shown first on home;') {
        $l = '                            <label>Priority (lower = shown first on home; 1-9 for top 9)</label>'
    }

    if ($l -match 'within 2' -and $l -match 'business days') {
        $l = '                been received. The college team will contact you within 2-3 business days.</p>'
    }

    if ($l -match 'Submit Application') {
        $l = '                    Submit Application &rarr;'
    }

    if ($l -match 'BVerified' -and $l -match 'Be Verified. All About Your Career') {
        $l = '                BVerified &mdash; Be Verified. All About Your Career.'
    }

    if ($l -match 'Study without stress') {
        $l = '                           <p style="font-size: clamp(0.58rem, 2.8vw, 0.72rem); font-weight: 850; color: #3E8B1A; margin: 0; font-family: ''Plus Jakarta Sans'', sans-serif; text-align:center; line-height:1.1;">Study without stress &mdash; your future is secure.</p>'
    }

    if ($l -match 'editIcon') {
        $l = '                            <input type="text" id="editIcon" placeholder="fa-solid fa-graduation-cap" />'
    }

    if ($l -match 'font-size:3rem;margin-bottom:1rem;') {
        $l = '            <div style="font-size:3rem;margin-bottom:1rem;color:#3E8B1A;">&#10004;</div>'
    }

    $cleanLines += $l
}

[System.IO.File]::WriteAllLines($path, $cleanLines, [System.Text.Encoding]::UTF8)
Write-Host "Purged all remaining corrupted characters!"
