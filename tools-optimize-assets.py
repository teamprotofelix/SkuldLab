"""Convert generated PNGs to bounded WebP delivery assets. Source PNGs stay outside the repo.
Usage: python tools-optimize-assets.py /absolute/path/to/asset-paths.json
Only resizing, grid normalization and format conversion; no hand-drawn substitutes.
"""
import sys,json,hashlib,shutil,tempfile,uuid
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parent
manifest=json.loads(Path(sys.argv[1]).read_text());rows=[]
for key,path in manifest.items():
 im=Image.open(path).convert('RGBA' if key.startswith('sprite-') else 'RGB'); original=Path(path).stat().st_size
 name=key.split('-',1)[1]
 if key.startswith('sprite-'):
  # Normalize each equally spaced cell to a padded 128x160 destination.
  atlas=Image.new('RGBA',(384,640));cw,ch=im.width/3,im.height/4
  for y in range(4):
   for x in range(3):
    frame=im.crop((round(x*cw),round(y*ch),round((x+1)*cw),round((y+1)*ch)))
    frame.thumbnail((124,152),Image.Resampling.LANCZOS)
    atlas.alpha_composite(frame,(x*128+(128-frame.width)//2,y*160+(160-frame.height)//2))
  dest=R/'assets/crew'/f'{name}.webp';temp=Path(tempfile.gettempdir())/('skuldlab-'+uuid.uuid4().hex+'.webp');atlas.save(temp,'WEBP',quality=88,method=6);shutil.copyfile(temp,dest)
 else:
  im.thumbnail((1600 if name=='lab' else 1280,1000),Image.Resampling.LANCZOS)
  dest=(R/'assets'/f'device-{name}.webp') if key.startswith('device-') else ((R/'assets'/f'{name}.webp') if key.startswith('gen-') and name!='lab' else (R/'assets/generated'/f'{name}.webp'));temp=Path(tempfile.gettempdir())/('skuldlab-'+uuid.uuid4().hex+'.webp');im.save(temp,'WEBP',quality=79,method=6);shutil.copyfile(temp,dest)
 # Keep a reproducible, safe provenance record without local source paths.
 rows.append({'asset':str(dest.relative_to(R)),'kind':'AI-generated directional atlas' if key.startswith('sprite-') else 'AI-generated environment','source_png_bytes':original,'webp_bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'layout':{'columns':3,'rows':4,'frameWidth':128,'frameHeight':160} if key.startswith('sprite-') else None})
old_file=R/'docs/asset-manifest.json'
if old_file.exists():
 for row in json.loads(old_file.read_text()):
  if row['kind']=='Reused reference directional atlas' and not any(r['asset']==row['asset'] for r in rows):rows.append(row)
(R/'docs/asset-manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'assets':len(rows),'source_png_bytes':sum(r.get('source_png_bytes',0) for r in rows),'webp_bytes':sum(r['webp_bytes'] for r in rows)},indent=2))
