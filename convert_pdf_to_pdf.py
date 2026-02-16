import fitz  # PyMuPDF
import sys

def compress_pdf(input_path, output_path):
    """
    Compresses a PDF file by reducing image quality and other parameters.
    
    Args:
        input_path (str): Path to the input PDF file.
        output_path (str): Path to save the compressed PDF file.
    """
    # Open the original PDF
    doc = fitz.open(input_path)
    
    # Create a new PDF for the compressed output
    new_doc = fitz.open()
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        new_page = new_doc.new_page(width=page.rect.width, height=page.rect.height)
        
        # Draw the content of the page into the new page
        new_page.show_pdf_page(page.rect, doc, page_num)
    
    # Save the new PDF with compression
    new_doc.save(output_path, garbage=4, deflate=True)
    
    print(f"Compressed PDF saved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compress_pdf.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    compress_pdf(input_path, output_path)
