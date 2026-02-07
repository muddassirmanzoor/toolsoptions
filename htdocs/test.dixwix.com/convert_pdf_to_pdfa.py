import sys
import subprocess
import os
import pikepdf
import tempfile
import shutil

def find_gs() -> str | None:
    # 1) Respect explicit env var if set
    p = os.environ.get("GHOSTSCRIPT_PATH")
    if p and os.path.isfile(p):
        return p

    # 2) Try PATH (Windows & *nix)
    for name in ("gswin64c", "gs"):
        w = shutil.which(name)
        if w:
            return w

    return None

def add_output_intent(pdf, icc_profile_path):
    """Add PDF/A OutputIntent to the PDF if necessary."""
    try:
        uncalibrated_color_spaces = [b'/DeviceRGB', b'/DeviceCMYK', b'/DeviceGray']
        add_output_intent = False

        # Scan through all pages and objects to find uncalibrated color spaces
        for page in pdf.pages:
            resources = page.get('/Resources', {})
            color_spaces = resources.get('/ColorSpace', {})

            for color_space_name, color_space_value in color_spaces.items():
                if isinstance(color_space_value, pikepdf.Array):
                    color_space_value = color_space_value[0]
                if color_space_value in uncalibrated_color_spaces:
                    add_output_intent = True
                    break
            if add_output_intent:
                break

        if add_output_intent:
            with open(icc_profile_path, "rb") as icc_file:
                icc_profile = icc_file.read()

            # Create the OutputIntent dictionary
            output_intent = pikepdf.Dictionary({
                pikepdf.Name("/Type"): pikepdf.Name("/OutputIntent"),
                pikepdf.Name("/S"): pikepdf.Name("/GTS_PDFA1"),
                pikepdf.Name("/OutputConditionIdentifier"): pikepdf.String("sRGB IEC61966-2-1"),
                pikepdf.Name("/Info"): pikepdf.String("sRGB IEC61966-2-1"),
                pikepdf.Name("/DestOutputProfile"): pikepdf.Stream(pdf, icc_profile)
            })

            # Add the OutputIntent to the PDF
            if "/OutputIntents" in pdf.Root:
                pdf.Root[pikepdf.Name("/OutputIntents")].append(output_intent)
            else:
                pdf.Root[pikepdf.Name("/OutputIntents")] = [output_intent]

            print("OutputIntent added successfully.")
        else:
            print("No uncalibrated color spaces found. OutputIntent not needed.")

    except Exception as e:
        print(f"Error adding OutputIntent: {e}")

def add_metadata(pdf):
    """Add or update metadata in XMP format based on document information dictionary."""
    try:
        doc_info = pdf.docinfo

        # Create XMP metadata
        xmp_metadata = f"""<?xml version="1.0" encoding="UTF-8"?>
        <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Toolkit 5.1-c009 59.151395, 2010/07/23-01:09:00">
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                <rdf:Description rdf:about=""
                    xmlns:pdfa="http://www.aiim.org/pdfa/ns/id/"
                    pdfa:part="1"
                    pdfa:conformance="A"
                    pdf:Producer="{doc_info.get('/Producer', '')}"
                    dc:creator="{doc_info.get('/Author', '')}"
                    dc:title="{doc_info.get('/Title', '')}"
                    dc:description="{doc_info.get('/Subject', '')}"
                    dc:subject="{doc_info.get('/Keywords', '')}"
                    xmp:CreatorTool="{doc_info.get('/Creator', '')}">
                </rdf:Description>
            </rdf:RDF>
        </x:xmpmeta>"""

        # Add or update XMP metadata
        if "/Metadata" not in pdf.Root:
            pdf.Root[pikepdf.Name("/Metadata")] = pikepdf.Stream(xmp_metadata.encode('utf-8'))
        else:
            pdf.Root[pikepdf.Name("/Metadata")] = pikepdf.Stream(xmp_metadata.encode('utf-8'))

    except Exception as e:
        print(f"Error adding metadata: {e}")

def add_markinfo(pdf):
    """Ensure the PDF includes a MarkInfo dictionary with Marked set to true."""
    try:
        mark_info = pikepdf.Dictionary({
            pikepdf.Name("/Marked"): pikepdf.Name("/True")
        })
        pdf.Root[pikepdf.Name("/MarkInfo")] = mark_info
    except Exception as e:
        print(f"Error adding MarkInfo: {e}")

def add_structure_hierarchy(pdf):
    """Ensure the PDF includes a structure hierarchy rooted in the StructTreeRoot."""
    try:
        if "/StructTreeRoot" not in pdf.Root:
            pdf.Root[pikepdf.Name("/StructTreeRoot")] = pikepdf.Dictionary({
                pikepdf.Name("/Type"): pikepdf.Name("/StructTreeRoot"),
                pikepdf.Name("/K"): pikepdf.Dictionary({
                    pikepdf.Name("/Type"): pikepdf.Name("/StructElem"),
                    pikepdf.Name("/S"): pikepdf.Name("/Document")
                })
            })
    except Exception as e:
        print(f"Error adding structure hierarchy: {e}")

def add_tounicode_cmap(pdf):
    """Ensure fonts have a ToUnicode entry."""
    try:
        if "/Fonts" in pdf.Root:
            fonts = pdf.Root["/Fonts"]
            for font_name in fonts:
                font_dict = fonts[font_name]
                if "/ToUnicode" not in font_dict:
                    # Simplified example; needs proper CMap generation
                    font_dict[pikepdf.Name("/ToUnicode")] = pikepdf.Stream(b"")
    except Exception as e:
        print(f"Error adding ToUnicode CMap: {e}")

def post_process_pdf(output_path, icc_profile_path):
    """Post-process the PDF using pikepdf to add necessary elements and fix issues."""
    try:
        # Create a temporary file for post-processing
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name

        pdf = pikepdf.Pdf.open(output_path)

        add_output_intent(pdf, icc_profile_path)
        add_metadata(pdf)
        add_markinfo(pdf)
        add_structure_hierarchy(pdf)
        add_tounicode_cmap(pdf)

        # Save to the temporary file
        pdf.save(temp_path)
        pdf.close()

        # Replace the original file with the temporary file
        shutil.move(temp_path, output_path)
        print(f"Post-processing completed. Output: {output_path}")

    except Exception as e:
        print(f"Error during post-processing with pikepdf: {e}")
        sys.exit(1)

def validate_pdfa(output_path):
    """Validate the generated PDF against PDF/A standards using VeraPDF."""
    try:
        # Run VeraPDF validation using verapdf.bat
        result = subprocess.run(["verapdf.bat", output_path], capture_output=True, text=True)
        if result.returncode == 0:
            print("PDF/A validation passed.")
        else:
            print(f"PDF/A validation failed:\n{result.stdout}")
            sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error during PDF/A validation: {e}")
        sys.exit(1)

def convert_to_pdfa(input_path, output_path, conformance_level, icc_profile_path):
    gs = find_gs()
    try:
        input_path = os.path.abspath(input_path)
        output_path = os.path.abspath(output_path)

        # Base Ghostscript command for PDF/A conversion
        gs_command = [
            gs,  # Change to "gs" for Linux/MacOS
            "-dPDFA",
            "-dBATCH",
            "-dNOPAUSE",
            "-sDEVICE=pdfwrite",
            f"-sOutputFile={output_path}",
            "-dPDFACompatibilityPolicy=1",
            "-dPDFSETTINGS=/prepress",  # Adjust as needed
            input_path
        ]

        # Map the conformance levels from select box to Ghostscript options
        conformance_map = {
            'pdfa1a': '-dPDFA1A',
            'pdfa1b': '-dPDFA1B',
            'pdfa2a': '-dPDFA2A',
            'pdfa2b': '-dPDFA2B',
            'pdfa2u': '-dPDFA2U',
            'pdfa3a': '-dPDFA3A',
            'pdfa3b': '-dPDFA3B',
            'pdfa3u': '-dPDFA3U'
        }

        if conformance_level in conformance_map:
            gs_command.append(conformance_map[conformance_level])
        else:
            raise ValueError(f"Unsupported conformance level: {conformance_level}")

        print("Running Ghostscript command:")
        print(' '.join(gs_command))

        subprocess.run(gs_command, check=True)
        print(f"PDF/A ({conformance_level}) conversion completed. Output: {output_path}")

        post_process_pdf(output_path, icc_profile_path)

        # Validate the output PDF using VeraPDF
        # validate_pdfa(output_path)

    except subprocess.CalledProcessError as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python convert_pdf_to_pdfa.py <input_path> <output_path> <conformance_level> <icc_profile_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    conformance_level = sys.argv[3]
    icc_profile_path = sys.argv[4]

    convert_to_pdfa(input_path, output_path, conformance_level, icc_profile_path)
