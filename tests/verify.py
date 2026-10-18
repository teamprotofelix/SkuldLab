"""Static document, optimized asset, atlas geometry and offline graph validation."""
from pathlib import Path
from PIL import Image
from html.parser import HTMLParser
import json,re,subprocess
R=Path(__file__).resolve().parents[1];html=(R/'index.html').read_text();sw=(R/'sw.js').read_text()
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:self.ids.append(attrs['id'])
  for k in ['src','href']:
   if k in attrs:self.links.append(attrs[k])
p=Page();p.feed(html);assert len(p.ids)==len(set(p.ids)),'duplicate HTML ids'
for path in p.links:
 if path.startswith('./'):assert (R/path).exists(),f'missing {path}'
 if path.startswith('#') and len(path)>1:assert path[1:] in p.ids,f'invalid anchor {path}'
files=json.loads(re.search(r'const FILES=(\[.*?\]);',sw).group(1))
for path in files:assert (R/path).exists(),f'cache miss {path}'
assets=list((R/'assets').rglob('*.webp'))
for f in assets:
 with Image.open(f) as im:im.verify()
 assert 0<f.stat().st_size<500000,f'{f.name} exceeds individual WebP budget'
for f in (R/'assets/crew').glob('*.webp'):
 with Image.open(f) as im:
  assert im.size==(384,640),(f,im.size)
  assert im.mode=='RGBA',f'{f} lost transparent alpha'
  for y in range(4):
   for x in range(3):assert im.crop((x*128,y*160,(x+1)*128,(y+1)*160)).getbbox(),f'blank frame {f}:{x}:{y}'
assert len(list((R/'assets/crew').glob('*.webp')))==13
with Image.open(R/'assets/generated/banpei-flight.webp') as im:
 assert im.size==(900,240) and im.mode=='RGBA'
 for x in range(3):assert im.crop((x*300,0,(x+1)*300,240)).getbbox()
assert all(p in files for p in ['./lab.css','./js/lab.js','./js/lab-model.js'])
for f in ['app.js','js/lab.js','js/lab-model.js','js/pwa.js','sw.js']:subprocess.run(['node','--check',str(R/f)],check=True)
rows=json.loads((R/'docs/asset-manifest.json').read_text())
import hashlib
for row in rows:
 path=R/row['asset'];assert path.exists();assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256']
print(f'PASS: {len(p.ids)} unique ids, all local links and anchors, {len(assets)} valid WebP assets, 13 transparent 12-frame atlases, {len(files)} offline resources, provenance hashes, JS syntax.')
print(f'WebP delivery total: {sum(p.stat().st_size for p in assets):,} bytes')

m=json.loads((R/'manifest.webmanifest').read_text())
assert m['id']==m['start_url']==m['scope']=='./'
assert m['display']=='standalone'
assert {i.get('purpose') for i in m['icons']}=={'any','maskable'}
for icon in m['icons']:
 path=R/icon['src'];assert icon['src'] in files
 with Image.open(path) as im:
  assert f'{im.width}x{im.height}'==icon['sizes']
  assert im.mode in ('RGB','P') and 'transparency' not in im.info and im.format=='PNG'
with Image.open(R/'assets/banpei-apple-180.png') as im:assert im.size==(180,180)
assert './js/pwa.js' in files and './pwa.css' in files
print('PASS: standalone manifest identity, normal/maskable Banpei icons, Apple icon and offline installation assets.')
