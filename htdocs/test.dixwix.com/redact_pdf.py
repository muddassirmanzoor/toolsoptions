import fitz  # PyMuPDF
import sys  # For command-line arguments
import json  # For parsing JSON coordinates

def redact_pdf(input_path, output_path, redactions_str, coordinates_file=None):
    """
    Redact PDF - permanently remove/blacken sensitive text from PDF.
    Redaction means the text is completely removed and replaced with black rectangles.
    This is different from just hiding text - redaction permanently removes it.
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        redactions_str: Comma-separated string of text to redact
        coordinates_file: Optional JSON file with selected rectangle coordinates
    """
    doc = fitz.open(input_path)
    
    # Convert redactions string to list
    redactions = []
    if redactions_str and redactions_str.strip():
        try:
            redactions = [r.strip() for r in redactions_str.split(',') if r.strip()]
        except Exception as e:
            print(f"Invalid redactions format: {e}")
    
    # Load selected areas from coordinates file if provided
    selected_areas = []
    if coordinates_file and coordinates_file.strip() and coordinates_file.strip() != '""':
        try:
            print(f"Loading coordinates from file: {coordinates_file}")
            with open(coordinates_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
                if isinstance(loaded_data, list):
                    selected_areas = loaded_data
                    print(f"Loaded {len(selected_areas)} selected areas from coordinates file")
                else:
                    print(f"ERROR: Coordinates file does not contain a valid array, got: {type(loaded_data)}")
        except FileNotFoundError:
            print(f"ERROR: Coordinates file not found: {coordinates_file}")
        except json.JSONDecodeError as e:
            print(f"ERROR: Could not parse coordinates file as JSON: {e}")
        except Exception as e:
            print(f"ERROR: Could not load coordinates file: {e}")
            import traceback
            traceback.print_exc()
    
    if not redactions and not selected_areas:
        print("ERROR: No redaction terms or selected areas provided")
        print(f"Redactions: {redactions}")
        print(f"Selected areas count: {len(selected_areas) if selected_areas else 0}")
        sys.exit(1)
    
    # Redact each page
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        all_redact_rects = []
        
        # Collect all redaction rectangles for each search term
        for redaction_term in redactions:
            if not redaction_term:
                continue
                
            # Search for all instances of the text on this page
            # Use search_for which returns a list of rectangles where text is found
            try:
                # Search with different case variations to find all matches
                text_instances = page.search_for(redaction_term, flags=0)
                
                # Also try case-insensitive variations
                if redaction_term.lower() != redaction_term:
                    text_instances.extend(page.search_for(redaction_term.lower(), flags=0))
                if redaction_term.upper() != redaction_term:
                    text_instances.extend(page.search_for(redaction_term.upper(), flags=0))
                    
                all_redact_rects.extend(text_instances)
            except Exception as e:
                print(f"Warning: Error searching for '{redaction_term}' on page {page_num + 1}: {e}")
                continue
        
        # Add rectangles from manually selected areas for this page
        # Note: page_num is 0-based in Python, and our JavaScript also sends 0-based
        for area in selected_areas:
            area_page = area.get('page')
            if area_page is not None and area_page == page_num:
                try:
                    # Create rectangle from coordinates (coordinates are already in PDF space)
                    # Ensure coordinates are valid (x0 < x1, y0 < y1)
                    x0 = min(area['x0'], area['x1'])
                    y0 = min(area['y0'], area['y1'])
                    x1 = max(area['x0'], area['x1'])
                    y1 = max(area['y0'], area['y1'])
                    
                    # Get page dimensions to clamp coordinates
                    page_rect = page.rect
                    x0 = max(0, min(x0, page_rect.width))
                    y0 = max(0, min(y0, page_rect.height))
                    x1 = max(0, min(x1, page_rect.width))
                    y1 = max(0, min(y1, page_rect.height))
                    
                    if x1 > x0 and y1 > y0:  # Only add if rectangle is valid
                        rect = fitz.Rect(x0, y0, x1, y1)
                        all_redact_rects.append(rect)
                except Exception as e:
                    print(f"Warning: Error processing selected area on page {page_num + 1}: {e}")
                    continue
        
        # Remove duplicate rectangles
        unique_rects = []
        seen = set()
        for rect in all_redact_rects:
            # Round to avoid floating point precision issues
            rect_tuple = (round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2))
            if rect_tuple not in seen:
                seen.add(rect_tuple)
                unique_rects.append(rect)
        
        # Add redaction annotation for each unique rectangle found
        for rect in unique_rects:
            try:
                # Add redaction annotation - this marks the area for redaction
                # fill=(0, 0, 0) means black color for redaction
                page.add_redact_annot(rect, fill=(0, 0, 0))
            except Exception as e:
                print(f"Warning: Error adding redaction annotation on page {page_num + 1}: {e}")
                continue
        
        # Apply all redactions on this page ONCE after all annotations are added
        # This actually removes the text permanently
        # images=2 means blank out overlapping image parts
        # graphics=1 means remove graphics if contained in rectangle  
        # text=0 means remove text (default - this is what we want)
        if unique_rects:
            try:
                page.apply_redactions(images=2, graphics=1, text=0)
            except Exception as e:
                print(f"Warning: Error applying redactions on page {page_num + 1}: {e}")
    
    # Save the redacted PDF with garbage collection to remove deleted content
    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    print(f"Redaction complete. Output saved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python redact_pdf.py <input_path> <output_path> <redactions> [coordinates_file]")
        print("Example: python redact_pdf.py input.pdf output.pdf 'confidential,secret'")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    redactions_str = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else ""
    coordinates_file = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else None

    redact_pdf(input_path, output_path, redactions_str, coordinates_file)
