<script lang="ts">
 import {onMount} from 'svelte';
 import {fly,fade} from 'svelte/transition';
 import {flip} from 'svelte/animate';
 import {call,open,copy,cancel,defaultFilter,statuses,statusLabel,type Config,type Bookmark,type Filter} from './api';
 import {duration,interactions} from './motion';
 import Editor from './Editor.svelte';
 import Settings from './Settings.svelte';
 import Filters from './Filters.svelte';
 import Story from './Story.svelte';
 import Icon from './Icon.svelte';
 import Select from './Select.svelte';
 import Progress from './Progress.svelte';
 import SiteIcon from './SiteIcon.svelte';
 import './theme';
 import Feedback from './Feedback.svelte';
 let config:Config={Data:'',Sessions:'',UserAgent:''};
 let ready=false,busy=false,error='',notice='';
 let progressSaving:number|null=null;
 let filter=defaultFilter(),entries:Bookmark[]=[],selected:Bookmark|null=null;
 let editor=false,editing:Bookmark|null=null,settings=false,filters=false,resolved='';
 let lastDestination:Record<string,unknown>={};
 let searchInput:HTMLInputElement;
 let returnFocus:HTMLElement|null=null;
 let noticeTimer:ReturnType<typeof setTimeout>;
 $: overlay=editor||settings||filters||!!selected;
 $: refined=!!(filter.Query||filter.Site||filter.Status||filter.Tag||filter.Author||filter.Fandom||filter.Language||filter.SourceTag||filter.Complete!==null||filter.Unread||filter.MinRating||filter.MinWords||filter.MaxWords);
 function notify(s:string){notice=s;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice='',5000);}
 async function run(task:()=>Promise<void>){if(busy)return;busy=true;error='';notice='';try{await task();}catch(e){error=String(e);}finally{busy=false;}}
 async function load(){entries=await call<Bookmark[]>('list',{Config:config,Filter:filter});if(selected){try{selected=await call<Bookmark>('get',{Config:config,ID:selected.id});}catch{selected=null;}}}
 async function initialize(){await run(async()=>{config=await call<Config>('defaults');await load();ready=true;});}
 async function search(reset=true){await run(async()=>{if(reset)filter.Offset=0;await load();});}
 function showEditor(b:Bookmark|null){if(!b)returnFocus=document.activeElement as HTMLElement;error='';editing=b;editor=true;}
 function closeEditor(){editor=false;error='';}
 async function save(b:Partial<Bookmark>,patch:Record<string,unknown>,fetch:boolean){await run(async()=>{const wasEditing=!!editing;selected=await call<Bookmark>(wasEditing?'update':'add',{Config:config,ID:editing?.id,Bookmark:b,Patch:patch,Fetch:fetch});closeEditor();await load();notify(wasEditing?'Changes saved.':'Bookmark added.');});}
 async function updateProgress(b:Bookmark,chapter:number){
  if(busy||chapter===b.chapter||!Number.isSafeInteger(chapter)||chapter<0)return;
  progressSaving=b.id;
  try{await run(async()=>{await call('update',{Config:config,ID:b.id,Patch:{Chapter:chapter}});await load();notify('Progress saved.');});}finally{progressSaving=null;}
 }
 async function refresh(){if(!selected)return;await run(async()=>{selected=await call<Bookmark>('refresh',{Config:config,ID:selected!.id});await load();notify('Details updated.');});}
 async function destination(resume:boolean,launch:boolean,chapter=0){if(!selected)return;await run(async()=>{const p={Config:config,ID:selected!.id,Resume:resume,Chapter:chapter};lastDestination=p;if(launch){await open('resolve',p);notify('Opened in browser.');}else resolved=await call<string>('resolve',p);});}
 async function copyDetails(data:boolean){if(!selected)return;await run(async()=>{await copy(data?'get':'resolve',data?{Config:config,ID:selected!.id}:lastDestination);notify(data?'Story details copied.':'Link copied.');});}
 async function select(b:Bookmark){returnFocus=document.activeElement as HTMLElement;resolved='';await run(async()=>{selected=await call<Bookmark>('get',{Config:config,ID:b.id});});}
 function closeStory(){selected=null;error='';setTimeout(()=>returnFocus?.isConnected&&returnFocus.focus(),duration(260));}
 async function remove(){await run(async()=>{await call('delete',{Config:config,ID:selected!.id});selected=null;await load();notify('Bookmark removed.');});}
 async function applyFilters(f:Filter){filters=false;filter=f;await search(false);}
 function keydown(e:KeyboardEvent){if((e.metaKey||e.ctrlKey)&&e.key==='k'&&!overlay){e.preventDefault();searchInput?.focus();}if((e.metaKey||e.ctrlKey)&&e.key==='n'&&!overlay&&ready&&!busy){e.preventDefault();showEditor(null);}}
 onMount(()=>{void initialize();const focus=()=>{if(ready&&!busy&&!overlay)void search(false);};window.addEventListener('focus',focus);return()=>{window.removeEventListener('focus',focus);clearTimeout(noticeTimer);};});
</script>
<svelte:window onkeydown={keydown}/>
<div use:interactions>
<main class="reading-room" inert={overlay}>
 <section class="library-tools" aria-label="Library controls">
  <div class="library-title"><img src="/sailune-icon.png" alt=""/><h1>Library</h1><span class="entry-count" aria-label="Bookmarks on this page">{entries.length}</span></div>
  <div class="collection-actions"><button class="primary" disabled={!ready||busy} onclick={()=>showEditor(null)}><Icon name="plus" size={28}/>Add bookmark</button><button class="round" disabled={!ready||busy} onclick={()=>{settings=true;error='';}} aria-label="Settings" title="Settings"><Icon name="settings" size={28}/></button></div>
 </section>
 <section class="collection" aria-label="Your collection">
  <form class="library-search" onsubmit={(e)=>{e.preventDefault();void search();}}><Icon name="search" size={26}/><input bind:this={searchInput} aria-label="Search your stories" bind:value={filter.Query} placeholder="Search title, author, tags…"/><button disabled={!ready||busy} aria-label="Search" class="round"><Icon name="arrow" size={26}/></button></form>
  <div class="collection-heading"><div class="shelf-picker"><Select label="Choose a shelf" disabled={busy||!ready} bind:value={filter.Status} onchange={()=>search()} options={[['','All bookmarks'],...statuses.map(s=>[s,statusLabel(s)])]}/></div><div class="collection-actions"><button class="round" disabled={busy||!ready} onclick={()=>search(false)} aria-label="Refresh collection" title="Refresh collection"><Icon name="refresh" size={26}/></button><button class="quiet" disabled={busy||!ready} onclick={()=>filters=true}><Icon name="sliders" size={25}/>Filters{#if refined}<span class="refined-dot"></span>{/if}</button>{#if refined}<button class="text-button" disabled={busy} onclick={()=>{filter=defaultFilter();void search();}}>Clear filters</button>{/if}</div></div>
  {#if !overlay}<Feedback {error}/>{/if}
  {#if !ready&&!busy}<button class="quiet" onclick={initialize}>Retry<Icon name="refresh"/></button>{/if}
  {#if busy&&!overlay&&progressSaving===null}<div class="inline-progress" role="status"><span class="spinner"></span>Loading…<button class="text-button" onclick={()=>void cancel()}>Stop</button></div>{/if}
  {#if entries.length===0&&busy}<div class="bookshelf skeleton-shelf" aria-hidden="true">{#each [1,2,3] as n}<div class="skeleton-book"></div>{/each}</div>
  {:else if entries.length===0&&ready}<div class="empty" in:fly={{y:12,duration:duration(240)}}><Icon name={refined?'search':'bookmark'} size={48}/><h2>{refined?'No matches':'No bookmarks yet'}</h2><button class="primary" disabled={busy} onclick={()=>refined?(filter=defaultFilter(),void search()):showEditor(null)}>{refined?'Clear filters':'Add bookmark'}<Icon name="plus"/></button></div>
  {:else}<div class="bookshelf">{#each entries as b,i(b.id)}<article class="book" animate:flip={{duration:duration(240)}} in:fly={{y:12,duration:duration(260),delay:duration(Math.min(i,7)*25)}} out:fade={{duration:duration(100)}}>
   <button class="bookmark-open" disabled={busy} aria-label={`Open ${b.title||b.effective.title||'Untitled story'}`} onclick={()=>select(b)}>
    <div class="bookmark-meta"><SiteIcon site={b.site}/><span>{statusLabel(b.status)}</span>{#if b.rating}<span class="book-rating" aria-label={`${b.rating} stars`}><Icon name="star" size={18}/>{b.rating}</span>{/if}</div>
    <h3>{b.title||b.effective.title||'Untitled story'}</h3><p class="bookmark-author">{b.author||'Unknown author'}</p>

   </button>
   <Progress chapter={b.chapter} total={b.progress.known?b.progress.published:0} title={b.title||b.effective.title||'Untitled story'} disabled={busy} saving={progressSaving===b.id} onchange={n=>updateProgress(b,n)}/>
   {#if b.progress.known}<div class="reading-line"><span style:width={`${b.progress.percent}%`}></span></div>{/if}
  </article>{/each}</div>{/if}
  {#if entries.length>0||filter.Offset>0}<div class="pagination"><button class="round" aria-label="Previous page" disabled={busy||filter.Offset===0} onclick={()=>{filter.Offset=Math.max(0,filter.Offset-filter.Limit);void search(false);}}><Icon name="back"/></button><span>Page {Math.floor(filter.Offset/filter.Limit)+1}</span><button class="round" aria-label="Next page" disabled={busy||entries.length<filter.Limit} onclick={()=>{filter.Offset+=filter.Limit;void search(false);}}><Icon name="arrow"/></button></div>{/if}
 </section>
</main>
{#if notice&&!overlay}<div class="toast" role="status" transition:fly={{y:12,duration:duration(200)}}><Icon name="check"/>{notice}<button class="round" onclick={()=>notice=''} aria-label="Dismiss"><Icon name="close" size={20}/></button></div>{/if}
{#if editor}<Editor bookmark={editing} {busy} {error} onsave={save} onclose={closeEditor}/>
{:else if settings}<Settings {config} {busy} {error} message={notice} {run} {notify} onclose={()=>{settings=false;error='';}} onchange={async(c)=>{await call('list',{Config:c,Filter:{Limit:1}});config=c;selected=null;filter.Offset=0;await load();}}/>
{:else if filters}<Filters {filter} onclose={()=>filters=false} onapply={applyFilters}/>
{:else if selected}<Story bookmark={selected} {busy} {error} message={notice} {resolved} onclose={closeStory} onedit={()=>showEditor(selected)} onrefresh={refresh} ondelete={remove} ondestination={destination} oncopy={copyDetails}/>{/if}

</div>
