#!/usr/bin/env python3
"""
Script to update remaining tools with shared header components
"""

import os
import re
from pathlib import Path

# Tools that need to be updated
tools_to_update = [
    'convertDOCtoPPT',
    'cropPDF',
    'editPDF',
    'editupdate',
    'faviconICON',
    'newEditPDF',
    'redactPDF',
    'repairPDF',
    'signature'
]

# Page titles mapping
page_titles = {
    'convertDOCtoPPT': 'DOC to PPT',
    'cropPDF': 'Crop PDF',
    'editPDF': 'Edit PDF',
    'editupdate': 'Edit PDF',
    'faviconICON': 'Favicon Icon',
    'newEditPDF': 'Edit PDF',
    'redactPDF': 'Redact PDF',
    'repairPDF': 'Repair PDF',
    'signature': 'Signature'
}

def update_tool_html(tool_dir, page_title):
    """Update a tool's index.html to use shared header components"""
    index_file = Path(tool_dir) / 'index.html'
    
    if not index_file.exists():
        print(f"⚠️  {tool_dir}: index.html not found")
        return False
    
    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already updated
        if 'shared-navbar' in content and 'shared-styles.css' in content:
            print(f"✓ {tool_dir}: Already has shared components")
            return True
        
        # Pattern to find old navbar (various formats)
        old_navbar_pattern = r'<!-- Navbar -->.*?</nav>'
        old_hero_pattern = r'<!-- Hero Section -->.*?</section>'
        old_breadcrumb_pattern = r'<!-- Breadcrumb -->.*?</nav>'
        
        # Remove old components
        content = re.sub(old_navbar_pattern, '', content, flags=re.DOTALL)
        content = re.sub(old_hero_pattern, '', content, flags=re.DOTALL)
        content = re.sub(old_breadcrumb_pattern, '', content, flags=re.DOTALL)
        
        # Find the head section and add shared-styles.css if not present
        if 'shared-styles.css' not in content:
            # Find the last stylesheet link before </head>
            stylesheet_pattern = r'(<link[^>]*styles\.css[^>]*>)'
            if re.search(stylesheet_pattern, content):
                content = re.sub(
                    r'(<link[^>]*styles\.css[^>]*>)',
                    r'\1\n    <link href="../shared-styles.css" rel="stylesheet">',
                    content,
                    count=1
                )
            else:
                # Add before </head>
                content = re.sub(
                    r'(</head>)',
                    r'    <link href="../shared-styles.css" rel="stylesheet">\n\1',
                    content
                )
        
        # Update body tag to add data-page-title
        if 'data-page-title' not in content:
            content = re.sub(
                r'(<body[^>]*>)',
                f'<body data-page-title="{page_title}">',
                content,
                count=1
            )
        
        # Add shared component divs after body tag
        if 'shared-navbar' not in content:
            # Find <body> tag and add components after it
            body_pattern = r'(<body[^>]*>)'
            shared_components = f'''    <!-- Shared Navbar -->
    <div id="shared-navbar"></div>

    <!-- Shared Hero Section -->
    <div id="shared-hero"></div>

    <!-- Shared Breadcrumb -->
    <div id="shared-breadcrumb"></div>

'''
            content = re.sub(
                body_pattern,
                r'\1\n' + shared_components,
                content,
                count=1
            )
        
        # Add shared-components.js script if not present
        if 'shared-components.js' not in content:
            # Find the last script tag before </body>
            script_pattern = r'(<script[^>]*app\.js[^>]*></script>)'
            if re.search(script_pattern, content):
                content = re.sub(
                    r'(<script[^>]*app\.js[^>]*></script>)',
                    r'    <script src="../shared-components.js"></script>\n\1',
                    content,
                    count=1
                )
            else:
                # Add before </body>
                content = re.sub(
                    r'(</body>)',
                    r'    <script src="../shared-components.js"></script>\n\1',
                    content
                )
        
        # Write updated content
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ {tool_dir}: Updated successfully")
        return True
        
    except Exception as e:
        print(f"✗ {tool_dir}: Error - {str(e)}")
        return False

def main():
    base_dir = Path(__file__).parent
    
    print("Updating remaining tools with shared header components...\n")
    
    updated = 0
    failed = 0
    
    for tool in tools_to_update:
        tool_dir = base_dir / tool
        page_title = page_titles.get(tool, tool)
        
        if tool_dir.exists():
            if update_tool_html(tool_dir, page_title):
                updated += 1
            else:
                failed += 1
        else:
            print(f"⚠️  {tool}: Directory not found")
            failed += 1
    
    print(f"\n==========================================")
    print(f"Summary:")
    print(f"  ✓ Updated: {updated}")
    print(f"  ✗ Failed: {failed}")
    print(f"==========================================")

if __name__ == '__main__':
    main()

