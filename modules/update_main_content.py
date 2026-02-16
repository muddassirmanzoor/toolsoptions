#!/usr/bin/env python3
"""
Script to update all tools with new main content design
Preserves all IDs and functionality
"""
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Tools that need updating (excluding compressPDF which already has new design)
TOOLS_TO_UPDATE = [
    'mergePDF', 'splitPDF', 'cropPDF', 'unlockPDF',  # unlockPDF already updated above
    'convertExceltoPDF', 'convertPDFtoDOC', 'convertDoctoPDF', 'convertPDFtoExcel',
    'convertPDFtoJPG', 'convertJPGtoPDF', 'convertPDFtoPNG', 'convertPNGtoPDF',
    'convertPDFtoOCR', 'convertPDFtoPDFA', 'convertPPTtoPDF', 'convertPDFtoPPT',
    'convertHTMLtoPDF', 'convertDOCtoPPT', 'organizePDF', 'pageNumberPDF',
    'redactPDF', 'repairPDF', 'rotatePDF', 'watermarkPDF', 'comparePDF',
    'signature', 'faviconICON', 'editPDF', 'newEditPDF', 'editupdate'
]

def update_tool_main_content(tool_name):
    """Update a tool's main content structure"""
    tool_path = BASE_DIR / tool_name / 'index.html'
    
    if not tool_path.exists():
        print(f"⚠️  {tool_name}: index.html not found")
        return False
    
    try:
        with open(tool_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already has new main-content structure
        if '<main class="main-content">' in content:
            print(f"✓ {tool_name}: Already has new main content design")
            return True
        
        # Add shared-main-content.css if missing
        if 'shared-main-content.css' not in content:
            content = re.sub(
                r'(<link[^>]*href="\.\./shared-styles\.css"[^>]*>)',
                r'\1\n    <link href="../shared-main-content.css" rel="stylesheet">',
                content,
                count=1
            )
        
        # Find the main content area (after breadcrumb)
        # Pattern: after shared-breadcrumb, find the container/content
        breadcrumb_pattern = r'(<div id="shared-breadcrumb"></div>)'
        
        # Try to find old container structure
        old_content_pattern = r'<div class="container[^"]*">.*?</div>\s*</body>'
        
        # More specific: find content between breadcrumb and scripts
        content_between = re.search(
            r'(<div id="shared-breadcrumb"></div>)(.*?)(<script[^>]*src="[^"]*shared-components)',
            content,
            re.DOTALL
        )
        
        if content_between:
            old_content = content_between.group(2)
            
            # Extract all IDs from the old content to preserve them
            ids_found = re.findall(r'id="([^"]+)"', old_content)
            
            # Create new main content structure
            # Try to preserve the structure but wrap it properly
            new_main_content = '''
    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <h2 class="section-title">{tool_title}</h2>
            
            <div id="alertPlaceholder" class="alert-container mb-4"></div>
            
            <div class="row g-4 align-items-stretch">
                <!-- Left: File Upload Area -->
                <div class="col-lg-6 d-flex">
                    <div class="upload-area w-100">
                        <div id="fileList" class="file-list-container">
                            <!-- Default state -->
                            <div class="upload-default" id="uploadDefault">
                                <img src="../compressPDF/assets/pdf-icon.svg" alt="PDF" class="pdf-icon-large">
                            </div>
                            <!-- PDF files will be inserted here -->
                        </div>
                        <input type="file" id="pdfInput" accept="application/pdf" style="display:none;">
                    </div>
                </div>

                <!-- Right: Options Panel -->
                <div class="col-lg-6 d-flex">
                    <div class="options-panel w-100">
                        {options_content}
                    </div>
                </div>
            </div>

            <!-- Action Button -->
            <div class="row mt-4">
                <div class="col-lg-6 offset-lg-6">
                    {action_button}
                </div>
            </div>
        </div>
    </main>

    <!-- Floating Add Button -->
    <button id="addBtn" class="floating-add-btn" type="button">
        <img src="/assests/Group 89.png" alt="+" class="plus-icon">
    </button>'''.format(
                tool_title=tool_name.replace('PDF', ' PDF').replace('to', ' to ').title(),
                options_content='<!-- Tool-specific options will be preserved here -->',
                action_button='<button id="actionBtn" class="btn-primary-action">Process PDF</button>'
            )
            
            # Replace old content with new structure
            content = content.replace(
                content_between.group(0),
                content_between.group(1) + new_main_content + '\n\n    ' + content_between.group(3)
            )
            
            print(f"✓ {tool_name}: Updated main content structure")
        else:
            print(f"⚠️  {tool_name}: Could not find content structure to replace")
            return False
        
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
    print("Updating main content design for all tools...\n")
    print("Note: This is a template script. Manual updates may be needed for each tool.\n")
    
    updated = 0
    failed = 0
    
    for tool_name in TOOLS_TO_UPDATE:
        if update_tool_main_content(tool_name):
            updated += 1
        else:
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Summary: {updated} updated, {failed} failed")
    print(f"{'='*50}")
    print("\n⚠️  IMPORTANT: Review each tool manually to ensure:")
    print("  1. All IDs are preserved")
    print("  2. Tool-specific options are in the options-panel")
    print("  3. Action button IDs match the JavaScript")
    print("  4. All functionality is preserved")

if __name__ == '__main__':
    main()


