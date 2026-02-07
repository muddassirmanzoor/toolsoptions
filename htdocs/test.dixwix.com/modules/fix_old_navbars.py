#!/usr/bin/env python3
"""
Script to remove old hardcoded navbars from all tools
"""

import os
import re
from pathlib import Path

# Tools that need fixing (found by grep)
tools_to_fix = [
    'convertPDFtoPDFA',
    'convertPDFtoJPG',
    'convertPNGtoPDF',
    'convertJPGtoPDF',
    'convertPPTtoPDF',
    'pageNumberPDF',
    'comparePDF',
    'convertPDFtoPPT',
    'watermarkPDF',
    'convertPDFtoPNG',
    'convertPDFtoOCR'
]

# Page titles mapping
page_titles = {
    'convertPDFtoPDFA': 'PDF to PDF/A',
    'convertPDFtoJPG': 'PDF to JPG',
    'convertPNGtoPDF': 'PNG to PDF',
    'convertJPGtoPDF': 'JPG to PDF',
    'convertPPTtoPDF': 'PPT to PDF',
    'pageNumberPDF': 'Page Number PDF',
    'comparePDF': 'Compare PDF',
    'convertPDFtoPPT': 'PDF to PPT',
    'watermarkPDF': 'Watermark PDF',
    'convertPDFtoPNG': 'PDF to PNG',
    'convertPDFtoOCR': 'PDF to OCR'
}

def fix_tool_navbar(tool_dir, page_title):
    """Remove old navbar and ensure proper shared header setup"""
    index_file = Path(tool_dir) / 'index.html'
    
    if not index_file.exists():
        print(f"⚠️  {tool_dir}: index.html not found")
        return False
    
    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if old navbar exists
        has_old_navbar = 'navbar navbar-expand-lg navbar-light bg-white shadow-sm' in content
        has_ilovepdf_logo = 'ilovepdf 1.png' in content
        
        if not has_old_navbar and not has_ilovepdf_logo:
            print(f"✓ {tool_dir}: No old navbar found")
            return True
        
        # Remove old navbar (the entire nav element)
        old_navbar_pattern = r'<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">.*?</nav>'
        content = re.sub(old_navbar_pattern, '', content, flags=re.DOTALL)
        
        # Remove any "Navbar Start/End" comments
        content = re.sub(r'<!-- Navbar Start -->.*?<!-- Navbar End -->', '', content, flags=re.DOTALL)
        content = re.sub(r'<!-- Navbar Start -->', '', content)
        content = re.sub(r'<!-- Navbar End -->', '', content)
        
        # Update Bootstrap version if needed
        content = re.sub(
            r'bootstrap@5\.3\.0-alpha1',
            'bootstrap@5.3.0',
            content
        )
        
        # Add shared-styles.css if missing
        if 'shared-styles.css' not in content:
            # Find the last stylesheet link before </head>
            if re.search(r'<link[^>]*styles\.css[^>]*>', content):
                content = re.sub(
                    r'(<link[^>]*styles\.css[^>]*>)',
                    r'\1\n    <link href="../shared-styles.css" rel="stylesheet">',
                    content,
                    count=1
                )
            else:
                content = re.sub(
                    r'(</head>)',
                    r'    <link href="../shared-styles.css" rel="stylesheet">\n\1',
                    content
                )
        
        # Update fonts to match compressPDF
        if 'Inter:wght@400;500;700' in content or 'Red+Hat+Display' in content:
            content = re.sub(
                r'<link[^>]*fonts\.googleapis\.com[^>]*Inter[^>]*>',
                '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Montserrat:wght@700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">',
                content
            )
            content = re.sub(
                r'<link[^>]*fonts\.googleapis\.com[^>]*Red\+Hat[^>]*>',
                '',
                content
            )
        
        # Add Font Awesome if missing
        if 'font-awesome' not in content.lower():
            # Add after Google Fonts
            if 'fonts.googleapis.com' in content:
                content = re.sub(
                    r'(<link[^>]*fonts\.googleapis\.com[^>]*>)',
                    r'\1\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
                    content,
                    count=1
                )
            else:
                content = re.sub(
                    r'(</head>)',
                    r'    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n\1',
                    content
                )
        
        # Update body tag to add data-page-title if missing
        if 'data-page-title' not in content or not re.search(r'<body[^>]*data-page-title', content):
            # Find body tag and update it
            body_match = re.search(r'<body([^>]*)>', content)
            if body_match:
                body_attrs = body_match.group(1)
                if 'data-page-title' not in body_attrs:
                    content = re.sub(
                        r'<body([^>]*)>',
                        f'<body data-page-title="{page_title}"\\1>',
                        content,
                        count=1
                    )
        
        # Ensure shared components are at the start of body (after body tag)
        if 'shared-navbar' in content:
            # Check if shared components are right after body tag
            body_pattern = r'(<body[^>]*>)\s*(?:<!--.*?-->)?\s*(?:<nav[^>]*>.*?</nav>)?\s*(?:<!--.*?-->)?\s*(<div id="shared-navbar"></div>)'
            if not re.search(body_pattern, content, re.DOTALL):
                # Move shared components to right after body tag
                shared_components = '''    <!-- Shared Navbar -->
    <div id="shared-navbar"></div>

    <!-- Shared Hero Section -->
    <div id="shared-hero"></div>

    <!-- Shared Breadcrumb -->
    <div id="shared-breadcrumb"></div>'''
                
                # Remove existing shared components
                content = re.sub(
                    r'<!-- Shared Navbar -->.*?<div id="shared-breadcrumb"></div>',
                    '',
                    content,
                    flags=re.DOTALL
                )
                
                # Add them right after body tag
                content = re.sub(
                    r'(<body[^>]*>)',
                    r'\1\n' + shared_components + '\n',
                    content,
                    count=1
                )
        else:
            # Add shared components if missing
            shared_components = '''    <!-- Shared Navbar -->
    <div id="shared-navbar"></div>

    <!-- Shared Hero Section -->
    <div id="shared-hero"></div>

    <!-- Shared Breadcrumb -->
    <div id="shared-breadcrumb"></div>'''
            
            content = re.sub(
                r'(<body[^>]*>)',
                r'\1\n' + shared_components + '\n',
                content,
                count=1
            )
        
        # Add shared-components.js if missing
        if 'shared-components.js' not in content:
            # Add before </body>
            content = re.sub(
                r'(</body>)',
                r'    <script src="../shared-components.js"></script>\n\1',
                content
            )
        
        # Update title
        if 'PDF Tool Section' in content:
            content = re.sub(
                r'<title>PDF Tool Section</title>',
                f'<title>{page_title} - I Love PDF</title>',
                content
            )
        
        # Write updated content
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ {tool_dir}: Fixed successfully")
        return True
        
    except Exception as e:
        print(f"✗ {tool_dir}: Error - {str(e)}")
        return False

def main():
    base_dir = Path(__file__).parent
    
    print("Fixing old navbars in tools...\n")
    
    updated = 0
    failed = 0
    
    for tool in tools_to_fix:
        tool_dir = base_dir / tool
        page_title = page_titles.get(tool, tool)
        
        if tool_dir.exists():
            if fix_tool_navbar(tool_dir, page_title):
                updated += 1
            else:
                failed += 1
        else:
            print(f"⚠️  {tool}: Directory not found")
            failed += 1
    
    print(f"\n==========================================")
    print(f"Summary:")
    print(f"  ✓ Fixed: {updated}")
    print(f"  ✗ Failed: {failed}")
    print(f"==========================================")

if __name__ == '__main__':
    main()

