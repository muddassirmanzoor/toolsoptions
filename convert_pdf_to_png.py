from pdf2image import convert_from_path
import sys
import os

def convert_pdf_to_png(pdf_file, output_base):
    try:
        # Ensure the output directory exists
        output_dir = os.path.dirname(output_base)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Convert PDF to images
        print(f"Converting PDF to images: {pdf_file}")
        images = convert_from_path(pdf_file)
        
        # Save each page as a PNG file
        for i, image in enumerate(images):
            png_file = f"{output_base}_page_{i + 1}.png"
            image.save(png_file, 'PNG')
            print(f"Saved page {i + 1} as {png_file}")

        print("Conversion complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_pdf_to_png.py <input_pdf_file> <output_base>")
        sys.exit(1)

    pdf_file = sys.argv[1]
    output_base = sys.argv[2]
    
    # Ensure paths are correctly formed
    pdf_file = os.path.abspath(pdf_file)
    output_base = os.path.abspath(output_base)
    
    convert_pdf_to_png(pdf_file, output_base)
