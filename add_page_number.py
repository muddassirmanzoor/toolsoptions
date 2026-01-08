import sys
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from io import BytesIO

def create_page_number_pdf(page_number, position, page_size, transparency):
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    text_color = Color(0, 0, 0, alpha=transparency / 100.0)  # Semi-transparent text
    can.setFont("Helvetica", page_size)
    
    # Placeholder for page number
    text = f"Page {page_number}"
    text_width, text_height = can.stringWidth(text, "Helvetica", page_size), page_size
    page_width, page_height = letter
    text_x, text_y = get_position(position, page_width, page_height, text_width, text_height)
    
    can.setFillColor(text_color)
    can.drawString(text_x, text_y, text)
    
    can.save()
    packet.seek(0)
    return packet

def get_position(position, page_width, page_height, watermark_width, watermark_height):
    # Define margins to keep watermark within page
    margin = 10
    header_margin = 50  # Margin from the top edge for header positions

    # Calculate initial position based on alignment
    if position == 'top-left':
        x_position = margin
        y_position = page_height - watermark_height - header_margin + 40
    elif position == 'top-center':
        x_position = (page_width - watermark_width) / 2
        y_position = page_height - watermark_height - header_margin + 40
    elif position == 'top-right':
        x_position = page_width - watermark_width - margin - 20
        y_position = page_height - watermark_height - header_margin + 40
    elif position == 'middle-left':
        x_position = margin
        y_position = (page_height - watermark_height) / 2
    elif position == 'middle-center':
        x_position = (page_width - watermark_width) / 2
        y_position = (page_height - watermark_height) / 2
    elif position == 'middle-right':
        x_position = page_width - watermark_width - margin  - 20
        y_position = (page_height - watermark_height) / 2
    elif position == 'bottom-left':
        x_position = margin
        y_position = margin
    elif position == 'bottom-center':
        x_position = (page_width - watermark_width) / 2 
        y_position = margin
    elif position == 'bottom-right':
        x_position = page_width - watermark_width - margin - 20
        y_position = margin
    else:
        # Default to middle-center if not found
        x_position = (page_width - watermark_width) / 2
        y_position = (page_height - watermark_height) / 2

    # Adjust positions to stay within page boundaries
    x_position = max(margin, min(x_position, page_width - watermark_width - margin))
    y_position = max(margin, min(y_position, page_height - watermark_height - margin))

    return (x_position, y_position)

def add_page_number(input_path, output_path, position='bottom-right', transparency=50, page_size=35):
    try:
        # Create a PdfReader object for the input file
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        for i, page in enumerate(reader.pages, start=1):
            # Create page number text for each page
            page_number_text_pdf = create_page_number_pdf(i, position, page_size, transparency)
            page_number_pdf = PdfReader(page_number_text_pdf)
            page_number_watermark_page = page_number_pdf.pages[0]
            
            # Merge the page number with the original page
            page.merge_page(page_number_watermark_page)
            writer.add_page(page)
        
        # Save the output PDF
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

        print(f"Page-numbered PDF saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_page_number.py <input_path> <output_path> [--position <position>] [--transparency <value>] [--page-size <size>]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    position = 'bottom-right'
    transparency = 50
    page_size = 35

    # Parse command-line arguments
    args = sys.argv[3:]
    while args:
        arg = args.pop(0)
        if arg == '--position':
            position = args.pop(0)
        elif arg == '--transparency':
            transparency = int(args.pop(0))
        elif arg == '--page-size':
            page_size = int(args.pop(0))

    add_page_number(input_path, output_path, position=position, transparency=transparency, page_size=page_size)
