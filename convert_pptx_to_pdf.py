import sys
import subprocess
import os
import shutil
from pathlib import Path

def find_libreoffice() -> str | None:
    p = os.environ.get("LIBREOFFICE_PATH")
    if p and Path(p).is_file():
        return p

    w = shutil.which("soffice")
    if w:
        return w

    return None

def convert_pptx_to_pdf(input_pptx_path, output_pdf_path):
    libreoffice = find_libreoffice()
    try:
        # Convert using LibreOffice in headless mode
        command = [
            libreoffice,
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            str(Path(output_pdf_path).parent),
            input_pptx_path
        ]
        subprocess.run(command, check=True)
        
        # Rename the converted file to match the output path
        converted_pdf_path = str(Path(output_pdf_path).parent / (Path(input_pptx_path).stem + '.pdf'))
        Path(converted_pdf_path).rename(output_pdf_path)

        print(f"Conversion complete. PDF saved to {output_pdf_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_pptx_to_pdf.py <input_pptx_path> <output_pdf_path>")
        sys.exit(1)

    input_pptx_path = sys.argv[1]
    output_pdf_path = sys.argv[2]

    # Ensure input and output paths are absolute
    input_pptx_path = Path(input_pptx_path).resolve()
    output_pdf_path = Path(output_pdf_path).resolve()

    convert_pptx_to_pdf(input_pptx_path, output_pdf_path)
