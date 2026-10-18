import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../js/pwa.js',import.meta.url),'utf8');
function signal(extra={}) {
  const listeners={};
  return Object.assign({
    addEventListener(name,fn){(listeners[name]??=[]).push(fn);},
    async fire(name,event={}){for(const fn of listeners[name]??[])await fn(event);}
  },extra);
}
function setup({standalone=false,ios=false}={}) {
  const elements={};
  for(const id of ['install-button','install-dialog','install-confirm','install-status','install-close','pwa-update'])
    elements[id]=signal({hidden:false,disabled:false,textContent:'',open:false,focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;this.fire('close');}});
  const media=signal({matches:standalone});
  const window=signal({matchMedia:()=>media,isSecureContext:false});
  const document={getElementById:id=>elements[id],activeElement:elements['install-button']};
  vm.runInNewContext(code,{window,document,navigator:{standalone:ios}});
  return {window,media,elements,button:elements['install-button'],dialog:elements['install-dialog'],action:elements['install-confirm'],status:elements['install-status']};
}
test('install help is available without a native browser prompt and restores focus',async()=>{
  const s=setup();assert.equal(s.button.hidden,false);assert.equal(s.action.hidden,true);
  await s.button.fire('click');assert.equal(s.dialog.open,true);
  await s.elements['install-close'].fire('click');assert.equal(s.dialog.open,false);assert.equal(s.button.focused,true);
});
test('native install prompt runs only on user click; acceptance is not prematurely claimed as installed',async()=>{
  const s=setup();let calls=0,prevented=false;
  await s.window.fire('beforeinstallprompt',{preventDefault(){prevented=true;},async prompt(){calls++;},userChoice:Promise.resolve({outcome:'accepted'})});
  assert.equal(prevented,true);assert.equal(calls,0);assert.equal(s.action.hidden,false);
  await s.action.fire('click');assert.equal(calls,1);assert.equal(s.action.hidden,true);assert.equal(s.button.hidden,false);assert.match(s.status.textContent,/요청/);
  await s.window.fire('appinstalled');assert.equal(s.button.hidden,true);assert.match(s.status.textContent,/설치 완료/);
});
test('dismissed install can receive a fresh prompt and retry',async()=>{
  const s=setup();let calls=0;
  const prompt={preventDefault(){},async prompt(){calls++;},userChoice:Promise.resolve({outcome:'dismissed'})};
  await s.window.fire('beforeinstallprompt',prompt);await s.action.fire('click');assert.match(s.status.textContent,/취소/);assert.equal(s.button.hidden,false);
  await s.window.fire('beforeinstallprompt',prompt);assert.equal(s.action.hidden,false);await s.action.fire('click');assert.equal(calls,2);
});
test('rejected install exposes menu guidance and releases busy state',async()=>{
  const s=setup();await s.window.fire('beforeinstallprompt',{preventDefault(){},async prompt(){throw Error('unavailable');}});
  await s.action.fire('click');assert.match(s.status.textContent,/브라우저 메뉴/);assert.equal(s.action.disabled,false);assert.equal(s.action.hidden,true);
});
test('standalone launch hides redundant install controls for Chromium and iOS',()=>{
  for(const flags of [{standalone:true},{ios:true}]){const s=setup(flags);assert.equal(s.button.hidden,true);assert.equal(s.action.hidden,true);}
});
test('display mode change updates install controls without reloading',async()=>{
  const s=setup();s.media.matches=true;await s.media.fire('change');assert.equal(s.button.hidden,true);
  s.media.matches=false;await s.media.fire('change');assert.equal(s.button.hidden,false);
});
