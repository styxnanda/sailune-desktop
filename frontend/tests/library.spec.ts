import {test,expect,type Page} from '@playwright/test';
async function choose(page:Page,label:string,option:string){await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();}
async function screenshot(page:Page,name:string){
 const dialog=page.getByRole('dialog');
 if(await dialog.count()){await expect(dialog).toHaveCount(1);await expect(dialog).toHaveCSS('opacity','1');}
 await page.screenshot({path:`test-results/${name}.png`,fullPage:!(await dialog.count()),animations:'disabled'});
}

test.beforeEach(async({page})=>{
 page.on('pageerror', error=>console.error('Browser error:',error.message));
 await page.addInitScript(()=>{
  const metadata={title:'The Cartographer’s Moon',authors:['Aster Vale'],summary:'An old map, an unexpected companion, and a journey beyond the edge of the known world.',fandoms:['Original Work'],tags:['Found Family','Adventure'],language:'English',rating:'Teen',words:42800,chapters:12,total_chapters:16,complete:false,published:'2026-08-01',updated:'2026-09-10'};
  let records:any[]=[{id:1,url:'https://archiveofourown.org/works/123',site:'ao3',title:metadata.title,author:'Aster Vale',status:'reading',chapter:4,tags:['weekend reading'],notes:'Pick up at the lighthouse.',rating:4,review_notes:'',created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-01T00:00:00Z',last_read_at:'2026-09-05T00:00:00Z',metadata,effective:metadata,progress:{known:true,read:4,published:12,unread:8,percent:33}}];
  records.push({...structuredClone(records[0]),id:2,title:'All the Light We Leave Behind',author:'paperboats',site:'ffn',status:'planned',chapter:0,rating:0,progress:{known:true,read:0,published:8,unread:8,percent:0}});
  records.push({...structuredClone(records[0]),id:3,title:'A Quiet Kind of Magic',author:'winterletters',status:'completed',chapter:12,rating:5,progress:{known:true,read:12,published:12,unread:0,percent:100}});
  (window as any).testCalls=[];
  (window as any).go={main:{App:{Copy:async(action:string,json:string)=>{(window as any).testCalls.push({action:'copy',kind:action,...JSON.parse(json)});},Confirm:async()=>true,Cancel:async()=>{},Pick:async()=>'',Open:async(action:string,json:string)=>{(window as any).testCalls.push({action:'open',kind:action,...JSON.parse(json)});},Call:async(action:string,json:string)=>{
   const r=JSON.parse(json);(window as any).testCalls.push({action,...r});
   if(action==='defaults')return JSON.stringify({Data:'/tmp/test/library.sqlite3',Sessions:'/tmp/test/sessions',UserAgent:''});
   if(action==='list')return JSON.stringify(records.filter(b=>(!r.Filter?.Query||b.title.includes(r.Filter.Query))&&(!r.Filter?.Status||b.status===r.Filter.Status)));
   if(action==='resolve')return JSON.stringify(`https://archiveofourown.org/works/123/chapters/${r.Chapter||5}`);
   if(action==='get')return JSON.stringify(records.find(b=>b.id===r.ID));
   if(action==='add'){
    if(r.Bookmark.url.includes('999'))throw new Error('Synthetic fetch failure; use offline mode.');
    const b={...r.Bookmark,id:4,site:'ffn',effective:metadata,progress:{known:false,read:0,published:0,unread:0,percent:0}};records.push(b);return JSON.stringify(b);
   }
   if(action==='update'){if((window as any).failUpdate)throw new Error('Synthetic save failure');const b=records.find(b=>b.id===r.ID);for(const [k,v] of Object.entries(r.Patch))b[k.toLowerCase()]=v;if(r.Patch.Chapter!==undefined){b.progress.read=b.chapter;b.progress.percent=b.chapter/b.progress.published*100;}return JSON.stringify(b);}
   if(action==='delete'){records=records.filter(b=>b.id!==r.ID);return 'null';}
   if(action==='session-status')return JSON.stringify({site:r.Site,configured:false,usable_cookies:0});
   return 'null';
  }}}};
 });
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true})).toBeVisible();
});

test('bookshelf and focused editing preserve untouched fields',async({page})=>{
 await screenshot(page,'library');
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Edit bookmark',exact:true}).click();
 await page.getByLabel('Notes',{exact:true}).fill('Changed locally');
 await screenshot(page,'editor');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'The Cartographer’s Moon',exact:true})).toBeVisible();
 const patch=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='update').Patch);
 expect(patch).toEqual({Notes:'Changed locally'});
 await screenshot(page,'story');
});

test('failed save keeps the draft, and offline save stays available',async({page})=>{
 await page.getByRole('button',{name:'Add story',exact:true}).click();
 await page.getByLabel('Story link',{exact:true}).fill('https://archiveofourown.org/works/999');
 await page.getByLabel('Title',{exact:true}).fill('Keep this draft');
 await page.getByRole('button',{name:'Save story',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Something went wrong');
 await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Keep this draft');
 await page.getByLabel('Story link',{exact:true}).fill('https://www.fanfiction.net/s/124/1');
 await page.getByLabel('Fetch details automatically').uncheck();
 await page.getByRole('button',{name:'Save story',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'Keep this draft',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as any).testCalls.filter((c:any)=>c.action==='add').at(-1).Fetch)).toBe(false);
});

test('removal requires confirmation and account connection requires consent',async({page})=>{
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Remove bookmark',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).testCalls.some((c:any)=>c.action==='delete'))).toBe(false);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await screenshot(page,'settings');
 await page.getByRole('button',{name:/Connected websites/}).click();
 await expect(page.getByRole('button',{name:'Connect account',exact:true})).toBeDisabled();
 await page.getByLabel('Allow access to this website’s sign-in').check();
 await page.getByRole('button',{name:'Connect account',exact:true}).click();
 const request=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='session-browser'));
 expect(request).toMatchObject({Consent:true,Browser:'chromium/chrome',Site:'ao3'});
 await screenshot(page,'connect');
});

test('search refinements keep the full core filter vocabulary',async({page})=>{
 await page.getByRole('button',{name:'Filters',exact:true}).click();
 await choose(page,'Website','FanFiction.net');
 await page.getByLabel('Author',{exact:true}).fill('Aster');
 await choose(page,'Completion','Still being written');
 await page.getByLabel('Unread chapters').check();
 await page.getByText('Length & rating',{exact:true}).click();
 await page.getByLabel('Minimum words',{exact:true}).fill('12000');
 await choose(page,'My rating','4 stars or more');
 await choose(page,'Sort by','Story updates');
 await page.getByRole('button',{name:'Apply filters',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const f=await page.evaluate(()=>(window as any).testCalls.filter((c:any)=>c.action==='list').at(-1).Filter);
 expect(f).toMatchObject({Site:'ffn',Author:'Aster',Complete:false,Unread:true,MinWords:12000,MinRating:4,Sort:'source-updated'});
});

test('zero-valued custom details and individual resets remain possible',async({page})=>{
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Edit bookmark',exact:true}).click();
 await page.getByText('Custom details',{exact:true}).click();
 await page.getByLabel('Words',{exact:true}).check();
 await page.getByLabel('My Words',{exact:true}).fill('0');
 await page.getByLabel('Finished story',{exact:true}).check();
 await choose(page,'My Finished story','Still being written');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 const p=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='update').Patch);
 expect(p).toMatchObject({ResetOverrides:'all',Overrides:{words:0,complete:false}});
});

test('dialogs support Escape and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Settings',exact:true})).toBeFocused();
});


test('click feedback bounces and honors reduced motion',async({page})=>{
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 const activeBounce=()=>page.evaluate(()=>document.getAnimations().some(a=>a.id==='press-feedback'));
 await page.getByRole('button',{name:'Save a backup',exact:true}).evaluate((button:HTMLButtonElement)=>button.click());
 expect(await activeBounce()).toBe(true);
 await page.waitForTimeout(350);
 await page.getByRole('dialog').getByRole('button',{name:'Settings',exact:true}).click();
 await page.waitForTimeout(350);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Save a backup',exact:true}).evaluate((button:HTMLButtonElement)=>button.click());
 expect(await activeBounce()).toBe(false);
});

test('compact window keeps controls reachable without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:640,height:680});
 await expect(page.getByRole('button',{name:'Add story',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await screenshot(page,'settings-compact');
 await expect(page.getByRole('button',{name:'Import collection',exact:true})).toBeVisible();
 expect(await page.getByRole('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});


test('card progress saves directly, supports jumps, and leaves other fields untouched',async({page})=>{
 const title='The Cartographer’s Moon';
 await page.getByRole('button',{name:`Next read chapter for ${title}`,exact:true}).click();
 const progress=page.getByRole('spinbutton',{name:`Last chapter read for ${title}`,exact:true});
 await expect(progress).toHaveValue('5');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await progress.fill('9');await progress.press('Enter');
 await expect(progress).toHaveValue('9');
 await expect.poll(()=>page.evaluate(()=>(window as any).testCalls.filter((c:any)=>c.action==='update').map((c:any)=>c.Patch))).toEqual([{Chapter:5},{Chapter:9}]);
 await page.getByRole('button',{name:`Previous read chapter for ${title}`,exact:true}).click();
 await expect(progress).toHaveValue('8');
});

test('chapter carousel resolves the selected chapter without marking it read',async({page})=>{
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Next chapter',exact:true}).click();
 await page.getByRole('button',{name:'Chapter 6 actions',exact:true}).click();
 await expect(page.getByRole('button',{name:'Next unread link',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Story link',exact:true})).toHaveCount(0);
 await expect(page.locator('.chapter-number')).toHaveText('6');
 await expect(page.getByRole('button',{name:'Next chapter',exact:true})).toHaveCSS('border-top-width','0px');
 await screenshot(page,'chapters');
 await page.getByRole('button',{name:'Get chapter 6 link',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Chapter or story link'})).toHaveValue('https://archiveofourown.org/works/123/chapters/6');
 await page.getByRole('button',{name:'Open chapter 6',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='open'))).toMatchObject({Chapter:6,Resume:false});
 expect(await page.evaluate(()=>(window as any).testCalls.some((c:any)=>c.action==='update'))).toBe(false);
 await page.getByRole('button',{name:'Jump to',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Jump to chapter'}).fill('12');
 await page.getByRole('button',{name:'Go',exact:true}).click();
 await expect(page.getByRole('button',{name:'Next chapter',exact:true})).toBeDisabled();
});

test('theme persists and custom selects support keyboard selection and Escape',async({page})=>{
 const shelf=page.getByRole('combobox',{name:'Choose a shelf',exact:true});
 await shelf.focus();await shelf.press('ArrowDown');await shelf.press('r');await shelf.press('Enter');
 await expect(shelf).toContainText('Reading');
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.getByRole('button',{name:'Customize theme',exact:true}).click();
 await page.getByRole('button',{name:'Dark',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await screenshot(page,'theme-dark');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await screenshot(page,'library-dark');
 await page.getByRole('button',{name:'Filters',exact:true}).click();
 const site=page.getByRole('combobox',{name:'Website',exact:true});await site.click();
 await screenshot(page,'dropdown-dark');
 await site.press('Escape');
 await expect(page.getByRole('listbox')).toHaveCount(0);await expect(page.getByRole('dialog')).toHaveCount(1);
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.getByRole('button',{name:'Customize theme',exact:true}).click();
 await page.getByRole('button',{name:'Light',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});


test('failed progress saves retain the saved chapter and can be retried',async({page})=>{
 await page.evaluate(()=>(window as any).failUpdate=true);
 const input=page.getByRole('spinbutton',{name:'Last chapter read for The Cartographer’s Moon',exact:true});
 await input.fill('8');await input.press('Enter');
 await expect(input).toHaveValue('4');
 await expect(page.getByRole('alert')).toContainText('Something went wrong');
 await page.evaluate(()=>(window as any).failUpdate=false);
 await page.getByRole('button',{name:'Next read chapter for The Cartographer’s Moon',exact:true}).click();
 await expect(input).toHaveValue('5');
});


test('rating hover previews preceding stars without changing the saved rating',async({page})=>{
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Edit bookmark',exact:true}).click();
 const stars=page.locator('.star-button');
 await stars.nth(1).hover();
 await expect(page.locator('.star-button.filled')).toHaveCount(2);
 await expect(stars.nth(3)).toHaveAttribute('aria-pressed','true');
 await stars.nth(4).hover();
 await expect(page.locator('.star-button.filled')).toHaveCount(5);
 await page.getByRole('heading',{name:'Edit bookmark',exact:true}).hover();
 await expect(page.locator('.star-button.filled')).toHaveCount(4);
 await stars.nth(2).click();
 await page.getByRole('heading',{name:'Edit bookmark',exact:true}).hover();
 await expect(page.locator('.star-button.filled')).toHaveCount(3);
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='update').Patch)).toEqual({Rating:3});
});
