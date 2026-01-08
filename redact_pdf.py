import fitz  # PyMuPDF
import sys  # For command-line arguments
import json  # For parsing JSON

def redact_pdf(input_path, output_path, redactions_str):
    doc = fitz.open(input_path)
    
    # Convert redactions string to list
    try:
        redactions = [r.strip() for r in redactions_str.split(',')]  # Split comma-separated text and trim whitespace
    except Exception as e:
        print(f"Invalid redactions format: {e}")
        sys.exit(1)

    # Redact each page
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # Extract text and bounding boxes
        text = page.get_text("dict")
        
        # Process redactions
        apply_redactions(page, text, redactions)
    
    # Save the redacted PDF
    doc.save(output_path)
    doc.close()

def apply_redactions(page, text, redactions):
    # Extract bounding boxes and text from the page
    blocks = text['blocks']
    
    # Dictionary to map text bounding boxes and their content
    bbox_text = []
    for block in blocks:
        if 'lines' in block:
            for line in block['lines']:
                for span in line['spans']:
                    bbox = tuple(span['bbox'])
                    span_text = span['text']
                    if span_text:  # Only consider non-empty text
                        bbox_text.append((bbox, span_text))

    # Apply redactions
    for bbox, content in bbox_text:
        for redaction in redactions:
            if redaction in content:
                # Find all occurrences of the redaction phrase
                occurrences = find_occurrences(content, redaction)
                
                # Create redaction rectangles for each occurrence
                for start_idx, end_idx in occurrences:
                    rects = get_text_bboxes(content, bbox, start_idx, end_idx)
                    for rect in rects:
                        page.add_redact_annot(rect, text='', fill=(0, 0, 0))  # Black fill for redaction
                page.apply_redactions()

def find_occurrences(text, redaction_phrase):
    """Find all occurrences of a phrase in the text."""
    occurrences = []
    start = 0
    while True:
        start_idx = text.find(redaction_phrase, start)
        if start_idx == -1:
            break
        end_idx = start_idx + len(redaction_phrase)
        occurrences.append((start_idx, end_idx))
        start = end_idx
    return occurrences

def get_text_bboxes(text, bbox, start_idx, end_idx):
    """Get bounding boxes for a specific range in the text."""
    word_bboxes = []
    x0, y0, x1, y1 = bbox
    bbox_width = x1 - x0
    bbox_height = y1 - y0
    total_length = len(text)
    
    # Assume equal spacing
    char_width = bbox_width / total_length
    
    # Calculate bounding box for each character in the range
    for i in range(start_idx, end_idx):
        char_bbox = (
            x0 + (char_width * i),
            y0,
            x0 + (char_width * (i + 1)),
            y1
        )
        word_bboxes.append(char_bbox)

    return word_bboxes

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python redact_pdf.py <input_path> <output_path> <redactions>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    redactions_str = sys.argv[3]  # Get redactions from command line argument

    redact_pdf(input_path, output_path, redactions_str)
