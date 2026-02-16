import sys
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from io import BytesIO
from PIL import Image

def create_watermark_pdf(image_path, opacity=100, position='middle-center', size_percentage=10):
    # Create a PDF with the image as a base layer
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    if image_path:
        # Open the image file
        image = Image.open(image_path).convert("RGBA")
        
        # Adjust the opacity of the image
        alpha = image.getchannel('A')
        alpha = alpha.point(lambda p: p * opacity / 100.0)  # Adjust opacity
        image.putalpha(alpha)
        
        # Calculate the new size as a percentage of the page dimensions
        page_width, page_height = letter
        original_width, original_height = image.size
        aspect_ratio = original_width / original_height
        
        # Calculate size based on percentage
        new_width = int((size_percentage / 100) * page_width)
        new_height = int((size_percentage / 100) * page_height)
        
        # Adjust aspect ratio
        if new_width / new_height > aspect_ratio:
            new_width = int(new_height * aspect_ratio)
        else:
            new_height = int(new_width / aspect_ratio)
        
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save the image with adjusted opacity
        temp_image_path = 'temp_watermark_image.png'
        image.save(temp_image_path)
        
        # Determine the position
        image_x, image_y = get_position(position, page_width, page_height, new_width, new_height)
        
        # Draw the image on the PDF canvas
        can.drawImage(temp_image_path, image_x, image_y, width=new_width, height=new_height, mask='auto')
    
    can.save()
    packet.seek(0)
    return packet

def create_text_watermark_pdf(text, text_size, opacity=100, position='middle-center'):
    # Create a PDF with the text as a base layer
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    if text:
        # Apply opacity to text
        text_color = Color(0, 0, 0, alpha=opacity / 100.0)  # Semi-transparent text
        can.setFont("Helvetica", text_size)
        
        text_width, text_height = can.stringWidth(text, "Helvetica", text_size), text_size
        page_width, page_height = letter
        text_x, text_y = get_position(position, page_width, page_height, text_width, text_height)
        
        can.setFillColor(text_color)
        can.drawString(text_x, text_y, text)
    
    can.save()
    packet.seek(0)
    return packet

def get_position(position, page_width, page_height, watermark_width, watermark_height):
    # Mapping positions to coordinates (adjust as needed)
    positions = {
        'top-left': (50, page_height - watermark_height - 50),
        'top-center': ((page_width - watermark_width) / 2, page_height - watermark_height - 50),
        'top-right': (page_width - watermark_width - 50, page_height - watermark_height - 50),
        'middle-left': (50, (page_height - watermark_height) / 2),
        'middle-center': ((page_width - watermark_width) / 2, (page_height - watermark_height) / 2),
        'middle-right': (page_width - watermark_width - 50, (page_height - watermark_height) / 2),
        'bottom-left': (50, 50),
        'bottom-center': ((page_width - watermark_width) / 2, 50),
        'bottom-right': (page_width - watermark_width - 50, 50),
    }
    return positions.get(position, ((page_width - watermark_width) / 2, (page_height - watermark_height) / 2))  # Default to middle-center if not found

def add_watermark(input_path, output_path, text=None, image_path=None, position='middle-center', opacity=100, image_size=200, text_size=30):
    try:
        # Create watermark PDF with image (if provided)
        image_pdf_stream = create_watermark_pdf(image_path, opacity=opacity, position=position, size_percentage=image_size) if image_path else BytesIO()
        
        # Create watermark PDF with text (if provided)
        text_pdf_stream = create_text_watermark_pdf(text, text_size, opacity=opacity, position=position) if text else BytesIO()
        
        # Create a PdfReader object for the input file
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Merge image and text watermarks
        for i in range(len(reader.pages)):
            page = reader.pages[i]
            
            if image_path:
                image_pdf = PdfReader(image_pdf_stream)
                image_watermark_page = image_pdf.pages[0]
                page.merge_page(image_watermark_page)
                
            if text:
                text_pdf = PdfReader(text_pdf_stream)
                text_watermark_page = text_pdf.pages[0]
                page.merge_page(text_watermark_page)
            
            writer.add_page(page)
        
        # Save the output PDF
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

        print(f"Watermarked PDF saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_watermark.py <input_path> <output_path> [--text <text>] [--image <image_path>] [--position <position>] [--opacity <value>] [--image-size <size>] [--text-size <size>]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    text = None
    image_path = None
    position = 'middle-center'
    opacity = 100
    image_size = 200
    text_size = 30

    # Parse command-line arguments
    args = sys.argv[3:]
    while args:
        arg = args.pop(0)
        if arg == '--text':
            text = args.pop(0)
        elif arg == '--image':
            image_path = args.pop(0)
        elif arg == '--position':
            position = args.pop(0)
        elif arg == '--opacity':
            opacity = int(args.pop(0))
        elif arg == '--image-size':
            image_size = int(args.pop(0))
        elif arg == '--text-size':
            text_size = int(args.pop(0))

    add_watermark(input_path, output_path, text=text, image_path=image_path, position=position, opacity=opacity, image_size=image_size, text_size=text_size)
