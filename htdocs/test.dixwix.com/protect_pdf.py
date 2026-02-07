import sys
import PyPDF2

def protect_pdf(input_path, output_path, password):
    try:
        print(f"Opening PDF file: {input_path}")
        
        # Read the existing PDF
        with open(input_path, 'rb') as input_file:
            reader = PyPDF2.PdfReader(input_file)
            writer = PyPDF2.PdfWriter()

            # Copy all pages to the writer
            for page_num in range(len(reader.pages)):
                writer.add_page(reader.pages[page_num])

            # Add password protection
            writer.encrypt(password)

            # Write out the protected PDF
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)

        print(f"Protected PDF saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python protect_pdf.py <input_path> <output_path> <password>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    password = sys.argv[3]
    protect_pdf(input_path, output_path, password)
