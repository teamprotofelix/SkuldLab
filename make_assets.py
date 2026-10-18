from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, random, io, os
from pathlib import Path
P=Path(__file__).parent/'assets'; P.mkdir(exist_ok=True)
random.seed(821)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def interp(a,b,t):return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def grad(w,h,top,bottom):
 im=Image.new('RGB',(w,h)); px=im.load()
 for y in range(h):
  t=y/(h-1); t=t*t*(3-2*t)
  c=interp(top,bottom,t)
  for x in range(w):px[x,y]=c
 return im
def glow(im,x,y,r,color,power=140):
 lay=Image.new('RGBA',im.size);d=ImageDraw.Draw(lay)
 d.ellipse((x-r,y-r,x+r,y+r),fill=(*color,power))
 lay=lay.filter(ImageFilter.GaussianBlur(max(7,r//2)))
 im.alpha_composite(lay)
def polygon(d, pts, fill, outline=None,width=1):
 d.polygon(pts, fill=fill)
 if outline:d.line(pts+[pts[0]], fill=outline,width=width,joint='curve')
def scene(name, seed, theme, w=1536,h=864):
 rng=random.Random(seed); accent=theme['accent']; second=theme['second'];
 im=grad(w,h,tuple(theme['top']),tuple(theme['bottom'])).convert('RGBA')
 d=ImageDraw.Draw(im,'RGBA')
 # cosmic window: large elliptical arch and panes
 d.rounded_rectangle((95,42,w-94,h*.63),radius=65,fill=(5,12,32,255),outline=(*accent,90),width=8)
 # star clusters inside window
 for _ in range(270):
  x=rng.randrange(105,w-110); y=rng.randrange(52,int(h*.61));rad=rng.choice([1,1,1,2,2,3]);c=rng.choice([(155,200,255,140),(250,230,255,190),(*second,150)]);d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=c)
 # planets / purple nebula
 for i in range(8):
  x=rng.randint(150,w-150); y=rng.randint(60,370);r=rng.randint(30,100)
  glow(im,x,y,r,rng.choice([accent,second,(79,83,230)]),55)
 d=ImageDraw.Draw(im,'RGBA')
 cx=int(w*.72) if name=='hero' else int(w*.66)
 cy=192
 d.ellipse((cx-75,cy-75,cx+75,cy+75),fill=(*second,80),outline=(*accent,170),width=3)
 d.arc((cx-76,cy-76,cx+76,cy+76),25,245,fill=(255,255,255,160),width=5)
 # glass panels and structural window beams
 for k in range(1,5):
  x=int(95+(w-190)*k/5);d.line([(x,42),(x-15,535)],fill=(24,55,93,220),width=20)
  d.line([(x+4,42),(x-11,535)],fill=(*accent,90),width=2)
 d.line([(98,530),(w-95,530)],fill=(*second,130),width=10)
 # hanging light rigs
 for x in [130,410,720,1070,1400]:
  d.line([(x,0),(x,70)],fill=(48,75,112,255),width=9)
  d.rounded_rectangle((x-64,69,x+64,83),radius=5,fill=(37,65,100,255),outline=(*accent,220),width=2)
  glow(im,x,80,38,accent,140)
 d=ImageDraw.Draw(im,'RGBA')
 # grand perspective floor
 polygon(d,[(0,555),(w,555),(w,h),(0,h)],fill=(13,22,42,255))
 for j in range(12):
  t=j/11; yy=int(556+(h-556)*t*t)
  d.line([(0,yy),(w,yy)],fill=(*accent,round(22+55*t)),width=2)
 for k in range(-10,11):
  x0=int(w/2+k*55);x1=int(w/2+k*250)
  d.line((x0,556,x1,h),fill=(*accent,35),width=2)
 # lab desks and upright displays either side
 for side in [-1,1]:
  base=(210 if side<0 else 1180)
  d.rounded_rectangle((base-155,455,base+155,670),radius=18,fill=(17,33,62,255),outline=(*accent,130),width=4)
  d.rounded_rectangle((base-140,469,base+140,585),radius=12,fill=(7,21,49,255),outline=(*second,150),width=3)
  for i in range(5):
   xx=base-110+i*48; yy=500+rng.randint(-12,12)
   d.line([(xx,552),(xx,yy)],fill=(*accent,190),width=5)
   d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=(255,238,239,230))
  d.polygon([(base-175,655),(base+175,655),(base+220,725),(base-217,725)], fill=(30,46,75,255))
  d.line([(base-180,652),(base+180,652)],fill=(*accent,210),width=5)
  for i in range(7):
   x=base-100+i*33; d.rounded_rectangle((x,673,x+20,681),radius=3,fill=(*accent,170))
 # central reactor/tree/gate
 center=(w//2 if name=='hero' else int(w*.53));
 if name in ['hero','worldtree']:
  glow(im,center,300,175,(75,210,185),135)
  d=ImageDraw.Draw(im,'RGBA')
  # tree trunk
  polygon(d,[(center-36,600),(center-16,340),(center+13,305),(center+35,594)],(70,152,148,255),(176,252,230,240),5)
  # curved branches
  for n in range(7):
   yy=300+n*26; xp=center+(-1 if n%2 else 1)*(110+n*10)
   d.arc((min(center,xp),yy-45,max(center,xp),yy+80),180 if xp<center else 260,350 if xp<center else 450,fill=(99,228,193,225),width=8)
  for i in range(56):
   a=rng.uniform(0,math.pi*2); rad=rng.uniform(35,190);x=int(center+math.cos(a)*rad);y=int(265+math.sin(a)*rad*.65)
   r=rng.randint(7,23);d.ellipse((x-r,y-r,x+r,y+r),fill=(*rng.choice([accent,second,(116,247,190)]),rng.randint(70,180)))
 else:
  glow(im,center,327,168,accent,120)
  d=ImageDraw.Draw(im,'RGBA')
  for r in (164,132,95,66):
   d.ellipse((center-r,330-r,center+r,330+r),outline=(*accent,100+(165-r)//2),width=6)
  for i in range(20):
   a=2*math.pi*i/20; r=141
   x=int(center+math.cos(a)*r);y=int(330+math.sin(a)*r)
   d.ellipse((x-5,y-5,x+5,y+5),fill=(*second,230))
  d.regular_polygon((center,330,78),6,rotation=30, fill=(*second,70))
 # high tech central walkway
 d=ImageDraw.Draw(im,'RGBA')
 polygon(d,[(center-220,570),(center+220,570),(center+340,h),(center-340,h)],(18,36,65,255),(*accent,110),4)
 for y in [610,666,738,822]:
  inset=(y-570)*.42
  d.line([(center-210-inset,y),(center+210+inset,y)],fill=(*accent,90),width=3)
 # brandless holographic icons
 for x,y in [(420,280),(1090,265),(940,140)]:
  d.rounded_rectangle((x-42,y-35,x+42,y+35),radius=13,outline=(*accent,150),width=3,fill=(11,33,63,70))
  d.ellipse((x-15,y-15,x+15,y+15),outline=(*second,190),width=4)
 # atmospheric overlay gradient
 dust=Image.new('RGBA',im.size); dd=ImageDraw.Draw(dust,'RGBA')
 for i in range(24):
  x=rng.randint(0,w);y=rng.randint(90,h-50);r=rng.randint(1,4);dd.ellipse((x-r,y-r,x+r,y+r),fill=(*accent,145))
 im.alpha_composite(dust)
 im=im.convert('RGB'); im.save(P/f'{name}.webp','WEBP',quality=81,method=6)
 return im
THEMES={
 'hero':dict(top=(5,13,40),bottom=(30,12,50),accent=(108,234,255),second=(255,115,177)),
 'robotics':dict(top=(7,12,43),bottom=(45,19,46),accent=(255,125,176),second=(117,231,255)),
 'reactor':dict(top=(5,20,39),bottom=(7,35,48),accent=(70,228,214),second=(255,199,93)),
 'worldtree':dict(top=(5,26,36),bottom=(22,40,55),accent=(113,236,167),second=(94,192,242)),
 'hangar':dict(top=(8,19,41),bottom=(35,27,57),accent=(248,164,109),second=(151,163,253)),
 'gate':dict(top=(17,13,45),bottom=(46,13,72),accent=(182,124,255),second=(101,226,243)),
}
for k,v in THEMES.items():scene(k,2026+len(k)*11,v)

# invented device cards, illustrations rendered as transparent neon holographic design
DEVICES=[
 ('banpei-head',(255,129,165),'bunny'),('guardian-link',(105,203,246),'shield'),('yggdrasil-core',(98,232,162),'tree'),('pocket-gate',(185,139,255),'portal'),('stellar-drone',(255,199,99),'drone'),('dino-beacon',(116,226,204),'beacon'),('emotion-sensor',(255,148,195),'heart'),('gravity-loom',(113,177,255),'atom')]
for idx,(key,ac,typ) in enumerate(DEVICES):
 w,h=640,420;rr=random.Random(idx+31)
 im=grad(w,h,(15,23,52),(38,30,65)).convert('RGBA')
 glow(im,w//2,h//2,170,ac,95)
 d=ImageDraw.Draw(im,'RGBA')
 for r in range(50,290,34):d.ellipse((w/2-r,h/2-r*.66,w/2+r,h/2+r*.66),outline=(*ac,max(25,90-r//4)),width=2)
 for k in range(9):
  x=80+50*k;d.line((x,40,x,380),fill=(*ac,28),width=1)
 for y in range(50,400,38):d.line((60,y,580,y),fill=(*ac,27),width=1)
 cx,cy=320,210
 if typ=='bunny':
  d.rounded_rectangle((220,154,420,325),radius=75,fill=(245,236,247,255),outline=(71,86,133,255),width=10)
  for x in (264,375):
   d.rounded_rectangle((x-26,70,x+20,195),radius=24,fill=(255,248,254,255),outline=(95,99,145,255),width=7)
   d.rounded_rectangle((x-13,85,x+8,158),radius=10,fill=(*ac,200))
  for x in (273,367):d.ellipse((x-12,214,x+12,240),fill=(30,60,94,255))
  d.arc((289,235,351,280),5,170,fill=(54,76,100,255),width=6)
  for x in (211,422):d.ellipse((x-24,236,x+24,288),fill=(229,229,245,255),outline=(*ac,170),width=5)
 elif typ=='shield':
  polygon(d,[(cx,68),(448,125),(428,260),(cx,350),(211,260),(192,125)],(45,84,123,250),(*ac,255),11)
  polygon(d,[(cx,96),(410,137),(392,251),(cx,318),(245,251),(231,137)],(22,47,80,255),(*ac,100),3)
  d.line((cx,135,cx,280),fill=(*ac,230),width=20);d.line((266,205,374,205),fill=(*ac,230),width=20)
 elif typ=='tree':
  d.line((cx,320,cx,175),fill=(185,239,184,255),width=20)
  for i in range(11):
   a=i*math.pi*2/11;x=int(cx+100*math.cos(a));y=int(169+78*math.sin(a))
   d.line((cx,219,x,y),fill=(*ac,235),width=9)
   d.ellipse((x-23,y-23,x+23,y+23),fill=(*ac,195),outline=(215,255,239,255),width=3)
  d.ellipse((288,292,352,342),fill=(92,189,175,255),outline=(*ac,255),width=7)
 elif typ=='portal':
  for r in (145,116,87,54):d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(*ac,245 if r%2 else 170),width=15 if r==145 else 6)
  d.ellipse((cx-42,cy-42,cx+42,cy+42),fill=(*ac,190))
  for k in range(10):
   a=k*math.pi/5;x=cx+160*math.cos(a);y=cy+160*math.sin(a);d.ellipse((x-6,y-6,x+6,y+6),fill=(254,250,250,230))
 elif typ=='drone':
  d.rounded_rectangle((235,166,405,270),radius=45,fill=(226,242,244,255),outline=(*ac,255),width=7)
  for x in (195,445):
   d.ellipse((x-53,145,x+53,220),fill=(65,98,133,255),outline=(*ac,245),width=8)
   d.ellipse((x-16,165,x+16,198),fill=(242,241,247,255))
  d.rounded_rectangle((290,195,354,235),radius=18,fill=(35,61,97,255));d.ellipse((313,208,335,230),fill=(*ac,255))
 elif typ=='beacon':
  d.rounded_rectangle((278,150,365,323),radius=28,fill=(220,246,231,255),outline=(*ac,240),width=8)
  d.ellipse((291,91,351,169),fill=(*ac,190),outline=(241,255,254,230),width=4)
  for r in (90,137):d.arc((cx-r,120-r*.5,cx+r,225+r*.5),190,350,fill=(*ac,130),width=6)
  d.regular_polygon((cx,227,24),3,rotation=0,fill=(41,100,110,255))
 elif typ=='heart':
  d.polygon([(cx,325),(190,196),(200,150),(243,117),(291,125),(cx,160),(349,125),(397,117),(440,160),(447,211)],fill=(*ac,170))
  d.line([(215,216),(262,216),(286,182),(311,270),(344,195),(364,216),(414,216)],fill=(235,255,255,250),width=10,joint='curve')
 else:
  for r in (52,110,153): d.ellipse((cx-r,cy-r*.56,cx+r,cy+r*.56),outline=(*ac,235),width=8)
  for angle in (-55,0,55):
   d.arc((cx-160,cy-90,cx+160,cy+90),angle,angle+230,fill=(*ac,230),width=7)
  d.ellipse((cx-28,cy-28,cx+28,cy+28),fill=(*ac,255))
 im.convert('RGB').save(P/f'device-{key}.webp','WEBP',quality=83,method=6)

# sprite sheets anime-styled chibi engineer, antialias 2x
S=3;fw=128;fh=174
sheet=Image.new('RGBA',(fw*8*S,fh*2*S),(0,0,0,0))
outline=(37,40,75,255)
for j in range(2):
 for k in range(8):
  frame=j*8+k; W,H=fw*S,fh*S
  im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im)
  def pt(a,b):return (int(a*S),int(b*S))
  def ell(box,fill,ol=None,wd=1):d.ellipse(tuple(int(v*S) for v in box),fill=fill,outline=ol,width=wd*S)
  def rect(box,fill,ol=None,wd=1,rad=0):d.rounded_rectangle(tuple(int(v*S) for v in box),radius=rad*S,fill=fill,outline=ol,width=wd*S)
  shift=[0,1,1,-1,-1,0,1,-1][k]; bob=[0,-2,-1,1,0,-2,-6,0][k]
  # long twin tail ribbons and hair swinging
  for side in (-1,1):
   tx=64+side*34; wig=([0,6,-2,3,-3,0,5,-4][k])*side
   d.line((pt(tx,49+bob),pt(tx+side*12+wig,102+bob)),fill=outline,width=20*S)
   d.line((pt(tx,49+bob),pt(tx+side*12+wig,99+bob)),fill=(33,40,67,255),width=14*S)
   ell((tx-8,43+bob,tx+8,62+bob),(255,116,160,255),outline,2)
  # legs shoes
  for side in (-1,1):
   foot=side*12; offset=(4 if (k%4<2) ^ (side<0) else -4) if k in (1,2,3,4) else 0
   d.line((pt(64+foot,126+bob),pt(64+foot+offset,154+bob)),fill=(36,51,86,255),width=13*S)
   rect((64+foot-12+offset,148+bob,64+foot+13+offset,159+bob),(67,54,99,255),outline,2,5)
  # apron/body
  rect((37,88+bob,91,138+bob),(83,92,142,255),outline,3,17)
  d.polygon([pt(51,93+bob),pt(77,93+bob),pt(86,133+bob),pt(42,133+bob)],fill=(234,232,237,255))
  rect((51,105+bob,77,117+bob),(255,133,166,255),outline,2,4)
  # arms optional wrench
  d.line((pt(42,98+bob),pt(25,115+bob if k not in (4,6) else 79+bob)),fill=(246,208,186,255),width=12*S)
  d.line((pt(86,99+bob),pt(108,81+bob if k in (4,6,7) else 112+bob)),fill=(246,208,186,255),width=12*S)
  if k in (0,2,5,7):
   d.line((pt(110,112+bob),pt(117,74+bob)),fill=(183,220,245,255),width=5*S)
   d.arc((int(109*S),int((63+bob)*S),int(124*S),int((82+bob)*S)),30,320,fill=(137,234,251,255),width=5*S)
  # face / hair
  ell((35,25+bob,93,94+bob),(253,220,194,255),outline,3)
  d.pieslice((33*S,(21+bob)*S,95*S,(75+bob)*S),180,353,fill=(26,33,56,255))
  # bangs
  for xx in (41,56,73,84):d.polygon([pt(xx,28+bob),pt(xx+8,29+bob),pt(xx+3,51+bob)],fill=(25,31,54,255))
  # eyes
  for xx in (49,79):
   ell((xx-5,64+bob,xx+5,74+bob),(255,255,253,255));ell((xx-2,65+bob,xx+4,73+bob),(104,69,52,255));ell((xx,65+bob,xx+2,68+bob),(255,255,255,255))
  if k==5: d.arc((54*S,(75+bob)*S,74*S,(87+bob)*S),0,175,fill=(183,87,94,255),width=2*S)
  elif k in (6,7):d.ellipse((61*S,(79+bob)*S,67*S,(86+bob)*S),fill=(188,89,102,255))
  else:d.arc((59*S,(77+bob)*S,71*S,(85+bob)*S),5,150,fill=(160,78,90,255),width=2*S)
  for xx in (40,88):ell((xx-6,76+bob,xx+6,83+bob),(255,149,158,100))
  # goggles teal on head
  rect((45,23+bob,82,36+bob),(54,68,101,255),outline,3,6)
  for xx in (53,73):ell((xx-9,25+bob,xx+7,35+bob),(119,237,243,255),outline,2)
  # second row: workshop mode with different holoprojector/tool details
  if j==1:
   rect((101,90+bob,119,114+bob),(45,84,116,250),(115,235,248,255),2,5)
   ell((106,97+bob,115,106+bob),(104,243,229,250))
   if k in (1,3,5,7):
    for sx,sy in [(103,80),(115,71),(124,89)]:
     ell((sx-3,sy+bob-3,sx+3,sy+bob+3),(252,242,155,245))
   if k in (2,6):
    ell((54,79+bob,74,87+bob),(220,82,120,255))
  # highlight sparkle
  ell((83,42+bob,87,46+bob),(253,247,250,245))
  sheet.alpha_composite(im,(k*W,j*H))
sheet=sheet.resize((fw*8,fh*2),Image.Resampling.LANCZOS)
sheet.save(P/'skuld-sprites.webp','WEBP',quality=93,method=6,lossless=True)
# robot sprite sheet 8 wide x 1 high 120x120
fw2=122;fh2=128;ss=3
sh=Image.new('RGBA',(fw2*8*ss,fh2*ss))
for k in range(8):
 im=Image.new('RGBA',(fw2*ss,fh2*ss)); d=ImageDraw.Draw(im)
 def E(b,fill,ol=None,wd=2):d.ellipse(tuple(int(v*ss) for v in b),fill=fill,outline=ol,width=wd*ss)
 def R(b,fill,ol=None,wd=2,rad=10):d.rounded_rectangle(tuple(int(v*ss) for v in b),radius=rad*ss,fill=fill,outline=ol,width=wd*ss)
 bob=[2,0,-2,0,2,0,-4,0][k]
 # ears
 for xx in (38,85):R((xx-12,11+bob,xx+11,70+bob),(244,229,245,255),outline,3,9);R((xx-5,16+bob,xx+5,54+bob),(255,146,184,255),None,1,6)
 # body feet
 for xx in (45,80):R((xx-13,90+bob,xx+13,120+bob),(223,228,246,255),outline,3,8)
 E((15,42+bob,109,111+bob),(239,235,247,255),outline,4)
 E((28,54+bob,96,99+bob),(31,61,95,255))
 for xx in (45,77):E((xx-9,66+bob,xx+9,84+bob),((97,238,255,255) if k%2==0 else (255,151,185,255)))
 E((58,89+bob,66,95+bob),(253,156,180,255))
 # arm
 E((6,69+bob,28,94+bob),(232,229,242,255),outline); E((95,69+bob,118,94+bob),(232,229,242,255),outline)
 sh.alpha_composite(im,(k*fw2*ss,0))
sh.resize((fw2*8,fh2),Image.Resampling.LANCZOS).save(P/'banpei-sprites.webp','WEBP',lossless=True,method=6)
# icons
for dim in [192,512]:
 im=Image.new('RGBA',(dim,dim),(22,28,52,255)); d=ImageDraw.Draw(im)
 d.rounded_rectangle((dim*.12,dim*.12,dim*.88,dim*.88),radius=dim*.2,fill=(67,70,116),outline=(255,137,177),width=int(dim*.04))
 d.ellipse((dim*.25,dim*.3,dim*.75,dim*.76),fill=(254,220,236),outline=(37,40,75),width=int(dim*.03))
 for x in (.38,.63):d.ellipse((dim*(x-.045),dim*.49,dim*(x+.045),dim*.58),fill=(58,59,106))
 d.arc((dim*.42,dim*.56,dim*.59,dim*.68),0,170,fill=(245,96,150),width=int(dim*.022))
 im.save(P/f'icon-{dim}.png',optimize=True)
# metadata
print('\n'.join(f'{p.name}: {p.stat().st_size//1024} KB' for p in P.glob('*')))
