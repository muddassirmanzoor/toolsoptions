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

def convert_excel_to_pdf(excel_file, pdf_file):
    libreoffice = find_libreoffice()
    try:
        # Ensure the output directory exists
        output_dir = Path(pdf_file).parent
        if not output_dir.exists():
            output_dir.mkdir(parents=True)

        # Convert using LibreOffice in headless mode
        command = [
            libreoffice,
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            str(output_dir),
            excel_file
        ]
        subprocess.run(command, check=True)
        
        # Rename the converted file to match the output path
        converted_pdf_path = str(output_dir / (Path(excel_file).stem + '.pdf'))
        Path(converted_pdf_path).rename(pdf_file)

        print(f"Conversion complete. PDF saved to {pdf_file}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_excel_to_pdf.py <input_excel_file> <output_pdf_file>")
        sys.exit(1)

    excel_file = sys.argv[1]
    pdf_file = sys.argv[2]
    
    # Ensure paths are correctly formed
    excel_file = Path(excel_file).resolve()
    pdf_file = Path(pdf_file).resolve()
    
    convert_excel_to_pdf(excel_file, pdf_file)