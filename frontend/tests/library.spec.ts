import {test,expect,type Page} from '@playwright/test';
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
  (window as any).go={main:{App:{Copy:async()=>{},Confirm:async()=>true,Cancel:async()=>{},Pick:async()=>'',Open:async()=>{},Call:async(action:string,json:string)=>{
   const r=JSON.parse(json);(window as any).testCalls.push({action,...r});
   if(action==='defaults')return JSON.stringify({Data:'/tmp/test/library.sqlite3',Sessions:'/tmp/test/sessions',UserAgent:''});
   if(action==='list')return JSON.stringify(records.filter(b=>(!r.Filter?.Query||b.title.includes(r.Filter.Query))&&(!r.Filter?.Status||b.status===r.Filter.Status)));
   if(action==='get')return JSON.stringify(records.find(b=>b.id===r.ID));
   if(action==='add'){
    if(r.Bookmark.url.includes('999'))throw new Error('Synthetic fetch failure; use offline mode.');
    const b={...r.Bookmark,id:4,site:'ffn',effective:metadata,progress:{known:false,read:0,published:0,unread:0,percent:0}};records.push(b);return JSON.stringify(b);
   }
   if(action==='update'){const b=records.find(b=>b.id===r.ID);for(const [k,v] of Object.entries(r.Patch))b[k.toLowerCase()]=v;return JSON.stringify(b);}
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
 await page.getByRole('button',{name:'Make a note',exact:true}).click();
 await page.getByLabel('Notes',{exact:true}).fill('Changed locally');
 await screenshot(page,'editor');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'The Cartographer’s Moon',exact:true})).toBeVisible();
 const patch=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='update').Patch);
 expect(patch).toEqual({Notes:'Changed locally'});
 await screenshot(page,'story');
});

test('failed save keeps the draft, and offline save stays available',async({page})=>{
 await page.getByRole('button',{name:'Save a story',exact:true}).click();
 await page.getByLabel('Story link',{exact:true}).fill('https://archiveofourown.org/works/999');
 await page.getByLabel('Title',{exact:true}).fill('Keep this draft');
 await page.getByRole('button',{name:'Save story',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('alert')).toContainText('That didn’t work this time');
 await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Keep this draft');
 await page.getByLabel('Story link',{exact:true}).fill('https://www.fanfiction.net/s/124/1');
 await page.getByLabel('Fill in the story details for me').uncheck();
 await page.getByRole('button',{name:'Save story',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'Keep this draft',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as any).testCalls.filter((c:any)=>c.action==='add').at(-1).Fetch)).toBe(false);
});

test('removal requires confirmation and account connection requires consent',async({page})=>{
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Remove from my collection',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).testCalls.some((c:any)=>c.action==='delete'))).toBe(false);
 await page.getByRole('button',{name:'Keep it',exact:true}).click();
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Your space',exact:true}).click();
 await screenshot(page,'settings');
 await page.getByRole('button',{name:/Connected websites/}).click();
 await expect(page.getByRole('button',{name:'Connect account',exact:true})).toBeDisabled();
 await page.getByLabel('Let Sailune use my sign-in').check();
 await page.getByRole('button',{name:'Connect account',exact:true}).click();
 const request=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='session-browser'));
 expect(request).toMatchObject({Consent:true,Browser:'chromium/chrome',Site:'ao3'});
 await screenshot(page,'connect');
});

test('search refinements keep the full core filter vocabulary',async({page})=>{
 await page.getByRole('button',{name:'Refine',exact:true}).click();
 await page.getByRole('combobox',{name:'Website',exact:true}).selectOption('ffn');
 await page.getByLabel('Author',{exact:true}).fill('Aster');
 await page.getByRole('combobox',{name:'Story ending',exact:true}).selectOption({label:'Still being written'});
 await page.getByLabel('Something left to read').check();
 await page.getByText('Length & rating',{exact:true}).click();
 await page.getByLabel('At least this many words',{exact:true}).fill('12000');
 await page.getByRole('combobox',{name:'My rating',exact:true}).selectOption('4');
 await page.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('source-updated');
 await page.getByRole('button',{name:'Find my stories',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const f=await page.evaluate(()=>(window as any).testCalls.filter((c:any)=>c.action==='list').at(-1).Filter);
 expect(f).toMatchObject({Site:'ffn',Author:'Aster',Complete:false,Unread:true,MinWords:12000,MinRating:4,Sort:'source-updated'});
});

test('zero-valued custom details and individual resets remain possible',async({page})=>{
 await page.getByRole('button',{name:'Open The Cartographer’s Moon',exact:true}).click();
 await page.getByRole('button',{name:'Make a note',exact:true}).click();
 await page.getByText('Personalize story details',{exact:true}).click();
 await page.getByLabel('Words',{exact:true}).check();
 await page.getByLabel('My Words',{exact:true}).fill('0');
 await page.getByLabel('Finished story',{exact:true}).check();
 await page.getByLabel('My Finished story',{exact:true}).selectOption('false');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 const p=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='update').Patch);
 expect(p).toMatchObject({ResetOverrides:'all',Overrides:{words:0,complete:false}});
});

test('dialogs support Escape and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Your space',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Your space',exact:true})).toBeFocused();
});
