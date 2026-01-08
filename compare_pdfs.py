import fitz  # PyMuPDF
import sys  # For command-line arguments

def compare_pdfs(pdf1_path, pdf2_path, output_path):
    doc1 = fitz.open(pdf1_path)
    doc2 = fitz.open(pdf2_path)
    
    # Create a new PDF to store the result
    output_doc = fitz.open()

    for page_num in range(min(len(doc1), len(doc2))):
        page1 = doc1.load_page(page_num)
        page2 = doc2.load_page(page_num)
        
        # Extract text and bounding boxes from each page
        text1 = page1.get_text("dict")
        text2 = page2.get_text("dict")
        
        # Create a new page in the output document
        output_page = output_doc.new_page()
        output_page.show_pdf_page(output_page.rect, doc2, pno=page_num)  # Show second PDF as base

        # Highlight text differences
        highlight_differences(text1, text2, output_page)

    # Save the output PDF with highlighted differences
    output_doc.save(output_path)

def highlight_differences(text1, text2, output_page):
    # Extract bounding boxes and text from both PDFs
    blocks1 = text1['blocks']
    blocks2 = text2['blocks']

    # Create a dictionary to map text bounding boxes and their content for doc1
    bbox_text1 = {}
    for block in blocks1:
        if 'lines' in block:
            for line in block['lines']:
                for span in line['spans']:
                    bbox = tuple(span['bbox'])
                    text = span['text'].strip()
                    if text:  # Only consider non-empty text
                        bbox_text1[bbox] = text

    # Highlight text blocks in doc2 that are not in doc1
    for block in blocks2:
        if 'lines' in block:
            for line in block['lines']:
                for span in line['spans']:
                    bbox = tuple(span['bbox'])
                    text2 = span['text'].strip()
                    if text2:  # Only consider non-empty text
                        # Highlight if text is not found in bbox_text1
                        if not any(text2 == t for b, t in bbox_text1.items() if is_bbox_overlapping(bbox, b)):
                            # Adjust bounding box coordinates for accurate positioning
                            x0, y0, x1, y1 = bbox
                            rect = fitz.Rect(x0, y0+28, x1, y1+28)
                            
                            # Log for debugging without causing encoding issues
                            try:
                                print(f"Highlighting text at bbox: {bbox}")
                                print(f"Text to highlight: {text2}")
                            except UnicodeEncodeError:
                                print(f"Highlighting text at bbox: {bbox}")
                                print(f"Text to highlight: (unable to print due to encoding issues)")

                            # Add the highlight annotation
                            highlight = output_page.add_highlight_annot(rect)
                            highlight.set_colors(stroke=(0.678, 0.847, 0.902), fill=(0.678, 0.847, 0.902))  # Light blue highlight
                            highlight.update()

def is_bbox_overlapping(bbox1, bbox2):
    """Check if two bounding boxes overlap."""
    x0_1, y0_1, x1_1, y1_1 = bbox1
    x0_2, y0_2, x1_2, y1_2 = bbox2
    return not (x1_1 < x0_2 or x0_1 > x1_2 or y1_1 < y0_2 or y0_1 > y1_2)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python compare_pdfs.py <pdf1_path> <pdf2_path> <output_path>")
        sys.exit(1)

    pdf1_path = sys.argv[1]
    pdf2_path = sys.argv[2]
    output_path = sys.argv[3]
    compare_pdfs(pdf1_path, pdf2_path, output_path)
