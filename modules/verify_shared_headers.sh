#!/bin/bash
# Script to verify all tools have shared headers properly set

cd "$(dirname "$0")"

echo "Checking all tools for shared header components..."
echo ""

tools_with_shared=0
tools_without_shared=0
tools_with_old_header=0

for tool_dir in */; do
    tool_name=$(basename "$tool_dir")
    index_file="${tool_dir}index.html"
    
    if [ ! -f "$index_file" ]; then
        continue
    fi
    
    has_shared_navbar=$(grep -q "shared-navbar" "$index_file" && echo "yes" || echo "no")
    has_shared_hero=$(grep -q "shared-hero" "$index_file" && echo "yes" || echo "no")
    has_shared_breadcrumb=$(grep -q "shared-breadcrumb" "$index_file" && echo "yes" || echo "no")
    has_shared_styles=$(grep -q "shared-styles.css" "$index_file" && echo "yes" || echo "no")
    has_shared_components_js=$(grep -q "shared-components.js" "$index_file" && echo "yes" || echo "no")
    has_old_navbar=$(grep -q '<nav class="navbar navbar-expand-lg navbar-light bg-white">' "$index_file" && echo "yes" || echo "no")
    has_data_page_title=$(grep -q 'data-page-title' "$index_file" && echo "yes" || echo "no")
    
    if [ "$has_shared_navbar" = "yes" ] && [ "$has_shared_hero" = "yes" ] && [ "$has_shared_breadcrumb" = "yes" ]; then
        if [ "$has_old_navbar" = "yes" ]; then
            echo "⚠️  $tool_name: Has shared components BUT also has old header (DUPLICATE!)"
            tools_with_old_header=$((tools_with_old_header + 1))
        elif [ "$has_shared_styles" = "yes" ] && [ "$has_shared_components_js" = "yes" ] && [ "$has_data_page_title" = "yes" ]; then
            echo "✓ $tool_name: Properly configured"
            tools_with_shared=$((tools_with_shared + 1))
        else
            echo "⚠️  $tool_name: Has shared components but missing:"
            [ "$has_shared_styles" = "no" ] && echo "    - shared-styles.css"
            [ "$has_shared_components_js" = "no" ] && echo "    - shared-components.js"
            [ "$has_data_page_title" = "no" ] && echo "    - data-page-title attribute"
        fi
    else
        echo "✗ $tool_name: Missing shared components"
        tools_without_shared=$((tools_without_shared + 1))
    fi
done

echo ""
echo "=========================================="
echo "Summary:"
echo "  ✓ Properly configured: $tools_with_shared"
echo "  ⚠️  Has duplicates: $tools_with_old_header"
echo "  ✗ Missing shared: $tools_without_shared"
echo "=========================================="


