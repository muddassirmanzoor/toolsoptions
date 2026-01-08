from pdf2pptx import convert_pdf2pptx
import sys

def convert_pdf_to_pptx(pdf_file, pptx_file):
    try:
        # Define the parameters required by convert_pdf2pptx
        output_file = pptx_file
        resolution = 100  # Set your desired resolution (DPI)
        start_page = 0  # Start page number (0-indexed)
        page_count = None  # Set to None to process all pages

        # Initialize the Converter
        cv = convert_pdf2pptx(pdf_file, output_file, resolution, start_page, page_count)
        
        # Perform the conversion
        cv.convert()
        
        # Close the converter
        cv.close()
        
        print(f"Conversion complete. PPTX saved to {pptx_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_pdf_to_pptx.py <input_pdf> <output_pptx>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    pptx_file = sys.argv[2]
    
    convert_pdf_to_pptx(pdf_file, pptx_file)
