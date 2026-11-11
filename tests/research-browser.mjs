// Run with a local server rooted at the checkout and Playwright with Chromium installed.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium} = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://127.0.0.1:4178/';
const browser = await chromium.launch({
 executablePath: process.env.SKULDLAB_CHROMIUM || undefined,
 args:['--no-sandbox'],
});
const errors = [];
const watch = page => page.on('pageerror', error => errors.push(error.message));
const click = (page,id) => page.locator('#'+id).click();
const waitText = (page,id,text) => page.waitForFunction(([id,text]) => document.getElementById(id)?.textContent.includes(text),[id,text]);
const backupFile = (page, contents) => page.locator('#backup-file').setInputFiles({
 name:'backup.json',mimeType:'application/json',buffer:Buffer.from(contents)
});
try {
 const context = await browser.newContext({viewport:{width:1440,height:900}});
 const page = await context.newPage();
 watch(page);
 await page.goto(url);
 await page.waitForFunction(() => !!window.skuldLabSnapshot);
 await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
 await click(page,'save-blueprint');
 await waitText(page,'passport-count','1 / 6');
 await page.locator('#prototype-balance').fill('0');
 await click(page,'test-blueprint');
 await waitText(page,'prototype-result','안전 정지');
 await page.locator('#prototype-balance').fill('55');
 await click(page,'test-blueprint');
 await waitText(page,'prototype-result','시험 통과');

 await page.locator('[aria-label="로봇 제작실 입장"]').click();
 await page.waitForFunction(() => document.querySelector('#module-art').naturalWidth === 1672);
 await click(page,'module-close');
 assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '로봇 제작실 입장');
 await click(page,'brief-flight');
 await page.locator('#voyage-select').selectOption('0');
 await click(page,'research-launch');
 await page.locator('#voyage-speed').fill('1.5');
 await page.locator('#research-return').scrollIntoViewIfNeeded();
 await page.locator('#voyage-wrap').scrollIntoViewIfNeeded();
 await page.waitForFunction(() => !document.querySelector('#research-return').disabled, undefined, {timeout:60000});
 await click(page,'research-return');
 await waitText(page,'research-rewards','귀환 1회');
 await waitText(page,'research-log','성운');
 await page.reload();
 await waitText(page,'research-rewards','귀환 1회');
 await context.setOffline(true);
 await page.reload();
 await waitText(page,'research-rewards','귀환 1회');
 await context.setOffline(false);
 console.log('PASS: blank profile, design save, failed and passed tests, HD artwork, focus return, real-time flight and offline journal');

 const legacy = await browser.newContext();
 const first = await legacy.newPage(), second = await legacy.newPage();
 watch(first);watch(second);
 const design = {id:'legacy-1',created:'2026-11-11T14:00:00.000Z',name:'이전 설계',chassis:'banpei',core:'solar',module:'shield',stats:[60,98,52]};
 const keys = ['skuld_lab_blueprints_v1','skuld_lab_likes_v1','skuld_passport_v2'];
 const values = [[design],['banpei-head'],{done:['blueprint'],best:2}];
 await first.addInitScript(([keys,values]) => {
  for (const [i,key] of keys.entries()) if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify(values[i]));
 },[keys,values]);
 await first.goto(url);
 await waitText(first,'saved-blueprints','이전 설계');
 await second.goto(url);
 await waitText(second,'saved-blueprints','이전 설계');
 await Promise.all([click(first,'save-blueprint'),click(second,'save-blueprint')]);
 await first.waitForFunction(() => document.querySelectorAll('#saved-blueprints .saved-entry').length === 3);
 await second.waitForFunction(() => document.querySelectorAll('#saved-blueprints .saved-entry').length === 3);
 assert.equal(await first.evaluate(key=>JSON.parse(localStorage.getItem(key)).length,keys[0]),1);
 await click(first,'lab-help');
 await backupFile(first,'{');
 await waitText(first,'backup-status','JSON 형식');
 assert.equal(await first.locator('#backup-restore').isDisabled(),true);
 const data = JSON.stringify({format:'skuldlab-research-backup',version:1,records:Object.fromEntries(keys.map((k,i)=>[k,JSON.stringify(values[i])]))});
 await backupFile(first,data);
 await waitText(first,'backup-status','미리보기');
 await click(second,'save-blueprint');
 await second.waitForFunction(() => document.querySelectorAll('#saved-blueprints .saved-entry').length === 4);
 await click(first,'backup-restore');
 await waitText(first,'backup-status','미리보기 이후');
 await backupFile(first,data);
 await waitText(first,'backup-status','미리보기');
 await Promise.all([first.waitForEvent('domcontentloaded'),click(first,'backup-restore')]);
 await waitText(first,'saved-blueprints','이전 설계');
 assert.equal(await first.locator('#saved-blueprints .saved-entry').count(),1);
 console.log('PASS: legacy copy, simultaneous tab writes, invalid file, stale preview rejection and explicit restore');

 for (const width of [1440,768,390,320]) {
  const layout = await browser.newContext({viewport:{width,height:900}, reducedMotion:'reduce', hasTouch:width<768, serviceWorkers:'block'});
  const tab = await layout.newPage();
  watch(tab);
  await tab.goto(url);
  await tab.waitForFunction(() => !!window.skuldLabSnapshot);
  for (const id of ['living-lab','workshop','records']) {
   await tab.locator('#'+id).scrollIntoViewIfNeeded();
   assert.equal(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),true, `overflow at ${width}: ${id}`);
  }
  await click(tab,'test-blueprint');
  await waitText(tab,'prototype-result','시험 통과');
  await click(tab,'brief-flight');
  await click(tab,'voyage-manual');
  assert.equal(await tab.locator('#voyage-pad').isVisible(),true);
  assert.equal(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),true, `voyage overflow at ${width}`);
  await layout.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 1440/768/390/320px map, workshop, trial, flight controls and journal with reduced motion');
} finally {await browser.close();}
