<script lang="ts">
 import {onMount} from 'svelte';
 import {call,open,cancel,defaultFilter,statuses,statusLabel,type Config,type Bookmark} from './api';
 import Editor from './Editor.svelte';
 import Settings from './Settings.svelte';
 let config:Config={Data:'',Sessions:'',UserAgent:''};
 let ready=false,busy=false,error='',notice='',page='library';
 let filter=defaultFilter(),entries:Bookmark[]=[],selected:Bookmark|null=null;
 let editor=false,editing:Bookmark|null=null,advanced=false,openChapter=1,resolved='';
 let confirmDelete=false;
 let lastFocus:HTMLElement|null=null;
 async function run(task:()=>Promise<void>) { if(busy)return;busy=true;error='';notice='';try{await task();}catch(e){error=String(e);}finally{busy=false;} }
 async function load() { entries=await call<Bookmark[]>('list',{Config:config,Filter:filter}); if(selected){try{selected=await call<Bookmark>('get',{Config:config,ID:selected.id});}catch{selected=null;}} }
 async function search(reset=true) {await run(async()=>{if(reset)filter.Offset=0;await load();});}
 function showEditor(b:Bookmark|null) { lastFocus=document.activeElement as HTMLElement;editing=b;editor=true; }
 function closeEditor() {editor=false;lastFocus?.focus();}
 async function save(b:Partial<Bookmark>,patch:Record<string,unknown>,fetch:boolean) {await run(async()=>{selected=await call<Bookmark>(editing?'update':'add',{Config:config,ID:editing?.id,Bookmark:b,Patch:patch,Fetch:fetch});closeEditor();await load();notice=editing?'Bookmark updated.':'Bookmark added.';});}
 async function refresh() {if(!selected)return;await run(async()=>{selected=await call<Bookmark>('refresh',{Config:config,ID:selected!.id});await load();notice='Source metadata refreshed. Personal fields preserved.';});}
 async function destination(resume:boolean,launch:boolean,chapter=0) {if(!selected)return;await run(async()=>{const p={Config:config,ID:selected!.id,Resume:resume,Chapter:chapter};if(launch)await open('resolve',p);else resolved=await call<string>('resolve',p);});}
 function select(b:Bookmark) {selected=b;resolved='';confirmDelete=false;}
 function keydown(e:KeyboardEvent) {
  if(editor && e.key==='Escape'&&!busy){closeEditor();return;}
  if(editor && e.key==='Tab'){
   const els=Array.from(document.querySelectorAll<HTMLElement>('.modal button:not(:disabled), .modal input:not(:disabled), .modal select:not(:disabled), .modal textarea:not(:disabled), .modal summary')).filter(el=>el.getClientRects().length);
   const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
 }
 onMount(()=>{void run(async()=>{config=await call<Config>('defaults');ready=true;await load();});const focus=()=>{if(ready&&!busy&&!editor&&page==='library')void search(false);};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);});
 $: if(editor) setTimeout(()=>document.querySelector<HTMLElement>('.modal input')?.focus(),0);
</script>
<svelte:window onkeydown={keydown}/>
<div class="shell" inert={editor}>
 <aside class="sidebar">
  <div class="brand"><img src="/sailune-icon.png" alt=""/><span>Sailune<small>A HOME FOR YOUR STORIES</small></span></div>
  <button class="add-button" disabled={!ready||busy} onclick={()=>showEditor(null)}>＋ Add bookmark</button>
  <p class="nav-label">LIBRARY</p>
  <nav aria-label="Library navigation"><button class:active={page==='library'&&!filter.Status} onclick={()=>{page='library';filter.Status='';void search();}}>▤ <span>All stories</span></button>{#each statuses as s}<button class:active={page==='library'&&filter.Status===s} onclick={()=>{page='library';filter.Status=s;void search();}}><span class="nav-dot {s}"></span><span>{statusLabel(s)}</span></button>{/each}</nav>
  <div class="sidebar-bottom"><button class:active={page==='settings'} onclick={()=>page='settings'}>⚙ Settings & transfers</button><div class="local-status"><span></span>Local library<small>Powered by Sailune-Go</small></div></div>
 </aside>
 <main>
  {#if busy}<div class="activity" role="status"><span class="spinner"></span>Working…<button onclick={()=>void cancel()}>Cancel request</button></div>{/if}
  {#if error}<div class="banner error" role="alert">{error}<button onclick={()=>error=''} aria-label="Dismiss error">✕</button></div>{/if}
  {#if notice}<div class="banner success" role="status">{notice}<button onclick={()=>notice=''} aria-label="Dismiss notification">✕</button></div>{/if}
  {#if page==='settings'}{#if ready}<Settings {config} {busy} {run} notify={(s)=>notice=s} onchange={async(c)=>{await call('list',{Config:c,Filter:{Limit:1}});config=c;selected=null;filter.Offset=0;await load();}}/>{/if}
  {:else}
  <header class="page-header"><div><p class="eyebrow">YOUR NEXT CHAPTER</p><h1>{filter.Status?statusLabel(filter.Status):'All stories'}<span class="title-dot">.</span></h1><p class="muted">The worlds you love, right where you left them.</p></div><button disabled={busy||!ready} onclick={()=>search(false)} title="Reload changes made in the CLI">↻ Reload</button></header>
  <form class="search-bar" onsubmit={(e)=>{e.preventDefault();void search();}}><span aria-hidden="true">⌕</span><input aria-label="Search library" bind:value={filter.Query} placeholder="Search stories, authors, fandoms, notes…"/><button type="button" class:active={advanced} onclick={()=>advanced=!advanced}>Filters {advanced?'−':'＋'}</button><button class="primary" disabled={busy||!ready}>Search</button></form>
  <div class="list-tools"><div class="button-row"><select aria-label="Filter site" bind:value={filter.Site} onchange={()=>search()}><option value="">All sites</option><option value="ao3">AO3</option><option value="ffn">FanFiction.net</option></select><label class="check"><input type="checkbox" bind:checked={filter.Unread} onchange={()=>search()}/>Unread chapters</label></div><div class="button-row"><select aria-label="Sort stories" bind:value={filter.Sort} onchange={()=>search()}>{#each ['added','last-read','updated','source-updated','title','author','rating','words','progress'] as sort}<option value={sort}>Sort: {sort.replaceAll('-',' ')}</option>{/each}</select><button aria-label="Toggle descending order" aria-pressed={filter.Desc} onclick={()=>{filter.Desc=!filter.Desc;void search();}}>{filter.Desc?'↓':'↑'}</button></div></div>
  {#if advanced}<form class="panel filter-grid" onsubmit={(e)=>{e.preventDefault();void search();}}>{#each [['Tag','Personal tag'],['Author','Author'],['Fandom','Fandom'],['Language','Language'],['SourceTag','Source tag']] as [key,label]}<label>{label}<input value={String(filter[key as keyof typeof filter])} oninput={(e)=>filter={...filter,[key]:e.currentTarget.value}}/></label>{/each}<label>Story completion<select bind:value={filter.Complete}><option value={null}>Any</option><option value={true}>Complete</option><option value={false}>In progress</option></select></label><label>Minimum stars<input type="number" min="0" max="5" bind:value={filter.MinRating}/></label><label>Minimum words<input type="number" min="0" bind:value={filter.MinWords}/></label><label>Maximum words (0 = any)<input type="number" min="0" bind:value={filter.MaxWords}/></label><button disabled={busy}>Apply filters</button><button type="button" onclick={()=>{filter=defaultFilter();void search();}}>Reset filters</button></form>{/if}
  <div class="collection" class:with-detail={!!selected}>
   <section class="story-list" aria-label="Bookmarks">
    {#if entries.length===0}<div class="empty"><div class="empty-symbol">☾</div><h2>{filter.Query||filter.Status||filter.Site?'No stories found':'A little space for every story'}</h2><p class="muted">{filter.Query||filter.Status||filter.Site?'Try a different search or reset your filters.':'Save your first AO3 or FanFiction.net bookmark to begin.'}</p><button disabled={!ready||busy} onclick={()=>showEditor(null)}>＋ Add your first bookmark</button></div>
    {:else}{#each entries as b(b.id)}<button class="story-card" class:selected={selected?.id===b.id} onclick={()=>select(b)}><div class="card-top"><span class="site-badge {b.site}">{b.site==='ao3'?'AO3':'FFN'}</span><span class="status-pill {b.status}">{statusLabel(b.status)}</span>{#if b.rating}<span class="stars">{'★'.repeat(b.rating)}</span>{/if}</div><h2>{b.title||b.effective.title||'Untitled story'}</h2><p class="author">by {b.author||'Unknown author'}</p><p class="fandom">{(b.effective.fandoms||[]).join(' · ')||'Your own corner of the storyverse'}</p>{#if b.effective.summary}<p class="summary-text">{b.effective.summary}</p>{/if}<div class="card-meta"><span>{b.effective.words?b.effective.words.toLocaleString()+' words':'Word count unknown'}</span><span>{b.progress.known?`${b.chapter} / ${b.progress.published} chapters`:`Chapter ${b.chapter}`}</span><span>{b.effective.complete?'Complete':'In progress'}</span></div>{#if b.progress.known}<div class="progress-track"><span style:width={`${b.progress.percent}%`}></span></div>{/if}{#if b.tags?.length}<div class="tags">{#each b.tags.slice(0,5) as tag}<span>{tag}</span>{/each}</div>{/if}</button>{/each}{/if}
    <div class="pagination"><button disabled={busy||filter.Offset===0} onclick={()=>{filter.Offset=Math.max(0,filter.Offset-filter.Limit);void search(false);}}>← Previous</button><span>Page {Math.floor(filter.Offset/filter.Limit)+1} · {entries.length} stories</span><select aria-label="Stories per page" bind:value={filter.Limit} onchange={()=>search()}>{#each [20,50,100] as n}<option value={n}>{n} per page</option>{/each}</select><button disabled={busy||entries.length<filter.Limit} onclick={()=>{filter.Offset+=filter.Limit;void search(false);}}>Next →</button></div>
   </section>
   {#if selected}<aside class="detail panel"><header><span class="eyebrow">BOOKMARK #{selected.id}</span><button class="icon-button" onclick={()=>selected=null} aria-label="Close bookmark detail">✕</button></header><h2>{selected.title||selected.effective.title||'Untitled story'}</h2><p class="author">by {selected.author||'Unknown author'}</p><div class="button-row"><button class="primary" disabled={busy} onclick={()=>destination(true,true)}>Resume reading ↗</button><button disabled={busy} onclick={()=>destination(false,true)}>Open story ↗</button></div><div class="button-row"><button disabled={busy} onclick={()=>showEditor(selected)}>Edit bookmark</button><button disabled={busy} onclick={refresh}>↻ Refresh metadata</button></div>
   <hr/><p>{selected.effective.summary||'No summary saved.'}</p><dl><dt>Reading</dt><dd>{statusLabel(selected.status)} · chapter {selected.chapter}</dd><dt>Source</dt><dd>{selected.effective.language||'Unknown language'} · {selected.effective.rating||'Unrated'}</dd><dt>Published / planned chapters</dt><dd>{selected.effective.chapters||'?'} / {selected.effective.total_chapters||'?'}</dd><dt>Words</dt><dd>{selected.effective.words?.toLocaleString()||'Unknown'}</dd><dt>Fandoms</dt><dd>{(selected.effective.fandoms||[]).join(', ')||'—'}</dd><dt>Published / source updated</dt><dd>{selected.effective.published||'—'} / {selected.effective.updated||'—'}</dd><dt>Last fetched</dt><dd>{selected.metadata?.fetched_at?new Date(selected.metadata.fetched_at).toLocaleString():'Never'}</dd><dt>Personal tags</dt><dd>{(selected.tags||[]).join(', ')||'—'}</dd><dt>Personal rating</dt><dd>{selected.rating?'★'.repeat(selected.rating):'Unrated'}</dd><dt>Notes</dt><dd class="preserve">{selected.notes||'—'}</dd><dt>Review</dt><dd class="preserve">{selected.review_notes||'—'}</dd></dl>
   <details><summary>Source tags & saved data</summary><p>{(selected.effective.tags||[]).join(', ')||'No source tags'}</p><pre>{JSON.stringify(selected,null,2)}</pre></details>
   <details><summary>Chapter navigation</summary><label>Chapter number<input type="number" min="1" bind:value={openChapter}/></label><div class="button-row"><button disabled={busy} onclick={()=>destination(false,true,openChapter)}>Open chapter ↗</button><button disabled={busy} onclick={()=>destination(false,false,openChapter)}>Show chapter URL</button><button disabled={busy} onclick={()=>destination(true,false)}>Show next URL</button><button disabled={busy} onclick={()=>destination(false,false)}>Show story URL</button></div>{#if resolved}<input aria-label="Resolved story URL" readonly value={resolved}/>{/if}<p class="hint">Opening a story never changes your saved reading progress.</p></details>
   <hr/>{#if confirmDelete}<p>Remove this bookmark and its personal notes?</p><div class="button-row"><button class="danger" disabled={busy} onclick={()=>run(async()=>{await call('delete',{Config:config,ID:selected!.id});selected=null;confirmDelete=false;await load();notice='Bookmark removed.';})}>Remove permanently</button><button onclick={()=>confirmDelete=false}>Keep bookmark</button></div>{:else}<button class="danger subtle" disabled={busy} onclick={()=>confirmDelete=true}>Remove bookmark</button>{/if}
   </aside>{/if}
  </div>
  {/if}
 </main>
</div>
{#if editor}<Editor bookmark={editing} {busy} {error} onsave={save} onclose={closeEditor}/>{/if}
