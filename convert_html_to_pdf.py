import sys
import subprocess
from pathlib import Path

def convert_html_to_pdf(html_file, pdf_file):
    try:
        # Ensure the output directory exists
        output_dir = Path(pdf_file).parent
        output_dir.mkdir(parents=True, exist_ok=True)

        # Check for LibreOffice installation
        if not subprocess.run(['which', 'libreoffice'], capture_output=True).returncode == 0:
            raise EnvironmentError("LibreOffice is not installed or not found in PATH.")

        # Convert using LibreOffice in headless mode
        command = [
            'libreoffice',
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            str(output_dir),
            str(html_file)
        ]
        subprocess.run(command, check=True, capture_output=True)

        # Find the converted file
        converted_pdf_path = output_dir / (html_file.stem + '.pdf')
        if not converted_pdf_path.exists():
            raise FileNotFoundError(f"Converted PDF not found at {converted_pdf_path}")

        # Rename the converted file to match the output path
        converted_pdf_path.rename(pdf_file)

        print(f"Conversion complete. PDF saved to {pdf_file}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_html_to_pdf.py <input_html_file> <output_pdf_file>", file=sys.stderr)
        sys.exit(1)

    html_file = Path(sys.argv[1]).resolve()
    pdf_file = Path(sys.argv[2]).resolve()
    
    convert_html_to_pdf(html_file, pdf_file)
