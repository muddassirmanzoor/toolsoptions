import os
import sys
import traceback
from PyPDF2 import PdfReader, PdfWriter


def err(msg: str, code: int = 1):
    print(msg, file=sys.stderr, flush=True)
    sys.exit(code)


def crop_pdf(input_path, output_path,
             left_margin, top_margin, right_margin, bottom_margin,
             mode, page_index_str):
    try:
        inp = os.path.abspath(input_path)
        outp = os.path.abspath(output_path)

        print(f"Opening PDF file: {inp}", file=sys.stderr, flush=True)

        if not os.path.exists(inp):
            err(f"Input not found: {inp}", 2)

        # Parse margins
        try:
            left_margin = float(left_margin)
            top_margin = float(top_margin)
            right_margin = float(right_margin)
            bottom_margin = float(bottom_margin)
        except ValueError:
            err("Margins must be numbers (left, top, right, bottom).", 3)

        mode = (mode or "").lower().strip()
        if mode not in ("all", "single"):
            err("Mode must be 'all' or 'single'.", 4)

        try:
            page_index = int(page_index_str)
        except ValueError:
            err("pageIndex must be an integer (0-based).", 5)

        reader = PdfReader(inp)

        if reader.is_encrypted:
            # You can attempt reader.decrypt("") if you want to support no-password encryption
            err("Input PDF is encrypted; cannot crop without decrypting.", 6)

        num_pages = len(reader.pages)
        if num_pages == 0:
            err("Input PDF has no pages.", 7)

        if mode == "single" and not (0 <= page_index < num_pages):
            err(f"pageIndex {page_index} out of range (0..{num_pages - 1}).", 8)

        writer = PdfWriter()

        for i, page in enumerate(reader.pages):
            # Original box in PDF points
            box = page.mediabox
            left = float(box.left)
            bottom = float(box.bottom)
            right = float(box.right)
            top = float(box.top)

            # Decide if this page should be cropped
            apply_this_page = (mode == "all") or (mode == "single" and i == page_index)

            if apply_this_page:
                # Margins interpretation:
                # left_margin  = distance from left edge (cut from left)
                # right_margin = distance from right edge (cut from right)
                # top_margin   = distance from top edge downward (cut from top)
                # bottom_margin= distance from bottom edge upward (cut from bottom)
                new_left = left + left_margin
                new_right = right - right_margin
                new_top = top - top_margin
                new_bottom = bottom + bottom_margin

                # Validate
                if new_right <= new_left or new_top <= new_bottom:
                    err(
                        f"Invalid crop region on page {i + 1}: "
                        f"({new_left}, {new_bottom}, {new_right}, {new_top})",
                        9
                    )

                # Apply to CropBox and MediaBox
                page.cropbox.lower_left = (new_left, new_bottom)
                page.cropbox.upper_right = (new_right, new_top)
                page.mediabox.lower_left = (new_left, new_bottom)
                page.mediabox.upper_right = (new_right, new_top)

            # Add page (cropped or unchanged) to writer
            writer.add_page(page)

        # Write out
        with open(outp, "wb") as f_out:
            writer.write(f_out)

        if not os.path.exists(outp) or os.path.getsize(outp) == 0:
            err("Output file missing or empty after crop.", 10)

        print(f"Cropped PDF saved to: {outp}", flush=True)

    except Exception:
        traceback.print_exc()
        sys.exit(11)


if __name__ == "__main__":
    # Usage:
    # python crop_pdf.py <input> <output> <left> <top> <right> <bottom> <mode> <pageIndex>
    if len(sys.argv) != 9:
        print(
            "Usage: python crop_pdf.py <input_path> <output_path> "
            "<left_margin> <top_margin> <right_margin> <bottom_margin> <mode> <pageIndex>",
            file=sys.stderr,
        )
        sys.exit(1)

    _, input_path, output_path, left, top, right, bottom, mode, page_index = sys.argv
    crop_pdf(input_path, output_path, left, top, right, bottom, mode, page_index)
