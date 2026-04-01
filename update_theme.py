import re

def replace_colors(content):
    # Deep Pinks/Reds to Electric Violet
    deep_pinks = [
        r'#e91e8c', r'#E91E8C',
        r'#c7285a', r'#C7285A',
        r'#d93b6e', r'#D93B6E',
        r'#c63b6e', r'#C63B6E',
        r'#b13f64', r'#B13F64',
        r'#ae1346', r'#AE1346',
        r'#9a0e3f', r'#9A0E3F',
        r'#d0187a', r'#D0187A',
        r'#ec4899', r'#EC4899',
        r'#e31671', r'#E31671',
        r'#f472b6', r'#F472B6',
        r'#ff6baf', r'#FF6BAF',
        r'#bc2b60', r'#BC2B60',
        r'#8f1e4a', r'#8F1E4A',
        r'#e91e63', r'#E91E63',
        r'#c75b81', r'#C75B81',
        r'#be2d5a', r'#BE2D5A',
        r'#b95078', r'#B95078',
        r'#a53f62', r'#A53F62',
        r'#d4187f', r'#D4187F',
        r'#c7285a', r'#C7285A',
        r'#FF6B9D', r'#ff6b9d'
    ]
    
    # Light Pinks to Pale Violet
    light_pinks = [
        r'#f3d2df', r'#F3D2DF',
        r'#fff2f7', r'#FFF2F7',
        r'#fffbfd', r'#FFFBFD',
        r'#f0c8d6', r'#F0C8D6',
        r'#e7bacb', r'#E7BACB',
        r'#ffb3c6', r'#FFB3C6',
        r'#fecdd3', r'#FECDD3',
        r'#fffafb', r'#FFFAFB',
        r'#fff5f8', r'#FFF5F8',
        r'#ffe4ef', r'#FFE4EF',
        r'#fff0f4', r'#FFF0F4',
        r'#fff0f8', r'#FFF0F8',
        r'#fdf2f8', r'#FDF2F8'
    ]
    
    # Muted/Dark Pinks to Deep Violet/Indigo
    muted_pinks = [
        r'#822f4e', r'#822F4E',
        r'#8e4462', r'#8E4462',
        r'#8e7381', r'#8E7381',
        r'#6b4d5a', r'#6B4D5A',
        r'#8c5a6e', r'#8C5A6E',
        r'#9b1d4e', r'#9B1D4E',
        r'#b42850', r'#B42850',
        r'#b95078', r'#B95078',
        r'#8e4462', r'#8E4462',
        r'#cdadbb', r'#CDADBB',
        r'#c57f9a', r'#C57F9A'
    ]

    # RGBA Replacements (Pinkish/Reddish to Violet)
    rgba_patterns = {
        r'rgba\(233, 30, 140, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(199, 40, 90, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(244, 114, 182, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(180, 40, 80, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(170, 30, 70, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(192, 35, 80, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(217, 59, 110, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)',
        r'rgba\(255, 240, 248, ([\d\.]+)\)': r'rgba(245, 230, 255, \1)',
        r'rgba\(139, 92, 246, ([\d\.]+)\)': r'rgba(144, 0, 255, \1)' # Current violet to Electric Violet
    }

    new_content = content
    
    for pink in deep_pinks:
        new_content = re.sub(re.escape(pink), '#9000FF', new_content)
        
    for pink in light_pinks:
        new_content = re.sub(re.escape(pink), '#F5E6FF', new_content)
        
    for pink in muted_pinks:
        new_content = re.sub(re.escape(pink), '#4C1D95', new_content)
        
    for pattern, replacement in rgba_patterns.items():
        new_content = re.sub(pattern, replacement, new_content)
        
    return new_content

files_to_update = [
    r'c:\Users\ABHINAND THAYYIL\Downloads\unicircle\style.css',
    r'c:\Users\ABHINAND THAYYIL\Downloads\unicircle\index.html',
    r'c:\Users\ABHINAND THAYYIL\Downloads\unicircle\script.js'
]

for file_path in files_to_update:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated_content = replace_colors(content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"Updated {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")
