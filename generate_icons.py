from PIL import Image
import os
import sys
import json

# Define the output directory
output_dir = 'uploads/icons'
os.makedirs(output_dir, exist_ok=True)

# Define allowed formats
allowed_formats = ['PNG', 'JPEG', 'ICO', 'GIF', 'WEBP']

# Sizes for various icons
icon_sizes = {
    'android': [
        (36, 'android-icon-36x36.png'),
        (48, 'android-icon-48x48.png'),
        (72, 'android-icon-72x72.png'),
        (96, 'android-icon-96x96.png'),
        (144, 'android-icon-144x144.png'),
        (192, 'android-icon-192x192.png')
    ],
    'apple': [
        (57, 'apple-icon-57x57.png'),
        (60, 'apple-icon-60x60.png'),
        (72, 'apple-icon-72x72.png'),
        (76, 'apple-icon-76x76.png'),
        (114, 'apple-icon-114x114.png'),
        (120, 'apple-icon-120x120.png'),
        (144, 'apple-icon-144x144.png'),
        (152, 'apple-icon-152x152.png'),
        (180, 'apple-icon-180x180.png'),
        ('precomposed', 'apple-icon-precomposed.png'),
        ('regular', 'apple-icon.png')
    ],
    'favicon': [
        (16, 'favicon-16x16.png'),
        (32, 'favicon-32x32.png'),
        (96, 'favicon-96x96.png'),
        ('ico', 'favicon.ico')
    ],
    'ms': [
        (70, 'ms-icon-70x70.png'),
        (144, 'ms-icon-144x144.png'),
        (150, 'ms-icon-150x150.png'),
        (310, 'ms-icon-310x310.png')
    ]
}

def generate_icons(input_image, sizes):
    image = Image.open(input_image)
    # Validate the image format
    if image.format not in allowed_formats:
        print(f"Error: Unsupported image format: {image.format}")
        sys.exit(1)
    for size, filename in sizes:
        if size == 'ico':
            # Convert image to ICO format using Pillow
            image.save(os.path.join(output_dir, filename), format='ico')
        elif size == 'precomposed' or size == 'regular':
            image.save(os.path.join(output_dir, filename), format='png')
        else:
            # Resize image with high-quality resampling filter
            icon = image.resize((size, size), Image.Resampling.LANCZOS)
            icon.save(os.path.join(output_dir, filename), format='png', dpi=(300, 300))

def generate_additional_files():
    # Generate browserconfig.xml
    browserconfig_content = """<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="ms-icon-70x70.png"/>
      <square150x150logo src="ms-icon-150x150.png"/>
      <wide310x150logo src="ms-icon-310x310.png"/>
      <square310x310logo src="ms-icon-310x310.png"/>
      <TileColor>#ffffff</TileColor>
    </tile>
  </msapplication>
</browserconfig>"""
    with open(os.path.join(output_dir, 'browserconfig.xml'), 'w') as f:
        f.write(browserconfig_content)

    # Generate manifest.json
    manifest = {
        "short_name": "App",
        "name": "Your Application Name",
        "icons": [
            {"src": "android-icon-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "apple-icon-180x180.png", "sizes": "180x180", "type": "image/png"},
            {"src": "favicon-32x32.png", "sizes": "32x32", "type": "image/png"}
        ],
        "start_url": "/",
        "display": "standalone",
        "theme_color": "#ffffff",
        "background_color": "#ffffff"
    }
    with open(os.path.join(output_dir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)

def main():
    if len(sys.argv) != 3:
        print("Usage: python generate_icons.py <input_image> <icon_type>")
        sys.exit(1)

    input_image = sys.argv[1]
    icon_type = sys.argv[2]

    if icon_type == 'web':
        for category, sizes in icon_sizes.items():
            generate_icons(input_image, sizes)
        generate_additional_files()
    elif icon_type == 'favicon16x16':
        generate_icons(input_image, icon_sizes['favicon'][:1])
    else:
        print("Invalid option")
        sys.exit(1)

if __name__ == "__main__":
    main()
