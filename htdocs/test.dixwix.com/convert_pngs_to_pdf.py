from PIL import Image, ImageOps
import sys
import os

# Constants for A4 size in pixels at 72 DPI
A4_WIDTH_PIXELS = 595  # A4 width in points (72 DPI)
A4_HEIGHT_PIXELS = 842  # A4 height in points (72 DPI)

def resize_image(image, max_width, max_height):
    # Get the current size of the image
    width, height = image.size
    
    # Calculate the ratio to resize the image while maintaining the aspect ratio
    width_ratio = max_width / width
    height_ratio = max_height / height
    ratio = min(width_ratio, height_ratio)
    
    new_width = int(width * ratio)
    new_height = int(height * ratio)
    
    # Resize the image with the calculated dimensions
    return image.resize((new_width, new_height), Image.LANCZOS)

def fit_image_to_a4(image, a4_width, a4_height):
    # Resize the image to fit within A4 size
    image = resize_image(image, a4_width, a4_height)
    
    # Create a new image with A4 size and a white background
    new_image = Image.new("RGB", (a4_width, a4_height), (255, 255, 255))
    
    # Calculate position to center the resized image
    left = (a4_width - image.width) // 2
    top = (a4_height - image.height) // 2
    
    # Paste the resized image onto the new image
    new_image.paste(image, (left, top))
    
    return new_image

def convert_pngs_to_pdf(output_pdf, *image_files):
    try:
        images = []
        
        # Process each image
        for image_file in image_files:
            print(f"Processing {image_file}")
            image = Image.open(image_file).convert('RGB')
            
            # Fit the image to A4 size with centering
            image = fit_image_to_a4(image, A4_WIDTH_PIXELS, A4_HEIGHT_PIXELS)
            images.append(image)
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_pdf)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Save images as a PDF
        if images:
            images[0].save(output_pdf, save_all=True, append_images=images[1:])
            print(f"PDF saved as {output_pdf}")
        else:
            print("No images found to convert.")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_pngs_to_pdf.py <output_pdf> <image_file1> <image_file2> ...")
        sys.exit(1)

    output_pdf = sys.argv[1]
    image_files = sys.argv[2:]
    
    # Ensure output path is correctly formed
    output_pdf = os.path.abspath(output_pdf)
    
    convert_pngs_to_pdf(output_pdf, *image_files)
