import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{
  const metadata={title:'The Cartographer’s Moon',authors:['Aster Vale'],summary:'An old map, an unexpected companion, and a journey beyond the edge of the known world.',fandoms:['Original Work'],tags:['Found Family','Adventure'],language:'English',rating:'Teen',words:42800,chapters:12,total_chapters:16,complete:false,published:'2026-08-01',updated:'2026-09-10'};
  let records:any[]=[{id:1,url:'https://archiveofourown.org/works/123',site:'ao3',title:metadata.title,author:'Aster Vale',status:'reading',chapter:4,tags:['weekend reading'],notes:'Pick up at the lighthouse.',rating:4,review_notes:'',created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-01T00:00:00Z',last_read_at:'2026-09-05T00:00:00Z',metadata,effective:metadata,progress:{known:true,read:4,published:12,unread:8,percent:33}}];
  (window as any).testCalls=[];
  (window as any).go={main:{App:{Confirm:async()=>true,Cancel:async()=>{},Pick:async()=>'',Open:async()=>{},Call:async(action:string,json:string)=>{
   const r=JSON.parse(json);(window as any).testCalls.push({action,...r});
   if(action==='defaults')return JSON.stringify({Data:'/tmp/test/library.sqlite3',Sessions:'/tmp/test/sessions',UserAgent:''});
   if(action==='list')return JSON.stringify(records.filter(b=>(!r.Filter?.Query||b.title.includes(r.Filter.Query))&&(!r.Filter?.Status||b.status===r.Filter.Status)));
   if(action==='get')return JSON.stringify(records.find(b=>b.id===r.ID));
   if(action==='add'){
    if(r.Bookmark.url.includes('999'))throw new Error('Synthetic fetch failure; use offline mode.');
    const b={...r.Bookmark,id:2,site:'ffn',effective:metadata,progress:{known:false,read:0,published:0,unread:0,percent:0}};records.push(b);return JSON.stringify(b);
   }
   if(action==='update'){const b=records.find(b=>b.id===r.ID);for(const [k,v] of Object.entries(r.Patch))b[k.toLowerCase()]=v;return JSON.stringify(b);}
   if(action==='delete'){records=records.filter(b=>b.id!==r.ID);return 'null';}
   if(action==='session-status')return JSON.stringify({site:r.Site,configured:false,usable_cookies:0});
   return 'null';
  }}}};
 });
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'The Cartographer’s Moon'})).toBeVisible();
});

test('renders collection and editor; preserves unchanged personal fields',async({page})=>{
 await page.screenshot({path:'test-results/library.png',fullPage:true});
 await page.getByRole('button',{name:/The Cartographer’s Moon/}).click();
 await page.getByRole('button',{name:'Edit bookmark',exact:true}).click();
 await page.getByLabel('Notes',{exact:true}).fill('Changed locally');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const patch=await page.evaluate(()=>(window as any).testCalls.find((c:any)=>c.action==='update').Patch);
 expect(patch).toEqual({Notes:'Changed locally'});
});

test('failed add keeps form and error visible, then offline add succeeds',async({page})=>{
 await page.getByRole('button',{name:'＋ Add bookmark',exact:true}).click();
 await page.getByLabel('Story URL',{exact:true}).fill('https://archiveofourown.org/works/999');
 await page.getByLabel('Title',{exact:true}).fill('Keep this draft');
 await page.getByRole('button',{name:'Add bookmark',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Synthetic fetch failure');
 await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Keep this draft');
 await page.getByLabel('Story URL',{exact:true}).fill('https://www.fanfiction.net/s/124/1');
 await page.getByLabel('Fetch source metadata').uncheck();
 await page.getByRole('button',{name:'Add bookmark',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).testCalls.filter((c:any)=>c.action==='add').at(-1).Fetch)).toBe(false);
});

test('deletion requires explicit confirmation and cookie import requires consent',async({page})=>{
 await page.getByRole('button',{name:/The Cartographer’s Moon/}).click();
 await page.getByRole('button',{name:'Remove bookmark',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).testCalls.some((c:any)=>c.action==='delete'))).toBe(false);
 await page.getByRole('button',{name:'Keep bookmark',exact:true}).click();
 await page.getByRole('button',{name:'⚙ Settings & transfers'}).click();
 await expect(page.getByRole('button',{name:'Import from browser',exact:true})).toBeDisabled();
 await page.getByLabel('I authorize importing cookies').check();
 await expect(page.getByRole('button',{name:'Import from browser',exact:true})).toBeEnabled();
 await page.screenshot({path:'test-results/settings.png',fullPage:true});
});
