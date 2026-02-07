import fitz  # PyMuPDF
import sys

def repair_pdf(input_path, output_path):
    try:
        # Open the input PDF
        pdf_document = fitz.open(input_path)
        print(f"Opened PDF file: {input_path}")

        # Create a new PDF file
        pdf_document.save(output_path, garbage=4, deflate=True)
        print(f"Repaired PDF saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python repair_pdf.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    repair_pdf(input_path, output_path)
