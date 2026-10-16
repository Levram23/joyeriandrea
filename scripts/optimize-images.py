"""Re-encode existing artwork only; no visual edits. Requires Pillow for asset maintenance."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
assets = root / 'dist' / 'assets'
manifest = {}
for name in ['hero-joyas', 'joyas', 'relojes', 'regalos']:
    original = assets / f'{name}.png'
    with Image.open(original) as source:
        image = source.convert('RGB')
        entries = []
        for width in [480, 800, 1120]:
            width = min(width, image.width)
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            target = assets / f'{name}-{width}.webp'
            resized.save(target, 'WEBP', quality=83, method=6)
            entries.append({'path': f'assets/{target.name}', 'width': width, 'height': height, 'bytes': target.stat().st_size})
        manifest[name] = {'originalBytes': original.stat().st_size, 'variants': entries}
        if name == 'joyas':
            # Keep the entire existing image in a standard landscape social card.
            share = image.copy()
            share.thumbnail((1200, 630), Image.Resampling.LANCZOS)
            canvas = Image.new('RGB', (1200, 630), '#e8eee2')
            canvas.paste(share, ((1200-share.width)//2, (630-share.height)//2))
            canvas.save(assets / 'social-joyas.jpg', 'JPEG', quality=85, optimize=True, progressive=True)
            manifest['social'] = {'path': 'assets/social-joyas.jpg', 'width': 1200, 'height': 630}
(root / 'src' / 'images.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps(manifest, indent=2))
