import sys
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

def perform_ocr(pdf_path, output_path):
    # Convert PDF to images
    pages = convert_from_path(pdf_path)

    # Perform OCR on each page and save to output file
    with open(output_path, 'wb') as output_file:
        for page in pages:
            text = pytesseract.image_to_pdf_or_hocr(page, extension='pdf')
            output_file.write(text)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python ocr.py <input_pdf_path> <output_pdf_path>")
        sys.exit(1)

    input_pdf_path = sys.argv[1]
    output_pdf_path = sys.argv[2]

    perform_ocr(input_pdf_path, output_pdf_path)
