<script lang="ts">
 import {statuses,statusLabel,patchBetween,type Bookmark,type Metadata,cancel} from './api';
 export let bookmark:Bookmark|null=null;
 export let busy=false;
 export let error="";
 export let onsave:(bookmark:Partial<Bookmark>,patch:Record<string,unknown>,fetch:boolean)=>void;
 export let onclose:()=>void;
 const initial=bookmark?structuredClone(bookmark):null;
 let draft = structuredClone(bookmark || {url:'',title:'',author:'',status:'planned',chapter:0,tags:[],notes:'',rating:0,review_notes:'',created_at:new Date().toISOString(),last_read_at:'0001-01-01T00:00:00Z'}) as Bookmark;
 let tags=(draft.tags||[]).join(', ');
 let fetch=true;
 let overrides:Record<string,unknown>=structuredClone(bookmark?.overrides||{});
 let enabled:Record<string,boolean>=Object.fromEntries(Object.keys(overrides).map(k=>[k,true]));
 let dateError='';
 const metadataFields = [
  ['summary','Summary','text'],['fandoms','Fandoms','list'],['tags','Source tags','list'],['language','Language','text'],['rating','Content rating','text'],['words','Word count','number'],['chapters','Published chapters','number'],['total_chapters','Planned chapters','number'],['complete','Story complete','bool'],['published','Published date','date'],['updated','Source updated date','date']
 ];
 function overrideValue(key:string,kind:string) {
  const v=overrides[key] ?? bookmark?.effective?.[key as keyof Metadata];
  return kind==='list' ? ((v||[]) as string[]).join(', ') : String(v??'');
 }
 function toggle(key:string,kind:string,checked:boolean) {
  enabled={...enabled,[key]:checked};
  if(checked && overrides[key]===undefined) overrides[key]=bookmark?.effective?.[key as keyof Metadata] ?? (kind==='list'?[]:kind==='number'?0:kind==='bool'?false:'');
 }
 function save() {
  draft.tags=tags.split(',').map(t=>t.trim()).filter(Boolean);
  dateError='';
  for(const key of ['created_at','last_read_at'] as const) {
   if(initial && draft[key]===initial[key]) continue;
   if(!draft[key]) { if(key==='created_at'){dateError='Added date is required.';return;} draft[key]='0001-01-01T00:00:00Z'; }
   else { const d=new Date(draft[key]); if(isNaN(d.getTime())){dateError='Use a valid ISO date and time.';return;} draft[key]=d.toISOString(); }
  }
  const next:Record<string,unknown>={}; for(const key of Object.keys(enabled)) if(enabled[key]) next[key]=overrides[key];
  const patch=initial?patchBetween(initial,draft):{};
  // Reset and reapply the explicitly selected override set in one transaction.
  if(JSON.stringify(next)!==JSON.stringify(initial?.overrides||{})) { patch.ResetOverrides='all'; patch.Overrides=next; }
  draft.overrides=next as Partial<Metadata>;
  onsave(draft,patch,fetch);
 }
</script>
<div class="modal-backdrop">
 <div class="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title" tabindex="-1">
  <header><div><p class="eyebrow">YOUR COLLECTION</p><h2 id="editor-title">{bookmark?'Edit bookmark':'A new story awaits'}</h2></div><button type="button" class="icon-button" onclick={onclose} disabled={busy} aria-label="Close editor">✕</button></header>
  {#if error}<p class="banner error" role="alert">{error}</p>{/if}
  {#if busy}<div class="activity" role="status">Saving…<button onclick={()=>void cancel()}>Cancel request</button></div>{/if}
  <form onsubmit={(e)=>{e.preventDefault();save();}}>
   <fieldset disabled={busy}>
    {#if !bookmark}<label>Story URL<input type="url" required placeholder="https://archiveofourown.org/works/…" bind:value={draft.url}/></label><label class="check"><input type="checkbox" bind:checked={fetch}/>Fetch source metadata using your saved site session</label>{/if}
    <div class="form-grid"><label>Title<input bind:value={draft.title} placeholder={fetch&&!bookmark?'Fetched from the story':'Story title'}/></label><label>Author<input bind:value={draft.author}/></label>
    <label>Reading status<select bind:value={draft.status}>{#each statuses as s}<option value={s}>{statusLabel(s)}</option>{/each}</select></label><label>Last chapter read<input type="number" min="0" step="1" required bind:value={draft.chapter}/></label>
    <label>Personal rating<select bind:value={draft.rating}><option value={0}>Unrated</option>{#each [1,2,3,4,5] as n}<option value={n}>{'★'.repeat(n)}</option>{/each}</select></label><label>Personal tags<input bind:value={tags} placeholder="comfort read, revisit"/></label></div>
    <label>Notes<textarea rows="3" bind:value={draft.notes} placeholder="A little reminder for future you…"></textarea></label>
    <label>Review<textarea rows="2" bind:value={draft.review_notes}></textarea></label>
    {#if bookmark}<details><summary>Reading dates</summary><div class="form-grid"><label>Added (ISO date/time)<input required bind:value={draft.created_at}/></label><label>Last read (ISO date/time; blank clears)<input bind:value={draft.last_read_at}/></label></div><p class="hint">Changing chapter progress updates last-read time unless you also edit it here.</p></details>{/if}
    <details><summary>Customize source metadata</summary><p class="hint">Enable a field to keep your own value through refreshes. Disable it to follow the source again. Lists use commas.</p>
     {#each metadataFields as [key,label,kind]}<div class="override-row"><label class="check"><input type="checkbox" checked={!!enabled[key]} onchange={(e)=>toggle(key,kind,e.currentTarget.checked)}/>{label}</label>
      {#if enabled[key]}{#if kind==='bool'}<select aria-label={label} value={String(overrides[key]??false)} onchange={(e)=>overrides[key]=e.currentTarget.value==='true'}><option value="false">In progress</option><option value="true">Complete</option></select>
      {:else if kind==='number'}<input aria-label={label} type="number" min="0" step="1" required value={Number(overrides[key]||0)} oninput={(e)=>overrides[key]=e.currentTarget.valueAsNumber}/>
      {:else}<input aria-label={label} type={kind==='date'?'date':'text'} value={overrideValue(key,kind)} oninput={(e)=>overrides[key]=kind==='list'?e.currentTarget.value.split(',').map(v=>v.trim()).filter(Boolean):e.currentTarget.value}/>{/if}{/if}</div>{/each}
    </details>
    {#if dateError}<p role="alert" class="error">{dateError}</p>{/if}
    <footer><button type="button" onclick={onclose}>Cancel</button><button class="primary" type="submit">{busy?'Saving…':bookmark?'Save changes':'Add bookmark'}</button></footer>
   </fieldset>
  </form>
 </div>
</div>
