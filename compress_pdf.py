import os
import sys
import shutil
import subprocess
import traceback

def err(msg: str, code: int = 1):
    print(msg, file=sys.stderr, flush=True)
    sys.exit(code)

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

def get_gs_quality(compression):
    """
    Map user-friendly compression level to Ghostscript setting.
    """
    compression = (compression or "").lower().strip()

    if compression == "extreme":
        return "/screen"
    elif compression == "less":
        return "/printer"
    return "/ebook"


def main():
    if len(sys.argv) != 4:
        err("Usage: python compress_pdf.py <input_path> <output_path>", 2)

    inp  = os.path.abspath(sys.argv[1])
    outp = os.path.abspath(sys.argv[2])
    compression_level = sys.argv[3]
    gs_quality = get_gs_quality(compression_level)

    print(f"Opening PDF file: {inp}", file=sys.stderr, flush=True)

    # Check input exists & is readable
    if not os.path.exists(inp):
        err(f"Input not found: {inp}", 3)
    try:
        with open(inp, "rb") as f:
            f.read(5)
    except Exception as e:
        err(f"Failed to open input: {e!r}", 3)

    gs = find_gs()
    if not gs:
        err("Ghostscript not found. Set GHOSTSCRIPT_PATH to gswin64c.exe or add it to PATH.", 4)

    # Safer flags: -o sets -sOutputFile, -f separates filenames
    cmd = [
        gs,
        "-sDEVICE=pdfwrite",
        "-o", outp,
        "-dCompatibilityLevel=1.7",
        f"-dPDFSETTINGS={gs_quality}",
        "-dNOPAUSE",
        "-dBATCH",
        "-dQUIET",
        "-f", inp
    ]

    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError:
        err("Ghostscript executable not found at runtime. Verify GHOSTSCRIPT_PATH or PATH.", 4)
    except subprocess.CalledProcessError as e:
        err(f"Ghostscript failed (exit {e.returncode}).", e.returncode or 5)
    except Exception:
        traceback.print_exc()
        sys.exit(6)

    # Verify output
    if not os.path.exists(outp) or os.path.getsize(outp) == 0:
        err("Ghostscript finished but output is missing or empty.", 7)

    print(f"Compressed PDF saved to: {outp}", flush=True)

if __name__ == "__main__":
    main()