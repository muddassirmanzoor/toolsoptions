#!/usr/bin/env python3
"""
Script to update all PDF tools with shared header/navbar/breadcrumb components
"""
import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Tool names and their page titles
TOOLS = {
    'cropPDF': 'Crop PDF',
    'convertExceltoPDF': 'Excel to PDF',
    'convertPDFtoDOC': 'PDF to Word',
    'convertDoctoPDF': 'Word to PDF',
    'convertPDFtoExcel': 'PDF to Excel',
    'convertPDFtoJPG': 'PDF to JPG',
    'convertJPGtoPDF': 'JPG to PDF',
    'convertPDFtoPNG': 'PDF to PNG',
    'convertPNGtoPDF': 'PNG to PDF',
    'convertPDFtoOCR': 'PDF to OCR',
    'convertPDFtoPDFA': 'PDF to PDF/A',
    'convertPPTtoPDF': 'PPT to PDF',
    'convertPDFtoPPT': 'PDF to PPT',
    'convertHTMLtoPDF': 'HTML to PDF',
    'convertDOCtoPPT': 'DOC to PPT',
    'organizePDF': 'Organize PDF',
    'pageNumberPDF': 'Page Numbers PDF',
    'redactPDF': 'Redact PDF',
    'repairPDF': 'Repair PDF',
    'rotatePDF': 'Rotate PDF',
    'watermarkPDF': 'Watermark PDF',
    'comparePDF': 'Compare PDF',
    'signature': 'Signature',
    'faviconICON': 'Favicon & Icons',
    'editPDF': 'Edit PDF',
    'newEditPDF': 'Edit PDF',
    'editupdate': 'Edit PDF',
}

def update_tool(tool_name, page_title):
    """Update a single tool's index.html file"""
    tool_path = BASE_DIR / tool_name / 'index.html'
    
    if not tool_path.exists():
        print(f"⚠️  {tool_name}: index.html not found")
        return False
    
    try:
        with open(tool_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already updated
        if 'shared-components.js' in content and 'shared-navbar' in content:
            print(f"✓ {tool_name}: Already updated")
            return True
        
        # Pattern to match old header structure
        # Match navbar, custom-header, and breadcrumb sections
        old_header_pattern = r'(?s)(<!--\s*Navbar.*?<!--\s*Navbar\s*End\s*-->.*?)(<header\s+class="custom-header">.*?</header>.*?<nav\s+class="text-center".*?</nav>)'
        
        # Try to find and replace old header
        if re.search(old_header_pattern, content):
            # Replace old header with new shared components
            new_header = f'''    <!-- Custom CSS -->
    <link href="styles.css" rel="stylesheet">
    <link href="../shared-styles.css" rel="stylesheet">
</head>
<body data-page-title="{page_title}">
    <!-- Shared Navbar -->
    <div id="shared-navbar"></div>

    <!-- Shared Hero Section -->
    <div id="shared-hero"></div>

    <!-- Shared Breadcrumb -->
    <div id="shared-breadcrumb"></div>'''
            
            # Find the closing </head> tag and replace everything from navbar to breadcrumb
            # More flexible pattern
            pattern = r'(<link\s+href="styles\.css".*?</head>)(.*?)(<header\s+class="custom-header">.*?</header>.*?<nav\s+class="text-center".*?</nav>)'
            
            def replace_func(match):
                head_end = match.group(1)
                between = match.group(2)
                old_header = match.group(3)
                
                # Check if shared-styles is already in head
                if 'shared-styles.css' not in head_end:
                    head_end = head_end.replace('</head>', '    <link href="../shared-styles.css" rel="stylesheet">\n</head>')
                
                # Replace body tag to add data-page-title
                if 'data-page-title' not in between:
                    between = re.sub(r'<body([^>]*)>', f'<body\\1 data-page-title="{page_title}">', between)
                
                return head_end + between + new_header.split('</head>')[1]
            
            content = re.sub(pattern, replace_func, content, flags=re.DOTALL)
        
        # Add shared-components.js script if not present
        if 'shared-components.js' not in content:
            # Find the last script tag before </body>
            script_pattern = r'(<script[^>]*>.*?</script>)(\s*</body>)'
            def add_shared_script(match):
                scripts = match.group(1)
                body_end = match.group(2)
                if 'shared-components.js' not in scripts:
                    # Add before config.js or app.js, or at the end
                    if '../config.js' in scripts:
                        scripts = scripts.replace(
                            '<script src="../config.js"></script>',
                            '<script src="../shared-components.js"></script>\n    <script src="../config.js"></script>'
                        )
                    elif 'app.js' in scripts:
                        scripts = scripts.replace(
                            '<script src="app.js"></script>',
                            '<script src="../shared-components.js"></script>\n    <script src="app.js"></script>'
                        )
                    else:
                        scripts += '\n    <script src="../shared-components.js"></script>'
                return scripts + body_end
            
            content = re.sub(script_pattern, add_shared_script, content, flags=re.DOTALL)
        
        # Write updated content
        with open(tool_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ {tool_name}: Updated successfully")
        return True
        
    except Exception as e:
        print(f"✗ {tool_name}: Error - {str(e)}")
        return False

def main():
    """Main function to update all tools"""
    print("Starting tool updates...\n")
    
    updated = 0
    skipped = 0
    failed = 0
    
    for tool_name, page_title in TOOLS.items():
        if update_tool(tool_name, page_title):
            updated += 1
        else:
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Summary: {updated} updated, {failed} failed")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()


