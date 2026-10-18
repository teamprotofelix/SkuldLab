"""Structure, asset, and offline-cache checks for the Skuld Lab static site."""
from pathlib import Path
from PIL import Image
import re, subprocess
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text()
js=(R/'app.js').read_text()
sw=(R/'sw.js').read_text()
assert html.count('<section') >= 7
assert '동기화' in html and '설계도' in html
for path in re.findall(r'(?:src|href)=["\'](\./[^"\']+)["\']',html):
 if path.startswith('./#'):continue
 assert (R/path).exists(), f'missing {path}'
for path in re.findall(r"'\./[^']+'",sw):
 path=path.strip("'")
 assert (R/path).exists(), f'cache error {path}'
assets=list((R/'assets').glob('*.webp'))
assert len(assets)>=16, len(assets)
for f in assets:
 with Image.open(f) as im:
  im.verify()
 assert f.stat().st_size<150000, f'{f.name} too large'
with Image.open(R/'assets/skuld-sprites.webp') as im:assert im.size==(1024,348)
with Image.open(R/'assets/banpei-sprites.webp') as im:assert im.size==(976,128)
assert 'localStorage' in js and 'requestAnimationFrame' in js and 'keydown' in js
assert subprocess.run(['node','--check',str(R/'app.js')]).returncode==0
assert subprocess.run(['node','--check',str(R/'sw.js')]).returncode==0
print(f'PASS: {len(assets)} optimized WebP assets, links, PWA cache, sprite layouts, JS syntax, controls.')
