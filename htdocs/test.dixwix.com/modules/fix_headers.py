#!/usr/bin/env python3
"""
Better script to replace old header structure with shared components
"""
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent

TOOLS = {
    'rotatePDF': 'Rotate PDF',
    'convertPDFtoDOC': 'PDF to Word',
    'convertPDFtoPDFA': 'PDF to PDF/A',
    'repairPDF': 'Repair PDF',
    'organizePDF': 'Organize PDF',
    'comparePDF': 'Compare PDF',
    'cropPDF': 'Crop PDF',
    'convertExceltoPDF': 'Excel to PDF',
    'convertDoctoPDF': 'Word to PDF',
    'convertPDFtoExcel': 'PDF to Excel',
    'convertPDFtoJPG': 'PDF to JPG',
    'convertJPGtoPDF': 'JPG to PDF',
    'convertPDFtoPNG': 'PDF to PNG',
    'convertPNGtoPDF': 'PNG to PDF',
    'convertPDFtoOCR': 'PDF to OCR',
    'convertPPTtoPDF': 'PPT to PDF',
    'convertPDFtoPPT': 'PDF to PPT',
    'convertHTMLtoPDF': 'HTML to PDF',
    'convertDOCtoPPT': 'DOC to PPT',
    'pageNumberPDF': 'Page Numbers PDF',
    'redactPDF': 'Redact PDF',
    'watermarkPDF': 'Watermark PDF',
    'signature': 'Signature',
    'faviconICON': 'Favicon & Icons',
}

def fix_tool(tool_name, page_title):
    tool_path = BASE_DIR / tool_name / 'index.html'
    
    if not tool_path.exists():
        print(f"⚠️  {tool_name}: Not found")
        return False
    
    try:
        with open(tool_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has shared-navbar div
        if '<div id="shared-navbar"></div>' in content:
            print(f"✓ {tool_name}: Already has shared components")
            return True
        
        # Add shared-styles.css if missing
        if 'shared-styles.css' not in content:
            content = re.sub(
                r'(<link[^>]*href="styles\.css"[^>]*>)',
                r'\1\n    <link href="../shared-styles.css" rel="stylesheet">',
                content,
                count=1
            )
        
        # Add data-page-title to body tag
        if 'data-page-title' not in content:
            content = re.sub(
                r'<body([^>]*)>',
                f'<body\\1 data-page-title="{page_title}">',
                content,
                count=1
            )
        
        # Replace old navbar + header + breadcrumb with shared components
        # Pattern 1: Old navbar (<!-- Navbar Start --> ... <!-- Navbar End -->)
        navbar_pattern = r'<!--\s*Navbar\s*Start\s*-->.*?<!--\s*Navbar\s*End\s*-->'
        
        # Pattern 2: Old header (<header class="custom-header"> ... </header>)
        header_pattern = r'<header\s+class="custom-header">.*?</header>'
        
        # Pattern 3: Old breadcrumb (<nav class="text-center"> ... </nav>)
        breadcrumb_pattern = r'<nav\s+class="text-center"[^>]*>.*?</nav>'
        
        # Combined pattern to match all three
        combined_pattern = rf'({navbar_pattern}\s*)({header_pattern}\s*)({breadcrumb_pattern})'
        
        replacement = '''    <!-- Shared Navbar -->
    <div id="shared-navbar"></div>

    <!-- Shared Hero Section -->
    <div id="shared-hero"></div>

    <!-- Shared Breadcrumb -->
    <div id="shared-breadcrumb"></div>'''
        
        if re.search(combined_pattern, content, re.DOTALL):
            content = re.sub(combined_pattern, replacement, content, flags=re.DOTALL)
            print(f"✓ {tool_name}: Replaced header structure")
        elif re.search(header_pattern, content, re.DOTALL):
            # Try just header + breadcrumb
            header_breadcrumb_pattern = rf'({header_pattern}\s*)({breadcrumb_pattern})'
            content = re.sub(header_breadcrumb_pattern, replacement, content, flags=re.DOTALL)
            print(f"✓ {tool_name}: Replaced header (no old navbar found)")
        else:
            print(f"⚠️  {tool_name}: Old header structure not found")
        
        # Add shared-components.js if missing
        if 'shared-components.js' not in content:
            # Find the last script tag before </body>
            script_pattern = r'(<script[^>]*src="[^"]*"></script>)(\s*</body>)'
            def add_script(match):
                scripts = match.group(1)
                body_end = match.group(2)
                if 'shared-components.js' not in scripts:
                    return f'{scripts}\n    <script src="../shared-components.js"></script>{body_end}'
                return match.group(0)
            
            content = re.sub(script_pattern, add_script, content, flags=re.DOTALL)
            # If that didn't work, try adding before config.js
            if 'shared-components.js' not in content:
                content = re.sub(
                    r'(<script[^>]*src="\.\./config\.js"></script>)',
                    r'    <script src="../shared-components.js"></script>\n\1',
                    content
                )
        
        with open(tool_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ {tool_name}: Updated successfully")
        return True
        
    except Exception as e:
        print(f"✗ {tool_name}: Error - {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("Fixing tool headers...\n")
    
    updated = 0
    failed = 0
    
    for tool_name, page_title in TOOLS.items():
        if fix_tool(tool_name, page_title):
            updated += 1
        else:
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Summary: {updated} updated, {failed} failed")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()


