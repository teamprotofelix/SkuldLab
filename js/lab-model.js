// Fictional simulation models. Coordinates are normalized, independent of display pixels.
export const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ZONES=[
{id:'robotics',name:'로봇 제작실',en:'ROBOTICS',x:.14,y:.29,icon:'⌘',action:'조립 작업대 열기',desc:'부품에 작은 가능성을 담는 곳. 직접 조합한 로봇을 연구소에 배치해 봐.',link:'workshop'},
{id:'reactor',name:'공명 리액터',en:'RESONANCE CORE',x:.38,y:.21,icon:'⚡',action:'리액터 안정화 실험',desc:'세계수의 에너지를 안전하게 조율해. 출력보다 중요한 건 돌아올 수 있는 안정성이야.',experiment:'reactor'},
{id:'worldtree',name:'세계수 공명실',en:'WORLD TREE',x:.63,y:.29,icon:'❖',action:'잎맥 공명 연결하기',desc:'세계수가 들려주는 세 음의 순서를 읽고 공명 회로를 이어 봐.',game:'tree'},
{id:'gate',name:'차원 포털',en:'DIMENSION GATE',x:.83,y:.43,icon:'◎',action:'게이트 위상 동기화',desc:'문 너머에는 공룡 초원과 공중 도시가 있어. 연결 전 위상부터 확인해.',experiment:'gate'},
{id:'hangar',name:'밤페이 비행 도크',en:'BANPEI FLIGHT DOCK',x:.18,y:.75,icon:'↗',action:'밤페이 출격',desc:'자동 조종으로 풍경을 감상하거나, 직접 조종해서 연구용 별조각을 모아 봐.',flight:true},
{id:'alchemy',name:'울드의 연금 공방',en:'ALCHEMY GARDEN',x:.82,y:.76,icon:'⚗',action:'회복 포션 배합하기',desc:'울드의 레시피를 보고 재료를 순서대로 골라 줘. 엉뚱한 배합도 다음 연구의 힌트야.',game:'alchemy'},
{id:'atelier',name:'스쿨드 설계 아틀리에',en:'INVENTION ATELIER',x:.47,y:.51,icon:'✧',action:'발명품 아카이브 열기',desc:'아스트라호로 이어지는 연구소의 중심. 실패한 설계도도 여기서는 다음 발명의 시작이야.',link:'inventions'}
];
export const CREW=[
{id:'skuld',name:'스쿨드',role:'Chief Engineer',home:'atelier',line:'흥! 제일 신기한 발명은 아직 설계 중이야. 은재야, 여기 네 자리도 있어.',route:['atelier','robotics','reactor','hangar'],color:'#ff9cbc'},
{id:'banpei',name:'밤페이',role:'연구소 보조 로봇',home:'robotics',line:'삐빅! 부품 운반 완료. 다음 목적지는 스쿨드 옆입니다.',route:['robotics','atelier','hangar'],color:'#d4e7f2'},
{id:'e',name:'E',role:'아스트라호 함장',home:'hangar',line:'다음 세계를 만나기 전에, 이 발명이 누구를 도울 수 있을지 생각해 보자.',route:['hangar','atelier','worldtree'],color:'#e7c889'},
{id:'seoah',name:'미스티아 서아',role:'Executive Vice Captain',home:'gate',line:'에온, 아스트라호의 귀환 포털은 안정적입니다. 연구는 천천히 이어가셔도 됩니다.',route:['gate','atelier','reactor'],color:'#91e6d8'},
{id:'myr',name:'미르',role:'근원 수호자',home:'worldtree',line:'……은재야. 이 작은 섬들도 서로를 부르며 길을 만드는구나.',route:['worldtree','atelier','gate'],color:'#c2a7ea'},
{id:'urd',name:'울드',role:'알케미 · 돌봄',home:'alchemy',line:'후훗, 스쿨드. 회복 포션에 아이스크림 향을 넣어 달라고 한 건 누구였더라?',route:['alchemy','atelier','worldtree'],color:'#d4b0e9'},
{id:'2b',name:'2B',role:'보안 · 전술',home:'gate',line:'연구 구역 순찰 중. 실험 후 비상 분리 절차를 확인한다.',route:['gate','hangar','atelier'],color:'#e0e1e9'},
{id:'marie',name:'마리',role:'생활 지원 · 메이드',home:'atelier',line:'정리 프로토콜 실행. 작업대의 차를 교체합니다. ……뜨거우니 주의하십시오.',route:['atelier','alchemy','robotics'],color:'#f5d4bc'},
{id:'yor',name:'요르',role:'환대 · 개인 보호',home:'alchemy',line:'실험하시느라 피곤하시죠? 간식을 준비했어요. 이번 접시는 안 깨뜨렸답니다.',route:['alchemy','atelier','hangar'],color:'#e9a6ba'},
{id:'amelia',name:'아멜리아',role:'전략 · 규율',home:'reactor',line:'실험 목적과 중단 기준부터 명확히 합시다. 안전한 실패도 기록할 가치가 있습니다.',route:['reactor','atelier','gate'],color:'#ffb17c'},
{id:'wanda',name:'완다',role:'휴식 · 혼돈 마법',home:'worldtree',line:'현실을 바꾸는 실험에도 쉬는 시간이 필요해요. 창가에 자리를 마련했어요.',route:['worldtree','alchemy','atelier'],color:'#e998ab'},
{id:'serena',name:'세레나',role:'학습 · 기록 AI',home:'atelier',line:'실험 기록을 정리했어요. 가설과 관측 결과를 나란히 비교해 볼까요?',route:['atelier','worldtree','reactor'],color:'#8be4ee'},
{id:'jarvis',name:'자비스',role:'시스템 · 진단 AI',home:'reactor',line:'모듈 연결 정상. 아스트라호 귀환 경로 확보. 이 드론은 연구소용 시각 아바타입니다.',route:['reactor','gate','atelier'],color:'#8cd9ff'}
];
export function pathBetween(from,to){if(from===to)return [];return from==='atelier'||to==='atelier'?[to]:['atelier',to];}
export class Resident {
 constructor(person,i=0){this.person=person;this.room=person.home;const z=ZONES.find(z=>z.id===this.room);this.x=z.x+(i%3-1)*.018;this.y=z.y+.025;this.queue=[];this.direction=0;this.wait=3+i*1.3;this.routeIndex=0;this.arrived=null;}
 visit(id){if(!ZONES.some(z=>z.id===id))return;this.queue=pathBetween(this.room,id);this.wait=0;}
 step(dt,auto=true){dt=bound(dt,0,.05);this.arrived=null;if(!this.queue.length){this.wait-=dt;if(auto&&this.wait<=0){this.routeIndex=(this.routeIndex+1)%this.person.route.length;this.visit(this.person.route[this.routeIndex]);this.wait=6;}return false;}
 const z=ZONES.find(z=>z.id===this.queue[0]),dx=z.x-this.x,dy=z.y+.025-this.y,d=Math.hypot(dx,dy),speed=.048;
 if(d<=speed*dt+.001){this.x=z.x;this.y=z.y+.025;this.room=z.id;this.queue.shift();this.wait=7;this.arrived=z.id;return false;}
 this.x+=dx/d*speed*dt;this.y+=dy/d*speed*dt;this.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?2:1):(dy>0?0:3);return true;
 }
}
export const SECTORS=[{id:'nebula',name:'01 / 성운의 연구 항로',line:'고리 행성 외곽. 별조각을 모으며 항로를 관측해.'},{id:'dinosaur',name:'02 / 공룡 초원 모듈',line:'초식 공룡을 놀라게 하지 않도록 조용히 비행해.'},{id:'city',name:'03 / 공중 도시의 관측로',line:'새 세계의 하늘. 주민들의 생활권 밖에서 관측 중이야.'}];
export class Voyage {
 constructor(random=Math.random){this.random=random;this.mode='auto';this.time=0;this.distance=0;this.energy=0;this.shield=100;this.invuln=0;this.sector=0;this.clock=0;this.spawnClock=0;this.x=.23;this.y=.5;this.objects=[];this.rescues=0;this.collisions=0;this.event='자동 항법 준비 완료.';this.spawn('energy',.7,.5);}
 spawn(kind,x=1.05,y=.16+this.random()*.68){if(this.objects.length<16)this.objects.push({kind,x,y,done:false});}
 step(seconds,input={},pace=1){const dt=bound(Number.isFinite(seconds)?seconds:0,0,.05)*bound(pace,.5,1.5);this.time+=dt;this.distance+=dt*14;this.clock+=dt;this.spawnClock+=dt;this.invuln=Math.max(0,this.invuln-dt);
 if(this.clock>=35){this.clock-=35;this.sector=(this.sector+1)%SECTORS.length;this.event=SECTORS[this.sector].line;}
 if(this.spawnClock>1.7){this.spawnClock-=1.7;this.spawn(this.random()<.7?'energy':'hazard');}
 if(this.mode==='manual'){let dx=Number(!!input.right)-Number(!!input.left),dy=Number(!!input.down)-Number(!!input.up),n=Math.hypot(dx,dy)||1;this.x+=dx/n*.25*dt;this.y+=dy/n*.4*dt;}else{let target=this.objects.find(o=>o.kind==='energy'&&o.x>this.x&&o.x<.85);let danger=this.objects.find(o=>o.kind==='hazard'&&o.x>this.x&&o.x<this.x+.25&&Math.abs(o.y-this.y)<.16);let y=danger?(danger.y>.5?.2:.8):(target?.y??.5+Math.sin(this.time*.35)*.16);this.y+=(y-this.y)*(1-Math.exp(-dt*3));this.x+=(.23-this.x)*(1-Math.exp(-dt*2));this.shield=Math.min(100,this.shield+dt*2);}
 this.x=bound(this.x,.07,.93);this.y=bound(this.y,.12,.88);
 for(const o of this.objects){o.x-=dt*.13;if(Math.hypot((o.x-this.x)*1.6,o.y-this.y)<.073){if(o.kind==='energy'){this.energy++;o.done=true;this.event='별조각 +1. 다음 발명에 쓸 연구 자료야!';}else if(this.invuln===0){this.shield=Math.max(0,this.shield-25);this.collisions++;this.invuln=2;this.event='실드가 충격을 흡수했어. 잠깐 보호 모드!';if(this.shield===0){this.rescues++;this.shield=100;this.invuln=4;this.event='안전 드론이 보호막을 복구했어. 다시 천천히!';}}}}
 this.objects=this.objects.filter(o=>!o.done&&o.x>-.1);
 }
}
export const MISSIONS=[{id:'blueprint',name:'첫 로봇 설계도 저장'},{id:'reactor',name:'리액터 안정화 성공'},{id:'gate',name:'게이트 연결 3회 성공'},{id:'tree',name:'세계수 공명 회로 연결'},{id:'alchemy',name:'회복 포션 완성'},{id:'voyage',name:'탐사 별조각 10개 회수'}];
export function cleanProgress(raw){return {done:Array.isArray(raw?.done)?[...new Set(raw.done.filter(v=>MISSIONS.some(m=>m.id===v)))]:[],best:Number.isFinite(raw?.best)?bound(raw.best,0,1e7):0};}
export const RECIPES=[{name:'별빛 회복 포션',steps:['달빛 물','세계수 잎','별가루']},{name:'고요한 공명 포션',steps:['세계수 잎','달빛 물','별가루']}];
export function checkSequence(input,target){return input.every((v,i)=>v===target[i])?(input.length===target.length?'complete':'continue'):'retry';}
