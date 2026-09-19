<script lang="ts">
 import {statuses,statusLabel,patchBetween,type Bookmark,type Metadata} from './api';
 import Sheet from './Sheet.svelte';
 import Icon from './Icon.svelte';
 import Select from './Select.svelte';
 export let bookmark:Bookmark|null=null;
 export let busy=false;
 export let error='';
 export let onsave:(bookmark:Partial<Bookmark>,patch:Record<string,unknown>,fetch:boolean)=>void;
 export let onclose:()=>void;
 const initial=bookmark?structuredClone(bookmark):null;
 let draft=structuredClone(bookmark||{url:'',title:'',author:'',status:'planned',chapter:0,tags:[],notes:'',rating:0,review_notes:'',created_at:new Date().toISOString(),last_read_at:'0001-01-01T00:00:00Z'}) as Bookmark;
 let tags=(draft.tags||[]).join(', '), fetch=true, dateError='';
 let hoveredRating=0;
 let overrides:Record<string,unknown>=structuredClone(bookmark?.overrides||{});
 let enabled:Record<string,boolean>=Object.fromEntries(Object.keys(overrides).map(k=>[k,true]));
 const localDate=(value:string)=>{if(!value||value.startsWith('0001'))return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,19);};
 let added=localDate(draft.created_at), lastRead=localDate(draft.last_read_at);
 const originalAdded=added, originalLastRead=lastRead;
 const metadataFields=[['summary','Summary','text'],['fandoms','Fandoms','list'],['tags','Story tags','list'],['language','Language','text'],['rating','Age rating','text'],['words','Words','number'],['chapters','Available chapters','number'],['total_chapters','Planned chapters','number'],['complete','Finished story','bool'],['published','First published','date'],['updated','Last updated','date']];
 function overrideValue(key:string,kind:string){const v=overrides[key]??bookmark?.effective?.[key as keyof Metadata];return kind==='list'?((v||[]) as string[]).join(', '):String(v??'');}
 function toggle(key:string,kind:string,checked:boolean){enabled={...enabled,[key]:checked};if(checked&&overrides[key]===undefined)overrides[key]=bookmark?.effective?.[key as keyof Metadata]??(kind==='list'?[]:kind==='number'?0:kind==='bool'?false:'');}
 function save(){
  draft.tags=tags.split(',').map(t=>t.trim()).filter(Boolean);dateError='';
  if(initial){
   if(!added){dateError='Choose the day you saved this story.';return;}
   if(added!==originalAdded)draft.created_at=new Date(added).toISOString();
   if(lastRead!==originalLastRead)draft.last_read_at=lastRead?new Date(lastRead).toISOString():'0001-01-01T00:00:00Z';
  }
  const next:Record<string,unknown>={};for(const key of Object.keys(enabled))if(enabled[key])next[key]=overrides[key];
  const patch=initial?patchBetween(initial,draft):{};
  if(JSON.stringify(next)!==JSON.stringify(initial?.overrides||{})){patch.ResetOverrides='all';patch.Overrides=next;}
  draft.overrides=next as Partial<Metadata>;onsave(draft,patch,fetch);
 }
</script>
<Sheet title={bookmark?'Edit bookmark':'Add story'} {busy} {error} {onclose}>
 <form onsubmit={(e)=>{e.preventDefault();save();}}>
  <fieldset disabled={busy}>
   {#if !bookmark}
    <label>Story link<input type="url" required placeholder="Paste an AO3 or FanFiction.net link" bind:value={draft.url}/></label>
    <label class="toggle"><input type="checkbox" bind:checked={fetch}/><span>Fetch details automatically<small>Turn off to save offline.</small></span></label>
   {/if}
   <div class="form-grid"><label>Title<input bind:value={draft.title} placeholder={fetch&&!bookmark?'Automatic':'Story title'}/></label><label>Author<input bind:value={draft.author} placeholder="Author name"/></label></div>
   <div class="form-grid"><label>Status<Select label="Status" bind:value={draft.status} options={statuses.map(s=>[s,statusLabel(s)])}/></label><label>Last chapter read<input type="number" min="0" step="1" required bind:value={draft.chapter}/></label></div>
   <div class="rating-field"><span>My rating</span><div class="rating-buttons" role="group" aria-label="My rating" onpointerleave={()=>hoveredRating=0}>{#each [1,2,3,4,5] as n}<button type="button" class="star-button" class:filled={(hoveredRating||draft.rating)>=n} onpointerenter={()=>hoveredRating=n} aria-label={`Rate ${n} ${n===1?'star':'stars'}`} aria-pressed={draft.rating===n} onclick={()=>draft.rating=draft.rating===n?0:n}><Icon name="star" size={32}/></button>{/each}<button type="button" class="text-button" onpointerenter={()=>hoveredRating=0} onclick={()=>draft.rating=0}>Clear</button></div></div>
   <label>My tags<input bind:value={tags} placeholder="Separate with commas"/></label>
   <label>Notes<textarea rows="3" bind:value={draft.notes} placeholder="Add a note"></textarea></label>
   <details class="disclosure"><summary>Review<Icon name="plus"/></summary><label>Your review<textarea rows="4" bind:value={draft.review_notes} placeholder="Add a review"></textarea></label></details>
   {#if bookmark}<details class="disclosure"><summary>Dates<Icon name="plus"/></summary><div class="form-grid"><label>Saved on<input type="datetime-local" step="1" required bind:value={added}/></label><label>Last read on<input type="datetime-local" step="1" bind:value={lastRead}/></label></div><button class="text-button" type="button" onclick={()=>lastRead=''}>Clear last-read date</button><p class="hint">Changing the chapter updates the last-read date.</p></details>{/if}
   <details class="disclosure"><summary>Custom details<Icon name="plus"/></summary><p class="hint">Override selected details. Switch off to restore the original.</p>
    <button type="button" class="text-button" onclick={()=>enabled={}}>Reset custom details</button>
    {#each metadataFields as [key,label,kind]}<div class="override-row"><label class="toggle"><input type="checkbox" checked={!!enabled[key]} onchange={(e)=>toggle(key,kind,e.currentTarget.checked)}/><span>{label}</span></label>
     {#if enabled[key]}{#if kind==='bool'}<Select label={`My ${label}`} value={overrides[key]??false} onchange={v=>overrides[key]=v} options={[[false,'Still being written'],[true,'Finished']]}/>
     {:else if kind==='number'}<input aria-label={`My ${label}`} type="number" min="0" step="1" required value={Number(overrides[key]||0)} oninput={(e)=>overrides[key]=e.currentTarget.valueAsNumber}/>
     {:else if key==='summary'}<textarea aria-label={`My ${label}`} rows="3" value={overrideValue(key,kind)} oninput={(e)=>overrides[key]=e.currentTarget.value}></textarea>
     {:else}<input aria-label={`My ${label}`} placeholder={kind==='list'?'Separate with commas':''} type={kind==='date'?'date':'text'} value={overrideValue(key,kind)} oninput={(e)=>overrides[key]=kind==='list'?e.currentTarget.value.split(',').map(v=>v.trim()).filter(Boolean):e.currentTarget.value}/>{/if}{/if}</div>{/each}
   </details>
   {#if dateError}<p role="alert">{dateError}</p>{/if}
   <div class="form-actions"><button type="button" class="quiet" onclick={onclose}>Cancel</button><button class="primary" type="submit"><Icon name="check"/>{bookmark?'Save changes':'Save story'}</button></div>
  </fieldset>
 </form>
</Sheet>
