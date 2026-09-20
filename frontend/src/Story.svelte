<script lang="ts">
 import Artwork from './Artwork.svelte';
 import ArtEditor from './ArtEditor.svelte';
 import AssignCollection from './AssignCollection.svelte';
 import {detailArt} from './appearance';
 import type {Config} from './api';
 export let config:Config;
 let artRevision=0,largePreview=false;

 import type {Bookmark} from './api';
 import {statusLabel} from './api';
 import Sheet from './Sheet.svelte';
 import Icon from './Icon.svelte';
 import Chapters from './Chapters.svelte';
 export let bookmark:Bookmark;
 export let busy=false;
 export let error='';
 export let message='';
 export let onclose:()=>void;
 export let onedit:()=>void;
 export let onrefresh:()=>void;
 export let ondelete:()=>void;
 export let ondestination:(resume:boolean,launch:boolean,chapter?:number)=>void;
 export let oncopy:(data:boolean)=>void;
 export let resolved='';
 let confirmDelete=false;
 const date=(v?:string)=>!v||v.startsWith('0001')?'Not yet':new Date(v).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
 $: b=bookmark;
</script>
<Sheet hideHeading={$detailArt} title={b.title||b.effective.title||'Untitled story'} subtitle={`by ${b.author||'Unknown author'}`} {busy} {error} {message} {onclose} wide>
 {#if $detailArt}<div class="story-art-header"><div class="story-banner"><Artwork {config} id={b.id} site={b.site} role="background" small={false} revision={artRevision}/></div><button class="story-cover" aria-label="Preview cover artwork" onclick={()=>largePreview=!largePreview}><Artwork {config} id={b.id} site={b.site} small={false} revision={artRevision}/></button></div>{#if largePreview}<div class="large-art-preview"><Artwork {config} id={b.id} site={b.site} small={false} revision={artRevision}/><button onclick={()=>largePreview=false}>Close preview</button></div>{/if}<h2 class="art-story-title">{b.title||'Untitled story'}</h2><p class="art-story-author">by {b.author||'Unknown author'}</p>{/if}
 <div class="story-reading">
  <div><span class="overline">{statusLabel(b.status)}</span><p class="reading-number">{b.chapter}<span>{b.progress.known?` / ${b.progress.published}`:' chapters read'}</span></p></div>
  <button class="primary" disabled={busy} onclick={()=>ondestination(true,true)}>Read next<Icon name="arrow"/></button>
 </div>
 {#if b.progress.known}<div class="reading-line"><span style:width={`${b.progress.percent}%`}></span></div>{/if}
 <div class="story-quick-actions"><button disabled={busy} onclick={onedit}><Icon name="edit"/>Edit bookmark</button><button disabled={busy} onclick={onrefresh}><Icon name="refresh"/>Refresh details</button><button disabled={busy} onclick={()=>ondestination(false,true)}><Icon name="external"/>Open website</button></div>
 <AssignCollection {config} id={b.id}/><ArtEditor {config} id={b.id} site={b.site} onchange={()=>artRevision++}/>
 <div class="story-facts"><span>{b.effective.words?b.effective.words.toLocaleString()+' words':'Length unknown'}</span><span>{b.effective.complete?'Finished':'Still being written'}</span><span>{b.effective.language||'Language unknown'}</span></div>
 <p class="story-summary">{b.effective.summary||'No summary.'}</p>
 {#if b.effective.fandoms?.length}<div class="tags">{#each b.effective.fandoms as tag}<span>{tag}</span>{/each}</div>{/if}
 <section class="personal-page"><div class="section-heading"><h3>Notes</h3><button class="text-button" disabled={busy} onclick={onedit}>Edit<Icon name="edit"/></button></div>
  {#if b.rating}<div class="stars" aria-label={`${b.rating} out of 5 stars`}>{#each Array(b.rating) as _}<Icon name="star" size={26}/>{/each}</div>{/if}
  <p class="preserve">{b.notes||'No notes.'}</p>
  {#if b.review_notes}<h4>Your review</h4><p class="preserve">{b.review_notes}</p>{/if}
  {#if b.tags?.length}<div class="tags">{#each b.tags as tag}<span>{tag}</span>{/each}</div>{/if}
 </section>
 <Chapters initial={b.progress.known?Math.min(b.chapter+1,Math.max(1,b.progress.published)):b.chapter+1} total={b.progress.known?b.progress.published:0} {busy} {ondestination}/>
 {#if resolved}<div class="resolved-link"><input aria-label="Chapter or story link" readonly value={resolved}/><button class="round" disabled={busy} onclick={()=>oncopy(false)} aria-label="Copy link" title="Copy link"><Icon name="link"/></button></div>{/if}
 <details class="disclosure"><summary>Details<Icon name="plus"/></summary><dl class="detail-grid"><dt>Age rating</dt><dd>{b.effective.rating||'Not listed'}</dd><dt>Available / planned chapters</dt><dd>{b.effective.chapters||'Unknown'} / {b.effective.total_chapters||'Unknown'}</dd><dt>First published</dt><dd>{b.effective.published||'Not listed'}</dd><dt>Last story update</dt><dd>{b.effective.updated||'Not listed'}</dd><dt>Saved on</dt><dd>{date(b.created_at)}</dd><dt>Last read</dt><dd>{date(b.last_read_at)}</dd><dt>Last edited</dt><dd>{date(b.updated_at)}</dd><dt>Last checked</dt><dd>{date(b.metadata?.fetched_at)}</dd></dl><h4>Tags from the website</h4><div class="tags">{#each b.effective.tags||[] as tag}<span>{tag}</span>{/each}</div>
  <details class="disclosure"><summary>Original details<Icon name="plus"/></summary>{#if b.metadata}<dl class="detail-grid">{#each Object.entries(b.metadata) as [key,value]}<dt>{({title:'Title',authors:'Authors',summary:'Summary',fandoms:'Fandoms',tags:'Story tags',language:'Language',rating:'Age rating',words:'Words',chapters:'Available chapters',total_chapters:'Planned chapters',complete:'Finished',published:'First published',updated:'Last updated',fetched_at:'Last checked',chapter_ids:'Chapter references'} as Record<string,string>)[key]||key}</dt><dd>{Array.isArray(value)?value.join(', '):typeof value==='boolean'?value?'Yes':'No':String(value||'Not listed')}</dd>{/each}</dl>{:else}<p class="hint">You saved this story without the website’s details.</p>{/if}</details>
  <button class="quiet" disabled={busy} onclick={()=>oncopy(true)}>Copy details<Icon name="book"/></button>
 </details>
 {#if confirmDelete}<div class="remove-confirm"><h3>Remove bookmark?</h3><p>Your notes and review will also be removed.</p><div class="button-row"><button disabled={busy} class="primary" onclick={ondelete}>Remove</button><button disabled={busy} class="quiet" onclick={()=>confirmDelete=false}>Cancel</button></div></div>{:else}<button class="text-button danger" disabled={busy} onclick={()=>confirmDelete=true}><Icon name="trash"/>Remove bookmark</button>{/if}
</Sheet>
