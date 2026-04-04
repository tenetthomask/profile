from PIL import Image
import os

files = ['profile_picture.png', 'project_1.png', 'project_2.png', 'project_3.png']

for f in files:
    if os.path.exists(f):
        img = Image.open(f)
        output = f.replace('.png', '.webp')
        img.save(output, 'WEBP', quality=85)
        print(f"Converted {f} to {output}")
    else:
        print(f"Skipping {f} - not found")
