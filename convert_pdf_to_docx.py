from pdf2docx import Converter
import sys

def convert_pdf_to_docx(pdf_file, docx_file):
    cv = Converter(pdf_file)
    cv.convert(docx_file)
    cv.close()

if __name__ == "__main__":
    pdf_file = sys.argv[1]
    docx_file = sys.argv[2]
    convert_pdf_to_docx(pdf_file, docx_file)
    print(f"Conversion complete. DOCX saved to {docx_file}")
