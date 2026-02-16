import sys
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color, HexColor
from io import BytesIO
import re

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_page_number_pdf(page_number, total_pages, position, page_size, transparency, 
                          text_template, custom_text, font_family, text_bold, text_italic, 
                          text_underline, text_color, page_margin, page_type, is_left_page=False):
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Convert hex color to RGB - handle both #RRGGBB and RRGGBB formats
    try:
        if text_color.startswith('#'):
            rgb = hex_to_rgb(text_color)
        else:
            rgb = hex_to_rgb('#' + text_color)
    except Exception as e:
        print(f"Error parsing color '{text_color}': {e}, using black")
        rgb = (0, 0, 0)
    
    # Ensure transparency and page_size are numbers
    if isinstance(transparency, str):
        transparency = float(transparency)
    if isinstance(page_size, str):
        page_size = int(page_size)
    
    # Calculate alpha (transparency) - 0-100 scale where 100 is fully opaque
    # Note: For text color, we want the color to be visible, so we use full opacity for the color itself
    # Transparency affects the overall text, but we'll apply it via the alpha channel
    alpha = max(0.0, min(1.0, transparency / 100.0))
    
    # Create color object - use the RGB values with the transparency as alpha
    text_color_obj = Color(rgb[0]/255.0, rgb[1]/255.0, rgb[2]/255.0, alpha=alpha)
    
    # Set both fill and stroke color to ensure color is applied
    can.setFillColor(text_color_obj)
    can.setStrokeColor(text_color_obj)
    
    
    # Set font with bold/italic
    # ReportLab font names: Helvetica, Times-Roman, Courier
    # Map common names to ReportLab names
    font_map = {
        'Arial': 'Helvetica',
        'Helvetica': 'Helvetica',
        'Times': 'Times-Roman',
        'Times-Roman': 'Times-Roman',
        'Courier': 'Courier'
    }
    base_font = font_map.get(font_family, 'Helvetica')
    
    # Build font name with style
    # Ensure text_bold, text_italic are boolean
    if isinstance(text_bold, str):
        text_bold = text_bold.lower() == 'true'
    if isinstance(text_italic, str):
        text_italic = text_italic.lower() == 'true'
    if isinstance(text_underline, str):
        text_underline = text_underline.lower() == 'true'
    
    if text_bold and text_italic:
        if base_font == 'Helvetica':
            font_name = 'Helvetica-BoldOblique'
        elif base_font == 'Times-Roman':
            font_name = 'Times-BoldItalic'
        else:  # Courier
            font_name = 'Courier-BoldOblique'
    elif text_bold:
        if base_font == 'Helvetica':
            font_name = 'Helvetica-Bold'
        elif base_font == 'Times-Roman':
            font_name = 'Times-Bold'
        else:  # Courier
            font_name = 'Courier-Bold'
    elif text_italic:
        if base_font == 'Helvetica':
            font_name = 'Helvetica-Oblique'
        elif base_font == 'Times-Roman':
            font_name = 'Times-Italic'
        else:  # Courier
            font_name = 'Courier-Oblique'
    else:
        font_name = base_font
    
    can.setFont(font_name, page_size)
    
    # Generate text based on template or custom text
    # Priority: custom_text > text_template > page number only
    text = str(page_number)  # Default fallback
    
    if custom_text and custom_text.strip():
        text = custom_text
        text = text.replace("{n}", str(page_number))
        text = text.replace("{t}", str(total_pages))
    elif text_template and text_template.strip():
        text = text_template
        text = text.replace("{n}", str(page_number))
        text = text.replace("{t}", str(total_pages))
    
    # Calculate text width and height
    text_width = can.stringWidth(text, font_name, page_size)
    text_height = page_size
    
    page_width, page_height = letter
    
    # Adjust position for facing pages
    if page_type == "facing" and is_left_page:
        # For left pages in facing mode, use left-aligned positions
        if "right" in position:
            position = position.replace("right", "left")
        elif "center" in position:
            position = position.replace("center", "left")
    elif page_type == "facing" and not is_left_page:
        # For right pages in facing mode, use right-aligned positions
        if "left" in position:
            position = position.replace("left", "right")
        elif "center" in position:
            position = position.replace("center", "right")
    
    # Get base position
    text_x, text_y = get_position(position, page_width, page_height, text_width, text_height, page_margin)
    
    # Draw text
    can.drawString(text_x, text_y, text)
    
    # Draw underline if needed
    if text_underline:
        line_y = text_y - 2
        can.setStrokeColor(text_color_obj)
        can.setLineWidth(1)
        can.line(text_x, line_y, text_x + text_width, line_y)
    
    can.save()
    packet.seek(0)
    return packet

def get_position(position, page_width, page_height, watermark_width, watermark_height, page_margin="medium"):
    # Define margins based on margin setting
    if page_margin == "small":
        margin = 5
        header_margin = 30
    elif page_margin == "large":
        margin = 20
        header_margin = 70
    else:  # medium (default)
        margin = 10
        header_margin = 50

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
        x_position = page_width - watermark_width - margin - 20
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

def add_page_number(input_path, output_path, position='bottom-right', transparency=50, page_size=35,
                   page_type='single', page_margin='medium', start_page=1, end_page=1,
                   text_template='', custom_text='', font_family='Helvetica', text_bold=False,
                   text_italic=False, text_underline=False, text_color='#000000', total_pages=1):
    try:
        # Create a PdfReader object for the input file
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Get actual total pages
        actual_total_pages = len(reader.pages)
        if total_pages == 0 or total_pages > actual_total_pages:
            total_pages = actual_total_pages
        
        # Validate and adjust page range
        # First, clamp to valid range
        start_page = max(1, min(start_page, actual_total_pages))
        end_page = max(start_page, min(end_page, actual_total_pages))
        
        # Only auto-adjust if user hasn't explicitly set a range
        # If both are 1 and we have more pages, it's likely default values
        # But ONLY auto-adjust if page_type is 'single' (user wants all pages numbered)
        if end_page == 1 and actual_total_pages > 1 and start_page == 1:
            # Check if this is really a default (user didn't set a range)
            # If page_type is 'single', assume user wants all pages
            if page_type == 'single':
                end_page = actual_total_pages
            # If page_type is 'facing', also number all pages by default
            elif page_type == 'facing':
                end_page = actual_total_pages
        
        for i, page in enumerate(reader.pages, start=1):
            # Only add page numbers to pages in the specified range
            if start_page <= i <= end_page:
                # Determine if this is a left page (for facing pages)
                # In facing mode, odd pages are right, even pages are left
                is_left_page = False
                if page_type == "facing":
                    is_left_page = (i % 2 == 0)
                
                # Create page number text for this page
                page_number_text_pdf = create_page_number_pdf(
                    i, total_pages, position, page_size, transparency,
                    text_template, custom_text, font_family, text_bold, text_italic,
                    text_underline, text_color, page_margin, page_type, is_left_page
                )
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
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_page_number.py <input_path> <output_path> [options]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    # Default values
    position = 'bottom-right'
    transparency = 50
    page_size = 35
    page_type = 'single'
    page_margin = 'medium'
    start_page = 1
    end_page = 1
    text_template = ''
    custom_text = ''
    font_family = 'Helvetica'
    text_bold = False
    text_italic = False
    text_underline = False
    text_color = '#000000'
    total_pages = 1

    # Parse command-line arguments
    args = sys.argv[3:]
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == '--position' and i + 1 < len(args):
            position = args[i + 1].strip('"\'')
            i += 2
        elif arg == '--transparency' and i + 1 < len(args):
            transparency = int(args[i + 1])
            i += 2
        elif arg == '--page-size' and i + 1 < len(args):
            page_size = int(args[i + 1])
            i += 2
        elif arg == '--page-type' and i + 1 < len(args):
            page_type = args[i + 1].strip('"\'')
            i += 2
        elif arg == '--page-margin' and i + 1 < len(args):
            page_margin = args[i + 1].strip('"\'')
            i += 2
        elif arg == '--start-page' and i + 1 < len(args):
            start_page = int(args[i + 1])
            i += 2
        elif arg == '--end-page' and i + 1 < len(args):
            end_page = int(args[i + 1])
            i += 2
        elif arg == '--text-template' and i + 1 < len(args):
            # Handle text template - may have spaces and special chars like {n}/{t}
            text_template = args[i + 1]
            # Remove surrounding quotes if present
            if (text_template.startswith('"') and text_template.endswith('"')) or \
               (text_template.startswith("'") and text_template.endswith("'")):
                text_template = text_template[1:-1]
            # Unescape any escaped quotes and backslashes
            text_template = text_template.replace('\\"', '"').replace("\\'", "'").replace('\\\\', '\\')
            i += 2
        elif arg == '--custom-text' and i + 1 < len(args):
            custom_text = args[i + 1].strip('"\'')
            i += 2
        elif arg == '--font-family' and i + 1 < len(args):
            # Handle font family - remove quotes if present
            font_family = args[i + 1]
            if (font_family.startswith('"') and font_family.endswith('"')) or \
               (font_family.startswith("'") and font_family.endswith("'")):
                font_family = font_family[1:-1]
            font_family = font_family.replace('\\"', '"').replace("\\'", "'")
            i += 2
        elif arg == '--text-bold' and i + 1 < len(args):
            text_bold = args[i + 1].lower() == 'true'
            i += 2
        elif arg == '--text-italic' and i + 1 < len(args):
            text_italic = args[i + 1].lower() == 'true'
            i += 2
        elif arg == '--text-underline' and i + 1 < len(args):
            text_underline = args[i + 1].lower() == 'true'
            i += 2
        elif arg == '--text-color' and i + 1 < len(args):
            # Handle color - remove quotes if present
            text_color = args[i + 1]
            if (text_color.startswith('"') and text_color.endswith('"')) or \
               (text_color.startswith("'") and text_color.endswith("'")):
                text_color = text_color[1:-1]
            text_color = text_color.replace('\\"', '"').replace("\\'", "'")
            i += 2
        elif arg == '--total-pages' and i + 1 < len(args):
            total_pages = int(args[i + 1])
            i += 2
        else:
            i += 1

    add_page_number(
        input_path, output_path, 
        position=position, 
        transparency=transparency, 
        page_size=page_size,
        page_type=page_type,
        page_margin=page_margin,
        start_page=start_page,
        end_page=end_page,
        text_template=text_template,
        custom_text=custom_text,
        font_family=font_family,
        text_bold=text_bold,
        text_italic=text_italic,
        text_underline=text_underline,
        text_color=text_color,
        total_pages=total_pages
    )
