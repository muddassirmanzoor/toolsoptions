#!/bin/bash
# Script to fix all tools by replacing old header with shared components

cd "$(dirname "$0")"

# List of tools that need fixing
tools=(
    "rotatePDF:Rotate PDF"
    "convertPDFtoDOC:PDF to Word"
    "convertPDFtoPDFA:PDF to PDF/A"
    "repairPDF:Repair PDF"
    "organizePDF:Organize PDF"
    "comparePDF:Compare PDF"
    "cropPDF:Crop PDF"
    "convertExceltoPDF:Excel to PDF"
    "convertDoctoPDF:Word to PDF"
    "convertPDFtoExcel:PDF to Excel"
    "convertPDFtoJPG:PDF to JPG"
    "convertJPGtoPDF:JPG to PDF"
    "convertPDFtoPNG:PDF to PNG"
    "convertPNGtoPDF:PNG to PDF"
    "convertPDFtoOCR:PDF to OCR"
    "convertPPTtoPDF:PPT to PDF"
    "convertPDFtoPPT:PDF to PPT"
    "convertHTMLtoPDF:HTML to PDF"
    "convertDOCtoPPT:DOC to PPT"
    "pageNumberPDF:Page Numbers PDF"
    "redactPDF:Redact PDF"
    "watermarkPDF:Watermark PDF"
    "signature:Signature"
    "faviconICON:Favicon & Icons"
)

for tool_info in "${tools[@]}"; do
    IFS=':' read -r tool_name page_title <<< "$tool_info"
    tool_path="${tool_name}/index.html"
    
    if [ -f "$tool_path" ]; then
        echo "Processing $tool_name..."
        
        # Check if already has shared components
        if grep -q "shared-navbar" "$tool_path"; then
            echo "  ✓ Already updated"
            continue
        fi
        
        # Add shared-styles.css if not present
        if ! grep -q "shared-styles.css" "$tool_path"; then
            sed -i '/<link href="styles.css"/a\    <link href="../shared-styles.css" rel="stylesheet">' "$tool_path"
        fi
        
        # Add data-page-title to body if not present
        if ! grep -q "data-page-title" "$tool_path"; then
            sed -i "s/<body>/<body data-page-title=\"${page_title}\">/" "$tool_path"
        fi
        
        # Replace old header structure (this is complex, so we'll do it in Python)
        echo "  → Needs manual header replacement"
    else
        echo "  ✗ File not found: $tool_path"
    fi
done

echo "Done!"


